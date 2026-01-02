// Translation Service - Direct client-side translation
//
// NOTE:
// This app used to call a backend translation API.
// To support a backend-free deployment, we call public translation providers directly
// according to config/translationMappings.json.
import translationMappings from '@config/translationMappings.json'

function withTimeout(ms) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ms)
  return { signal: controller.signal, cancel: () => clearTimeout(timeout) }
}

async function tryLingva(text, fromLang, toLang, timeoutMs) {
  const endpoint = translationMappings.apiEndpoints.lingva
  if (!endpoint?.enabled) return null

  const url = `${endpoint.baseUrl}/${fromLang}/${toLang}/${encodeURIComponent(text)}`
  const { signal, cancel } = withTimeout(timeoutMs)
  try {
    const res = await fetch(url, { method: 'GET', signal })
    if (!res.ok) return null
    const data = await res.json()
    const translation = data?.translation
    if (translation && translation !== text) return translation
    return null
  } catch {
    return null
  } finally {
    cancel()
  }
}

async function tryMyMemory(text, fromLang, toLang, timeoutMs) {
  const endpoint = translationMappings.apiEndpoints.mymemory
  if (!endpoint?.enabled) return null

  const url = `${endpoint.baseUrl}?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`
  const { signal, cancel } = withTimeout(timeoutMs)
  try {
    const res = await fetch(url, { method: 'GET', signal })
    if (!res.ok) return null
    const data = await res.json()
    const translation = data?.responseData?.translatedText
    if (translation && translation !== text) return translation
    return null
  } catch {
    return null
  } finally {
    cancel()
  }
}

async function tryLibreTranslate(text, fromLang, toLang, timeoutMs) {
  const endpoint = translationMappings.apiEndpoints.libretranslate
  if (!endpoint?.enabled) return null

  const { signal, cancel } = withTimeout(timeoutMs)
  try {
    const res = await fetch(endpoint.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source: fromLang, target: toLang, format: 'text' }),
      signal,
    })
    if (!res.ok) return null
    const data = await res.json()
    const translation = data?.translatedText
    if (translation && translation !== text) return translation
    return null
  } catch {
    return null
  } finally {
    cancel()
  }
}

class TranslationService {
  constructor() {
    this.mappings = translationMappings
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
    return pair && pair.enabled
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
  async translateText(text, fromLang = 'en', toLang = 'ja') {
    // Validate language pair
    if (!this.isTranslationPairSupported(fromLang, toLang)) {
      console.warn(`Translation pair ${fromLang}-${toLang} is not supported`)
      throw new Error(`Translation pair ${fromLang}-${toLang} is not supported`)
    }

    const pairKey = `${fromLang}-${toLang}`
    const pair = this.mappings.translationPairs[pairKey]
    const providers = pair?.apiProviders || ['lingva', 'mymemory', 'libretranslate']

    const timeoutMs = 5000
    for (const provider of providers) {
      const trimmed = String(text ?? '')
      if (!trimmed) return ''

      let result = null
      if (provider === 'lingva') result = await tryLingva(trimmed, fromLang, toLang, timeoutMs)
      else if (provider === 'mymemory') result = await tryMyMemory(trimmed, fromLang, toLang, timeoutMs)
      else if (provider === 'libretranslate') result = await tryLibreTranslate(trimmed, fromLang, toLang, timeoutMs)

      if (result) return result
    }

    throw new Error('Translation failed (no provider succeeded). This may be a CORS/network issue.')
  }

  /**
   * Translate multiple texts in batch
   * @param {Array<string>} texts - Array of texts to translate
   * @param {string} fromLang - Source language code
   * @param {string} toLang - Target language code
   * @returns {Promise<Array>} Array of translation results
   */
  async translateBatch(texts, fromLang = 'en', toLang = 'ja') {
    // Validate language pair
    if (!this.isTranslationPairSupported(fromLang, toLang)) {
      console.warn(`Translation pair ${fromLang}-${toLang} is not supported`)
      return texts.map(text => ({ original: text, translation: text }))
    }

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
    // Validate language pair
    if (!this.isTranslationPairSupported(sourceLang, targetLang)) {
      console.warn(`Translation pair ${sourceLang}-${targetLang} is not supported`)
      return text
    }

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
