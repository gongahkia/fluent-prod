import translationMappings from "@config/translationMappings.json"
import { withTimeout } from "./translationPipeline"

export const TRANSLATION_PROVIDER_IDS = {
  LINGVA: "lingva",
  MYMEMORY: "mymemory",
  LIBRETRANSLATE: "libretranslate",
}

const SUPPORTED_TRANSLATION_PROVIDERS = new Set(Object.values(TRANSLATION_PROVIDER_IDS))

function normalizeProviderId(providerId) {
  return String(providerId || "").trim().toLowerCase()
}

function buildProviderRequest(providerId, text, fromLang, toLang, mappings) {
  if (providerId === TRANSLATION_PROVIDER_IDS.LINGVA) {
    const endpoint = mappings.apiEndpoints.lingva
    if (!endpoint?.enabled) return null
    return {
      url: `${endpoint.baseUrl}/${fromLang}/${toLang}/${encodeURIComponent(text)}`,
      options: { method: "GET" },
      extract: (data) => data?.translation || "",
    }
  }

  if (providerId === TRANSLATION_PROVIDER_IDS.MYMEMORY) {
    const endpoint = mappings.apiEndpoints.mymemory
    if (!endpoint?.enabled) return null
    return {
      url: `${endpoint.baseUrl}?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`,
      options: { method: "GET" },
      extract: (data) => data?.responseData?.translatedText || "",
    }
  }

  if (providerId === TRANSLATION_PROVIDER_IDS.LIBRETRANSLATE) {
    const endpoint = mappings.apiEndpoints.libretranslate
    if (!endpoint?.enabled) return null
    return {
      url: endpoint.baseUrl,
      options: {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          source: fromLang,
          target: toLang,
          format: "text",
        }),
      },
      extract: (data) => data?.translatedText || "",
    }
  }

  return null
}

export async function requestProviderTranslation(
  providerId,
  text,
  fromLang,
  toLang,
  timeoutMs = 5000,
  mappings = translationMappings
) {
  const normalizedProviderId = normalizeProviderId(providerId)
  if (!SUPPORTED_TRANSLATION_PROVIDERS.has(normalizedProviderId)) return null

  const request = buildProviderRequest(normalizedProviderId, text, fromLang, toLang, mappings)
  if (!request) return null

  const { signal, cancel } = withTimeout(timeoutMs)
  try {
    const response = await fetch(request.url, {
      ...request.options,
      signal,
    })
    if (!response.ok) return null
    const data = await response.json()
    const translation = request.extract(data)
    if (!translation || translation === text) return null
    return translation
  } catch {
    return null
  } finally {
    cancel()
  }
}

export function createTranslationProviderClient({
  mappings = translationMappings,
  timeoutMs = 5000,
} = {}) {
  return {
    getSupportedProviders() {
      return [...SUPPORTED_TRANSLATION_PROVIDERS]
    },

    isProviderSupported(providerId) {
      return SUPPORTED_TRANSLATION_PROVIDERS.has(normalizeProviderId(providerId))
    },

    async translateWithProvider(providerId, text, fromLang, toLang) {
      return requestProviderTranslation(
        providerId,
        text,
        fromLang,
        toLang,
        timeoutMs,
        mappings
      )
    },
  }
}
