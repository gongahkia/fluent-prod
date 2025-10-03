// Translation Service - Backend API Client
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

class TranslationService {
  /**
   * Translate text between languages
   * @param {string} text - Text to translate
   * @param {string} fromLang - Source language code
   * @param {string} toLang - Target language code
   * @returns {Promise<string>} Translated text
   */
  async translateText(text, fromLang = 'en', toLang = 'ja') {
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
      return data.translation || text
    } catch (error) {
      console.error('Translation error:', error)
      return text // Return original text on error
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
   * @param {number} userLevel - User's learning level (1-10)
   * @returns {Promise<string>} JSON string with text and metadata
   */
  async createMixedLanguageContent(text, userLevel = 5) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/translate/mixed-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, userLevel })
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
   * Check if text contains Japanese characters
   * @param {string} text - Text to check
   * @returns {boolean} True if text contains Japanese
   */
  containsJapanese(text) {
    return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)
  }

  /**
   * Check if text is English only
   * @param {string} text - Text to check
   * @returns {boolean} True if text is English only
   */
  isEnglishOnly(text) {
    return /^[a-zA-Z\s.,!?;:"'()[\]{}—–-]+$/.test(text)
  }
}

export default new TranslationService()
