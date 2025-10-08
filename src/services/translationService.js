// Translation Service - Backend API Client
import translationMappings from '../config/translationMappings.json'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

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

    try {
      const response = await fetch(`${API_BASE_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, fromLang, toLang })
      })

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.statusText}`)
      }

      const data = await response.json()
      // Backend returns { original, translation, fromLang, toLang, ... }
      return data.translation || text
    } catch (error) {
      console.error('Translation error:', error)
      throw error // Throw error so caller knows translation failed
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
    // Validate language pair
    if (!this.isTranslationPairSupported(fromLang, toLang)) {
      console.warn(`Translation pair ${fromLang}-${toLang} is not supported`)
      return texts.map(text => ({ original: text, translation: text }))
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/translate/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts, fromLang, toLang })
      })

      if (!response.ok) {
        throw new Error(`Batch translation failed: ${response.statusText}`)
      }

      const data = await response.json()
      return data.translations || []
    } catch (error) {
      console.error('Batch translation error:', error)
      return texts.map(text => ({ original: text, translation: text }))
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

    try {
      const response = await fetch(`${API_BASE_URL}/api/translate/mixed-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, userLevel, targetLang, sourceLang })
      })

      if (!response.ok) {
        throw new Error(`Mixed content creation failed: ${response.statusText}`)
      }

      const data = await response.json()
      return JSON.stringify(data)
    } catch (error) {
      console.error('Mixed content creation error:', error)
      return text // Return original text on error
    }
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
   * Check if text contains Korean characters
   * @param {string} text - Text to check
   * @returns {boolean} True if text contains Korean
   */
  containsKorean(text) {
    return this.containsLanguageCharacters(text, 'ko')
  }

  /**
   * Check if text contains target language characters
   * @param {string} text - Text to check
   * @param {string} languageCode - Language code (ja, ko, etc.)
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
