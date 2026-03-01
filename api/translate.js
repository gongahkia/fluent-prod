import crypto from "node:crypto"
import {
  recordFallback,
  recordProviderFailure,
  recordProviderSuccess,
  recordRequest,
} from "./translateMetrics.js"

function json(res, status, payload) {
  res.statusCode = status
  res.setHeader("Content-Type", "application/json")
  res.end(JSON.stringify(payload))
}

const PROVIDER_TIMEOUT_MS = 3000
const CACHE_TTL_MS = Number.parseInt(process.env.TRANSLATE_CACHE_TTL_MS || "600000", 10)
const CACHE_MAX_ENTRIES = Number.parseInt(process.env.TRANSLATE_CACHE_MAX_ENTRIES || "500", 10)
const RATE_LIMIT_WINDOW_MS = Number.parseInt(process.env.TRANSLATE_RATE_LIMIT_WINDOW_MS || "60000", 10)
const RATE_LIMIT_MAX_REQUESTS = Number.parseInt(process.env.TRANSLATE_RATE_LIMIT_MAX_REQUESTS || "60", 10)
const LATENCY_SAMPLE_SIZE = Number.parseInt(process.env.TRANSLATE_LATENCY_SAMPLE_SIZE || "500", 10)
const CIRCUIT_BREAKER_FAIL_THRESHOLD = Number.parseInt(process.env.TRANSLATE_CB_FAIL_THRESHOLD || "3", 10)
const CIRCUIT_BREAKER_COOLDOWN_MS = Number.parseInt(process.env.TRANSLATE_CB_COOLDOWN_MS || "60000", 10)
const translationCache = new Map()
const rateLimitStore = new Map()
const requestLatencySamples = []
const VALID_PROVIDERS = new Set(["lingva", "mymemory", "libretranslate"])
const providerCircuitState = new Map()

function createProviderError(code, message, extras = {}) {
  const error = new Error(message)
  error.code = code
  Object.assign(error, extras)
  return error
}

async function loadZod() {
  try {
    const module = await import("zod")
    return module.z
  } catch {
    return null
  }
}

async function parseRequestBody(input) {
  const z = await loadZod()
  if (z) {
    const requestSchema = z.object({
      text: z.string().trim().min(1),
      fromLang: z.string().trim().min(2).max(12).optional().default("en"),
      toLang: z.string().trim().min(2).max(12).optional().default("ja"),
    })
    return requestSchema.safeParse(input || {})
  }

  const text = String(input?.text || "").trim()
  const fromLang = String(input?.fromLang || "en").trim()
  const toLang = String(input?.toLang || "ja").trim()
  if (!text) return { success: false, error: { issues: [{ message: "text is required" }] } }
  if (fromLang.length < 2 || toLang.length < 2) {
    return { success: false, error: { issues: [{ message: "Invalid language code" }] } }
  }
  return { success: true, data: { text, fromLang, toLang } }
}

async function parseResponseBody(input) {
  const z = await loadZod()
  if (z) {
    const responseSchema = z.object({
      translation: z.string().trim().min(1),
      provider: z.enum(["lingva", "mymemory", "libretranslate"]),
    })
    return responseSchema.parse(input)
  }

  const translation = String(input?.translation || "").trim()
  const provider = String(input?.provider || "").trim()
  if (!translation || !VALID_PROVIDERS.has(provider)) {
    throw new Error("Invalid response payload")
  }
  return { translation, provider }
}

function logEvent(event, payload = {}) {
  console.log(JSON.stringify({ event, ...payload }))
}

function getPercentile(samples, percentile) {
  if (!samples.length) return 0
  const sorted = [...samples].sort((a, b) => a - b)
  const index = Math.max(0, Math.min(sorted.length - 1, Math.ceil((percentile / 100) * sorted.length) - 1))
  return sorted[index]
}

function recordRequestLatency(durationMs) {
  requestLatencySamples.push(durationMs)
  if (requestLatencySamples.length > LATENCY_SAMPLE_SIZE) {
    requestLatencySamples.shift()
  }

  return {
    p50Ms: getPercentile(requestLatencySamples, 50),
    p95Ms: getPercentile(requestLatencySamples, 95),
  }
}

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

function getProviderCircuit(providerId) {
  if (!providerCircuitState.has(providerId)) {
    providerCircuitState.set(providerId, { failures: 0, openUntil: 0 })
  }
  return providerCircuitState.get(providerId)
}

function isCircuitOpen(providerId) {
  const state = getProviderCircuit(providerId)
  return Date.now() < state.openUntil
}

function markProviderFailure(providerId) {
  const state = getProviderCircuit(providerId)
  state.failures += 1
  if (state.failures >= CIRCUIT_BREAKER_FAIL_THRESHOLD) {
    state.openUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN_MS
  }
  providerCircuitState.set(providerId, state)
}

function markProviderSuccess(providerId) {
  const state = getProviderCircuit(providerId)
  state.failures = 0
  state.openUntil = 0
  providerCircuitState.set(providerId, state)
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createProviderError("TIMEOUT", "Provider request timed out")
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

async function translateWithLingva(text, fromLang, toLang) {
  const baseUrl = process.env.LINGVA_BASE_URL || "https://lingva.ml/api/v1"
  const url = `${baseUrl}/${fromLang}/${toLang}/${encodeURIComponent(text)}`
  const response = await fetchWithTimeout(url, { method: "GET" })
  if (!response.ok) {
    throw createProviderError(
      response.status >= 500 ? "UPSTREAM_5XX" : "UPSTREAM_4XX",
      `Lingva request failed with status ${response.status}`,
      { status: response.status }
    )
  }

  const data = await response.json()
  return data?.translation || ""
}

async function translateWithMyMemory(text, fromLang, toLang) {
  const baseUrl = process.env.MYMEMORY_BASE_URL || "https://api.mymemory.translated.net/get"
  const url = `${baseUrl}?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`
  const response = await fetchWithTimeout(url, { method: "GET" })
  if (!response.ok) {
    throw createProviderError(
      response.status >= 500 ? "UPSTREAM_5XX" : "UPSTREAM_4XX",
      `MyMemory request failed with status ${response.status}`,
      { status: response.status }
    )
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
    throw createProviderError(
      response.status >= 500 ? "UPSTREAM_5XX" : "UPSTREAM_4XX",
      `LibreTranslate request failed with status ${response.status}`,
      { status: response.status }
    )
  }

  const data = await response.json()
  return data?.translatedText || ""
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"]
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim()
  }

  return req.socket?.remoteAddress || "unknown"
}

function isRateLimited(ip) {
  const now = Date.now()
  const record = rateLimitStore.get(ip)

  if (!record || now - record.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { windowStart: now, count: 1 })
    return false
  }

  record.count += 1
  rateLimitStore.set(ip, record)
  return record.count > RATE_LIMIT_MAX_REQUESTS
}

export default async function handler(req, res) {
  const requestStartedAt = Date.now()
  recordRequest()
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" })
  }

  const ip = getClientIp(req)
  if (isRateLimited(ip)) {
    logEvent("translate.request.rate_limited", { ip })
    return json(res, 429, { error: "Rate limit exceeded" })
  }

  let body = req.body
  if (typeof body === "string") {
    try {
      body = JSON.parse(body)
    } catch {
      return json(res, 400, { error: "Invalid JSON body" })
    }
  }

  const parsedRequest = await parseRequestBody(body || {})
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
    const requestDurationMs = Date.now() - requestStartedAt
    const latencies = recordRequestLatency(requestDurationMs)
    logEvent("translate.request.success", {
      provider: cached.provider,
      status: 200,
      durationMs: requestDurationMs,
      p50Ms: latencies.p50Ms,
      p95Ms: latencies.p95Ms,
    })
    return json(res, 200, await parseResponseBody({
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
      if (isCircuitOpen(provider.id)) {
        continue
      }
      const providerStartedAt = Date.now()
      try {
        const translation = await provider.run(text, fromLang, toLang)
        const sanitizedTranslation = sanitizeTranslation(translation)
        if (sanitizedTranslation && sanitizedTranslation !== text) {
          const parsedResponse = await parseResponseBody({
            translation: sanitizedTranslation,
            provider: provider.id,
          })

          writeToCache(cacheKey, parsedResponse)
          markProviderSuccess(provider.id)
          recordProviderSuccess(provider.id)
          if (provider.id !== "lingva") {
            recordFallback()
          }
          const requestDurationMs = Date.now() - requestStartedAt
          const latencies = recordRequestLatency(requestDurationMs)
          logEvent("translate.provider.success", {
            provider: provider.id,
            status: 200,
            durationMs: Date.now() - providerStartedAt,
          })
          logEvent("translate.request.success", {
            provider: provider.id,
            status: 200,
            durationMs: requestDurationMs,
            p50Ms: latencies.p50Ms,
            p95Ms: latencies.p95Ms,
          })
          return json(res, 200, parsedResponse)
        }
      } catch (error) {
        markProviderFailure(provider.id)
        recordProviderFailure(provider.id, error?.code || "UNKNOWN")
        logEvent("translate.provider.error", {
          provider: provider.id,
          status: error?.status || 502,
          code: error?.code || "UNKNOWN",
          durationMs: Date.now() - providerStartedAt,
        })
        lastError = error
      }
    }

    throw lastError || createProviderError("NO_PROVIDER_SUCCESS", "No provider returned a translation")
  } catch (error) {
    if ((error?.code || "") === "NO_PROVIDER_SUCCESS") {
      recordFallback()
    }
    const requestDurationMs = Date.now() - requestStartedAt
    const latencies = recordRequestLatency(requestDurationMs)
    logEvent("translate.request.error", {
      status: 502,
      code: error?.code || "NO_PROVIDER_SUCCESS",
      durationMs: requestDurationMs,
      p50Ms: latencies.p50Ms,
      p95Ms: latencies.p95Ms,
    })
    return json(res, 502, {
      error: "Translation provider request failed",
      code: error?.code || "NO_PROVIDER_SUCCESS",
      message: error?.message || "Unknown error",
    })
  }
}
