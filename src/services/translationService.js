// Translation Service - Direct client-side translation
//
// NOTE:
// This app used to call a backend translation API.
// To support a backend-free deployment, we call public translation providers directly
// according to config/translationMappings.json.
import translationMappings from '@config/translationMappings.json'
import { normalizeTranslationText, runFallbackProviders, withTimeout } from './translationPipeline'
import { tryLibreTranslate, tryLingva, tryMyMemory } from './translationProviders'
const TRANSLATE_API_URL = import.meta.env.VITE_TRANSLATE_API_URL || '/api/translate'
const TRANSLATION_CACHE_TTL_MS = Number.parseInt(import.meta.env.VITE_TRANSLATION_CACHE_TTL_MS || '600000', 10)
const TRANSLATION_CACHE_MAX_ENTRIES = Number.parseInt(import.meta.env.VITE_TRANSLATION_CACHE_MAX_ENTRIES || '500', 10)
const TRANSLATION_CIRCUIT_BREAKER_FAIL_THRESHOLD = Number.parseInt(import.meta.env.VITE_TRANSLATION_CB_FAIL_THRESHOLD || '3', 10)
const TRANSLATION_CIRCUIT_BREAKER_COOLDOWN_MS = Number.parseInt(import.meta.env.VITE_TRANSLATION_CB_COOLDOWN_MS || '30000', 10)
const TRANSLATION_MAX_CONCURRENT_REQUESTS = Number.parseInt(import.meta.env.VITE_TRANSLATION_MAX_CONCURRENT_REQUESTS || '6', 10)
const TRANSLATION_MAX_QUEUED_REQUESTS = Number.parseInt(import.meta.env.VITE_TRANSLATION_MAX_QUEUED_REQUESTS || '120', 10)
const ALLOWED_TRANSLATION_PAIRS = new Set(['en-ja', 'ja-en'])

export const TRANSLATION_ERROR_CODES = {
  UNSUPPORTED_LANGUAGE_PAIR: 'UNSUPPORTED_LANGUAGE_PAIR',
}

export class UnsupportedLanguagePairError extends Error {
  constructor(fromLang, toLang) {
    const pairKey = `${fromLang}-${toLang}`
    super(`Translation pair ${pairKey} is not supported`)
    this.name = 'UnsupportedLanguagePairError'
    this.code = TRANSLATION_ERROR_CODES.UNSUPPORTED_LANGUAGE_PAIR
    this.errorCode = TRANSLATION_ERROR_CODES.UNSUPPORTED_LANGUAGE_PAIR
    this.pair = pairKey
    this.fromLang = fromLang
    this.toLang = toLang
  }
}

const inFlightTranslations = new Map()
const translationCache = new Map()
const translationRequestQueue = []
let activeTranslationRequests = 0

function readFromTranslationCache(key) {
  const cached = translationCache.get(key)
  if (!cached) return null

  if (Date.now() >= cached.expiresAt) {
    translationCache.delete(key)
    return null
  }

  translationCache.delete(key)
  translationCache.set(key, cached)
  return cached.value
}

function writeToTranslationCache(key, value) {
  if (translationCache.has(key)) {
    translationCache.delete(key)
  }

  translationCache.set(key, {
    value,
    expiresAt: Date.now() + TRANSLATION_CACHE_TTL_MS,
  })

  while (translationCache.size > TRANSLATION_CACHE_MAX_ENTRIES) {
    const oldestKey = translationCache.keys().next().value
    translationCache.delete(oldestKey)
  }
}

function createTranslationCacheKey(text, fromLang, toLang, options = {}) {
  const postHash = String(options?.postHash || '').trim()
  const sentenceIndex = Number.isInteger(options?.sentenceIndex)
    ? options.sentenceIndex
    : Number.NaN

  if (postHash && Number.isInteger(sentenceIndex) && sentenceIndex >= 0) {
    return `${postHash}|${sentenceIndex}|${fromLang}|${toLang}`
  }

  return `${fromLang}|${toLang}|${text}`
}

function runQueuedTranslationTasks() {
  while (
    activeTranslationRequests < TRANSLATION_MAX_CONCURRENT_REQUESTS &&
    translationRequestQueue.length > 0
  ) {
    const queued = translationRequestQueue.shift()
    if (!queued) break
    executeTranslationTaskWithLimit(queued.task)
      .then(queued.resolve)
      .catch(queued.reject)
  }
}

function executeTranslationTaskWithLimit(task) {
  activeTranslationRequests += 1
  return Promise.resolve()
    .then(task)
    .finally(() => {
      activeTranslationRequests = Math.max(0, activeTranslationRequests - 1)
      runQueuedTranslationTasks()
    })
}

function enqueueTranslationTask(task) {
  if (activeTranslationRequests < TRANSLATION_MAX_CONCURRENT_REQUESTS) {
    return executeTranslationTaskWithLimit(task)
  }

  if (translationRequestQueue.length >= TRANSLATION_MAX_QUEUED_REQUESTS) {
    return Promise.reject(new Error('Translation request queue is full. Please retry.'))
  }

  return new Promise((resolve, reject) => {
    translationRequestQueue.push({ task, resolve, reject })
  })
}

function isTransientError(error) {
  const message = String(error?.message || '').toLowerCase()
  return (
    error?.name === 'AbortError' ||
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('failed to fetch') ||
    message.includes('503') ||
    message.includes('502') ||
    message.includes('429')
  )
}

function deterministicJitter(seed, attempt) {
  let hash = 0
  const text = `${seed}|${attempt}`
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  }
  return hash % 120
}

async function withRetry(operation, { maxRetries = 2, baseDelayMs = 200, maxDelayMs = 1200, seed = '' } = {}) {
  let lastError = null
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await operation(attempt)
    } catch (error) {
      lastError = error
      if (attempt >= maxRetries || !isTransientError(error)) {
        throw error
      }

      const expDelay = Math.min(maxDelayMs, baseDelayMs * (2 ** attempt))
      const delay = Math.min(maxDelayMs, expDelay + deterministicJitter(seed, attempt))
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError || new Error('Retry operation failed')
}

async function translateViaApiProxy(text, fromLang, toLang, timeoutMs) {
  const { signal, cancel } = withTimeout(timeoutMs)
  try {
    const res = await fetch(TRANSLATE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, fromLang, toLang }),
      signal,
    })

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new Error(body?.message || `Translation proxy failed (${res.status})`)
    }

    const data = await res.json()
    const translation = normalizeTranslationText(data?.translation)
    if (!translation || translation === text) {
      throw new Error('Translation proxy returned invalid translation')
    }
    return translation
  } finally {
    cancel()
  }
}

class TranslationService {
  constructor() {
    this.mappings = translationMappings
    this.providerCircuitState = new Map()
  }

  normalizeProviderId(providerId) {
    return String(providerId || '').trim().toLowerCase()
  }

  getProviderCircuitState(providerId) {
    const key = this.normalizeProviderId(providerId)
    if (!this.providerCircuitState.has(key)) {
      this.providerCircuitState.set(key, {
        provider: key,
        failureCount: 0,
        openUntil: 0,
        cooldownEndsAt: 0,
        lastFailureAt: 0,
        lastSuccessAt: 0,
        failThreshold: TRANSLATION_CIRCUIT_BREAKER_FAIL_THRESHOLD,
        cooldownMs: TRANSLATION_CIRCUIT_BREAKER_COOLDOWN_MS,
      })
    }
    return this.providerCircuitState.get(key)
  }

  isProviderCircuitOpen(providerId) {
    const state = this.getProviderCircuitState(providerId)
    return Date.now() < state.openUntil
  }

  recordProviderFailure(providerId) {
    const key = this.normalizeProviderId(providerId)
    const state = this.getProviderCircuitState(key)
    const now = Date.now()

    state.failureCount += 1
    state.lastFailureAt = now

    if (state.failureCount >= state.failThreshold) {
      state.cooldownEndsAt = now + state.cooldownMs
      state.openUntil = state.cooldownEndsAt
    }

    this.providerCircuitState.set(key, state)
    return state
  }

  recordProviderSuccess(providerId) {
    const key = this.normalizeProviderId(providerId)
    const state = this.getProviderCircuitState(key)
    state.failureCount = 0
    state.openUntil = 0
    state.cooldownEndsAt = 0
    state.lastSuccessAt = Date.now()
    this.providerCircuitState.set(key, state)
    return state
  }

  assertSupportedTranslationPair(fromLang, toLang) {
    const pairKey = `${fromLang}-${toLang}`
    const pair = this.mappings.translationPairs[pairKey]
    if (!ALLOWED_TRANSLATION_PAIRS.has(pairKey) || !pair?.enabled) {
      throw new UnsupportedLanguagePairError(fromLang, toLang)
    }
    return { pairKey, pair }
  }

  /**
   * Check if a translation pair is supported
   * @param {string} fromLang - Source language code
   * @param {string} toLang - Target language code
   * @returns {boolean} True if pair is supported
   */
  isTranslationPairSupported(fromLang, toLang) {
    const pairKey = `${fromLang}-${toLang}`
    const pair = this.mappings.translationPairs[pairKey]
    return ALLOWED_TRANSLATION_PAIRS.has(pairKey) && Boolean(pair?.enabled)
  }

  /**
   * Get all supported translation pairs
   * @returns {Array} Array of translation pair objects
   */
  getSupportedTranslationPairs() {
    return Object.entries(this.mappings.translationPairs)
      .filter(([_, pair]) => pair.enabled)
      .map(([key, pair]) => ({
        key,
        from: pair.from,
        to: pair.to,
        fromLanguage: this.mappings.languages[pair.from],
        toLanguage: this.mappings.languages[pair.to]
      }))
  }

  /**
   * Get language information
   * @param {string} languageCode - Language code
   * @returns {Object|null} Language information object
   */
  getLanguageInfo(languageCode) {
    return this.mappings.languages[languageCode] || null
  }

  /**
   * Translate text between languages
   * @param {string} text - Text to translate
   * @param {string} fromLang - Source language code
   * @param {string} toLang - Target language code
   * @returns {Promise<string>} Translated text
   */
  async translateText(text, fromLang = 'en', toLang = 'ja', options = {}) {
    const { pair } = this.assertSupportedTranslationPair(fromLang, toLang)
    const providers = pair?.apiProviders || ['lingva', 'mymemory', 'libretranslate']

    const timeoutMs = 5000
    const trimmed = String(text ?? '')
    if (!trimmed) return ''
    const requestKey = createTranslationCacheKey(trimmed, fromLang, toLang, options)
    const cachedValue = readFromTranslationCache(requestKey)
    if (cachedValue) {
      return cachedValue
    }

    if (inFlightTranslations.has(requestKey)) {
      return inFlightTranslations.get(requestKey)
    }

    const task = enqueueTranslationTask(async () => {
      try {
        return await withRetry(
          () => translateViaApiProxy(trimmed, fromLang, toLang, timeoutMs),
          { seed: requestKey }
        )
      } catch {
      const result = await runFallbackProviders({
        providers,
        runProvider: async (provider) => {
        if (this.isProviderCircuitOpen(provider)) {
          return null
        }

        let result = null
        try {
          if (provider === 'lingva') {
            result = await withRetry(
              () => tryLingva(trimmed, fromLang, toLang, timeoutMs),
              { seed: `${requestKey}|lingva` }
            )
          } else if (provider === 'mymemory') {
            result = await withRetry(
              () => tryMyMemory(trimmed, fromLang, toLang, timeoutMs),
              { seed: `${requestKey}|mymemory` }
            )
          } else if (provider === 'libretranslate') {
            result = await withRetry(
              () => tryLibreTranslate(trimmed, fromLang, toLang, timeoutMs),
              { seed: `${requestKey}|libretranslate` }
            )
          }
        } catch {
          this.recordProviderFailure(provider)
          return null
        }

          if (result) {
            this.recordProviderSuccess(provider)
            return normalizeTranslationText(result)
          }
          this.recordProviderFailure(provider)
          return null
        },
      })
      if (result) return result
      }

      throw new Error('Translation failed (proxy and fallback providers unsuccessful).')
    })

    inFlightTranslations.set(requestKey, task)
    try {
      const result = await task
      writeToTranslationCache(requestKey, result)
      return result
    } finally {
      inFlightTranslations.delete(requestKey)
    }
  }

  /**
   * Translate multiple texts in batch
   * @param {Array<string>} texts - Array of texts to translate
   * @param {string} fromLang - Source language code
   * @param {string} toLang - Target language code
   * @returns {Promise<Array>} Array of translation results
   */
  async translateBatch(texts, fromLang = 'en', toLang = 'ja') {
    this.assertSupportedTranslationPair(fromLang, toLang)

    try {
      const results = await Promise.all(
        (texts || []).map(async (t) => {
          try {
            const translation = await this.translateText(t, fromLang, toLang)
            return { original: t, translation }
          } catch {
            return { original: t, translation: t }
          }
        })
      )
      return results
    } catch (error) {
      console.error('Batch translation error:', error)
      return (texts || []).map((t) => ({ original: t, translation: t }))
    }
  }

  /**
   * Create mixed language content for learning
   * @param {string} text - Text to process
   * @param {number} userLevel - User's learning level (1-5)
   * @param {string} targetLang - Target language code
   * @param {string} sourceLang - Source language code (default: 'en')
   * @returns {Promise<string>} JSON string with text and metadata
   */
  async createMixedLanguageContent(text, userLevel = 5, targetLang = 'ja', sourceLang = 'en') {
    this.assertSupportedTranslationPair(sourceLang, targetLang)

    // Backend-free mode: rely on precomputed mixed-language content in the cache.
    // Keep this function as a safe fallback so older code paths don't crash.
    // Returning original text preserves readability.
    return text
  }

  /**
   * Check if text contains characters from a specific language
   * @param {string} text - Text to check
   * @param {string} languageCode - Language code
   * @returns {boolean} True if text contains language characters
   */
  containsLanguageCharacters(text, languageCode) {
    const language = this.mappings.languages[languageCode]
    if (!language) return false
    const regex = new RegExp(language.characterRanges.regex)
    return regex.test(text)
  }

  /**
   * Check if text contains Japanese characters
   * @param {string} text - Text to check
   * @returns {boolean} True if text contains Japanese
   */
  containsJapanese(text) {
    return this.containsLanguageCharacters(text, 'ja')
  }

  /**
   * Check if text contains target language characters
   * @param {string} text - Text to check
   * @param {string} languageCode - Language code (e.g. ja)
   * @returns {boolean} True if text contains target language
   */
  containsTargetLanguage(text, languageCode) {
    return this.containsLanguageCharacters(text, languageCode)
  }

  /**
   * Check if text is English only
   * @param {string} text - Text to check
   * @returns {boolean} True if text is English only
   */
  isEnglishOnly(text) {
    const regex = new RegExp(this.mappings.languages.en.characterRanges.regex)
    return regex.test(text)
  }

  /**
   * Get learning level configuration
   * @param {number} level - Level number (1-5)
   * @returns {Object} Level configuration
   */
  getLevelConfig(level) {
    return this.mappings.learningLevels[level] || this.mappings.learningLevels['1']
  }

  /**
   * Get UI labels for a language
   * @param {string} languageCode - Language code
   * @returns {Object} UI labels object
   */
  getUILabels(languageCode) {
    return this.mappings.uiLabels[languageCode] || {}
  }

  /**
   * Get dictionary fields for a language
   * @param {string} languageCode - Language code
   * @returns {Object} Dictionary fields object
   */
  getDictionaryFields(languageCode) {
    return this.mappings.dictionaryFields[languageCode] || {}
  }
}

export default new TranslationService()
