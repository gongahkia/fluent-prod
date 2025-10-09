// Vocabulary Service - Backend API Client
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

class VocabularyService {
  /**
   * Client-side validation for vocabulary words
   * Kept on frontend for immediate feedback
   * @param {string} word - Word to validate
   * @returns {boolean} True if word is valid vocabulary
   */
  isValidVocabularyWord(word) {
    if (!word || typeof word !== 'string') {
      return false
    }

    const cleanWord = word.toLowerCase().trim()

    // Basic function words to exclude
    const excludeWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be'
    ])

    // Length check
    if (cleanWord.length < 3 || cleanWord.length > 15) {
      return false
    }

    // Check if in exclude list
    if (excludeWords.has(cleanWord)) {
      return false
    }

    // Check for numbers
    if (/^\d+$/.test(cleanWord)) {
      return false
    }

    // Check for special characters (allow apostrophes)
    if (/[^a-zA-Z']/.test(cleanWord)) {
      return false
    }

    return true
  }

  /**
   * Detect vocabulary words in text using NLP
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} Vocabulary words with translations
   */
  async detectVocabulary(text) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vocabulary/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })

      if (!response.ok) {
        throw new Error(`Vocabulary detection failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Vocabulary detection error:', error)
      return { vocabulary: [] }
    }
  }

  /**
   * Get vocabulary information for a single word
   * @param {string} word - Word to look up
   * @param {string} type - Word type (noun, verb, etc.)
   * @param {string} context - Context for the word
   * @returns {Promise<Object>} Vocabulary word information
   */
  async getVocabularyWord(word, type = 'unknown', context = '') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vocabulary/word`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, type, context })
      })

      if (!response.ok) {
        throw new Error(`Vocabulary word lookup failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Vocabulary word lookup error:', error)
      return {
        english: word,
        japanese: word,
        type: 'unknown',
        level: 5,
        isVocabulary: false
      }
    }
  }

  /**
   * Get vocabulary statistics for text
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} Vocabulary statistics
   */
  async getVocabularyStats(text) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vocabulary/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })

      if (!response.ok) {
        throw new Error(`Vocabulary stats failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Vocabulary stats error:', error)
      return {
        totalWords: 0,
        byType: {},
        byLevel: {},
        averageLevel: 0,
        vocabulary: []
      }
    }
  }

  /**
   * Validate word using backend
   * @param {string} word - Word to validate
   * @returns {Promise<boolean>} True if word is valid vocabulary
   */
  async validateWord(word) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vocabulary/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word })
      })

      if (!response.ok) {
        return this.isValidVocabularyWord(word) // Fallback to client-side validation
      }

      const data = await response.json()
      return data.isValid
    } catch (error) {
      console.error('Vocabulary validation error:', error)
      return this.isValidVocabularyWord(word) // Fallback to client-side validation
    }
  }
}

export default new VocabularyService()
