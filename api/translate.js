import { z } from "zod"

function json(res, status, payload) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(payload))
}

const PROVIDER_TIMEOUT_MS = 3000
const requestSchema = z.object({
  text: z.string().trim().min(1),
  fromLang: z.string().trim().min(2).max(12).optional().default("en"),
  toLang: z.string().trim().min(2).max(12).optional().default("ja"),
})

const responseSchema = z.object({
  translation: z.string().trim().min(1),
  provider: z.enum(["lingva", "mymemory", "libretranslate"]),
})

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
        if (translation && translation !== text) {
          const parsedResponse = responseSchema.parse({
            translation,
            provider: provider.id,
          })

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
