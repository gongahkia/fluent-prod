import { z } from "zod"
import crypto from "node:crypto"

function json(res, status, payload) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(payload))
}

const PROVIDER_TIMEOUT_MS = 3000
const CACHE_TTL_MS = Number.parseInt(process.env.TRANSLATE_CACHE_TTL_MS || "600000", 10)
const CACHE_MAX_ENTRIES = Number.parseInt(process.env.TRANSLATE_CACHE_MAX_ENTRIES || "500", 10)
const translationCache = new Map()
const requestSchema = z.object({
  text: z.string().trim().min(1),
  fromLang: z.string().trim().min(2).max(12).optional().default("en"),
  toLang: z.string().trim().min(2).max(12).optional().default("ja"),
})

const responseSchema = z.object({
  translation: z.string().trim().min(1),
  provider: z.enum(["lingva", "mymemory", "libretranslate"]),
})

function sanitizeTranslation(rawText) {
  let text = String(rawText || "")

  text = text
    .replace(/\\"/g, "\"")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)))

  // Remove lone surrogate code units that render as malformed unicode.
  text = text.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, "")
  text = text.replace(/(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "$1")

  return text.normalize("NFKC").trim()
}

function createCacheKey(text, fromLang, toLang) {
  return crypto.createHash("sha256").update(`${text}|${fromLang}|${toLang}`).digest("hex")
}

function readFromCache(key) {
  const cached = translationCache.get(key)
  if (!cached) return null

  if (Date.now() >= cached.expiresAt) {
    translationCache.delete(key)
    return null
  }

  // Touch entry to maintain LRU ordering.
  translationCache.delete(key)
  translationCache.set(key, cached)
  return cached
}

function writeToCache(key, value) {
  if (translationCache.has(key)) {
    translationCache.delete(key)
  }

  translationCache.set(key, {
    ...value,
    expiresAt: Date.now() + CACHE_TTL_MS,
  })

  while (translationCache.size > CACHE_MAX_ENTRIES) {
    const oldestKey = translationCache.keys().next().value
    translationCache.delete(oldestKey)
  }
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

async function translateWithLingva(text, fromLang, toLang) {
  const baseUrl = process.env.LINGVA_BASE_URL || "https://lingva.ml/api/v1"
  const url = `${baseUrl}/${fromLang}/${toLang}/${encodeURIComponent(text)}`
  const response = await fetchWithTimeout(url, { method: "GET" })
  if (!response.ok) {
    throw new Error(`Lingva request failed with status ${response.status}`)
  }

  const data = await response.json()
  return data?.translation || ""
}

async function translateWithMyMemory(text, fromLang, toLang) {
  const baseUrl = process.env.MYMEMORY_BASE_URL || "https://api.mymemory.translated.net/get"
  const url = `${baseUrl}?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`
  const response = await fetchWithTimeout(url, { method: "GET" })
  if (!response.ok) {
    throw new Error(`MyMemory request failed with status ${response.status}`)
  }

  const data = await response.json()
  return data?.responseData?.translatedText || ""
}

async function translateWithLibreTranslate(text, fromLang, toLang) {
  const baseUrl = process.env.LIBRETRANSLATE_BASE_URL || "https://libretranslate.com/translate"
  const response = await fetchWithTimeout(baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: text,
      source: fromLang,
      target: toLang,
      format: "text",
    }),
  })
  if (!response.ok) {
    throw new Error(`LibreTranslate request failed with status ${response.status}`)
  }

  const data = await response.json()
  return data?.translatedText || ""
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" })
  }

  let body = req.body
  if (typeof body === "string") {
    try {
      body = JSON.parse(body)
    } catch {
      return json(res, 400, { error: "Invalid JSON body" })
    }
  }

  const parsedRequest = requestSchema.safeParse(body || {})
  if (!parsedRequest.success) {
    return json(res, 400, {
      error: "Invalid request body",
      issues: parsedRequest.error.issues,
    })
  }
  const { text, fromLang, toLang } = parsedRequest.data
  const cacheKey = createCacheKey(text, fromLang, toLang)

  const cached = readFromCache(cacheKey)
  if (cached) {
    return json(res, 200, responseSchema.parse({
      translation: cached.translation,
      provider: cached.provider,
    }))
  }

  try {
    const providers = [
      { id: "lingva", run: translateWithLingva },
      { id: "mymemory", run: translateWithMyMemory },
      { id: "libretranslate", run: translateWithLibreTranslate },
    ]

    let lastError = null
    for (const provider of providers) {
      try {
        const translation = await provider.run(text, fromLang, toLang)
        const sanitizedTranslation = sanitizeTranslation(translation)
        if (sanitizedTranslation && sanitizedTranslation !== text) {
          const parsedResponse = responseSchema.parse({
            translation: sanitizedTranslation,
            provider: provider.id,
          })

          writeToCache(cacheKey, parsedResponse)
          return json(res, 200, parsedResponse)
        }
      } catch (error) {
        lastError = error
      }
    }

    throw lastError || new Error("No provider returned a translation")
  } catch (error) {
    return json(res, 502, {
      error: "Translation provider request failed",
      message: error?.message || "Unknown error",
    })
  }
}
