import nlp from "compromise"
import translationService from "./translationService"

class VocabularyService {
  constructor() {
    this.vocabularyCache = new Map()

    // Define what we consider "vocabulary words" worth translating
    this.vocabularyCategories = {
      nouns: true, // Objects, places, concepts
      verbs: true, // Actions
      adjectives: true, // Descriptive words
      adverbs: true, // Manner, time, place descriptors
      properNouns: true, // Names, places (sometimes useful for learners)
    }

    // Words to exclude from vocabulary detection (only the most basic function words)
    this.excludeWords = new Set([
      // Only the absolute most basic function words
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
      "of", "with", "by", "from", "as", "is", "are", "was", "were", "be"
    ])

    // Minimum word length for vocabulary consideration
    this.minWordLength = 3

    // Maximum word length (to avoid very long technical terms)
    this.maxWordLength = 15
  }

  /**
   * Detect vocabulary words in English text using NLP
   * @param {string} text - The text to analyze
   * @returns {Array} Array of vocabulary word objects with translations
   */
  async detectVocabulary(text) {
    try {
      // Parse the text with compromise
      const doc = nlp(text)

      // Extract different types of vocabulary words
      const vocabulary = []

      // Get nouns (excluding very common ones)
      if (this.vocabularyCategories.nouns) {
        const nouns = doc.nouns().out("array")
        for (const noun of nouns) {
          if (this.isValidVocabularyWord(noun)) {
            const vocabWord = await this.createVocabularyWord(
              noun,
              "noun",
              text
            )
            if (vocabWord) vocabulary.push(vocabWord)
          }
        }
      }

      // Get verbs (excluding auxiliaries and very basic ones)
      if (this.vocabularyCategories.verbs) {
        const verbs = doc.verbs().not("#Auxiliary").out("array")
        for (const verb of verbs) {
          if (this.isValidVocabularyWord(verb)) {
            const vocabWord = await this.createVocabularyWord(
              verb,
              "verb",
              text
            )
            if (vocabWord) vocabulary.push(vocabWord)
          }
        }
      }

      // Get adjectives
      if (this.vocabularyCategories.adjectives) {
        const adjectives = doc.adjectives().out("array")
        for (const adjective of adjectives) {
          if (this.isValidVocabularyWord(adjective)) {
            const vocabWord = await this.createVocabularyWord(
              adjective,
              "adjective",
              text
            )
            if (vocabWord) vocabulary.push(vocabWord)
          }
        }
      }

      // Get adverbs (excluding very common ones)
      if (this.vocabularyCategories.adverbs) {
        const adverbs = doc.adverbs().not("#QuestionWord").out("array")
        for (const adverb of adverbs) {
          if (this.isValidVocabularyWord(adverb)) {
            const vocabWord = await this.createVocabularyWord(
              adverb,
              "adverb",
              text
            )
            if (vocabWord) vocabulary.push(vocabWord)
          }
        }
      }

      // Get proper nouns (names, places, etc.)
      if (this.vocabularyCategories.properNouns) {
        const properNouns = doc
          .people()
          .out("array")
          .concat(doc.places().out("array"))
        for (const properNoun of properNouns) {
          if (this.isValidVocabularyWord(properNoun)) {
            const vocabWord = await this.createVocabularyWord(
              properNoun,
              "properNoun",
              text
            )
            if (vocabWord) vocabulary.push(vocabWord)
          }
        }
      }

      // Remove duplicates and sort by relevance
      const uniqueVocabulary = this.deduplicateAndSort(vocabulary)

      return uniqueVocabulary
    } catch (error) {
      console.error("Vocabulary detection error:", error)
      return []
    }
  }

  /**
   * Check if a word is worth including as vocabulary
   * @param {string} word - The word to check
   * @returns {boolean} Whether the word is valid vocabulary
   */
  isValidVocabularyWord(word) {
    if (!word || typeof word !== "string") return false

    const cleanWord = word.toLowerCase().trim()

    // Check length constraints
    if (
      cleanWord.length < this.minWordLength ||
      cleanWord.length > this.maxWordLength
    ) {
      return false
    }

    // Check if it's in our exclude list
    if (this.excludeWords.has(cleanWord)) {
      return false
    }

    // Exclude pure numbers
    if (/^\d+$/.test(cleanWord)) {
      return false
    }

    // Exclude words with special characters (except apostrophes)
    if (/[^a-zA-Z']/.test(cleanWord)) {
      return false
    }

    // Exclude single letters or very short words
    if (cleanWord.length <= 2) {
      return false
    }

    return true
  }

  /**
   * Create a vocabulary word object with translation
   * @param {string} word - The English word
   * @param {string} type - The word type (noun, verb, etc.)
   * @param {string} context - The original text context
   * @returns {Object|null} Vocabulary word object or null if translation fails
   */
  async createVocabularyWord(word, type, context = "") {
    const cleanWord = word.toLowerCase().trim()
    const cacheKey = `${cleanWord}_${type}`

    // Check cache first
    if (this.vocabularyCache.has(cacheKey)) {
      return this.vocabularyCache.get(cacheKey)
    }

    try {
      // Get Japanese translation
      const japaneseTranslation = await translationService.translateText(
        cleanWord,
        "en",
        "ja"
      )

      // Skip if translation failed or is the same as the original
      if (!japaneseTranslation || japaneseTranslation === cleanWord) {
        return null
      }

      // Create vocabulary word object
      const vocabWord = {
        english: cleanWord,
        japanese: japaneseTranslation,
        type: type,
        context: context,
        level: this.estimateVocabularyLevel(cleanWord, type),
        pronunciation: translationService.getEnglishPronunciation(cleanWord),
        isVocabulary: true, // Flag to identify vocabulary words
      }

      // Cache the result
      this.vocabularyCache.set(cacheKey, vocabWord)

      return vocabWord
    } catch (error) {
      console.error(
        `Failed to create vocabulary word for "${cleanWord}":`,
        error
      )
      return null
    }
  }

  /**
   * Estimate the difficulty level of a vocabulary word
   * @param {string} word - The English word
   * @param {string} type - The word type
   * @returns {number} Difficulty level (1-10)
   */
  estimateVocabularyLevel(word, type) {
    let level = 5 // Default intermediate level

    // Length-based scoring
    if (word.length <= 4) level -= 1
    else if (word.length >= 8) level += 1
    if (word.length >= 12) level += 1

    // Type-based scoring
    switch (type) {
      case "noun":
        level += 0 // Neutral
        break
      case "verb":
        level += 1 // Slightly harder
        break
      case "adjective":
        level += 0.5 // Slightly easier
        break
      case "adverb":
        level += 1.5 // Usually more complex
        break
      case "properNoun":
        level -= 1 // Usually easier (names, places)
        break
    }

    // Common word patterns that might be easier
    const easyPatterns = ["ing$", "ed$", "er$", "est$", "ly$"]
    if (easyPatterns.some((pattern) => new RegExp(pattern).test(word))) {
      level -= 0.5
    }

    // Complex word patterns that might be harder
    const hardPatterns = [
      "tion$",
      "sion$",
      "ment$",
      "ness$",
      "ity$",
      "ous$",
      "ful$",
    ]
    if (hardPatterns.some((pattern) => new RegExp(pattern).test(word))) {
      level += 0.5
    }

    // Clamp between 1 and 10
    return Math.max(1, Math.min(10, Math.round(level)))
  }

  /**
   * Remove duplicate vocabulary words and sort by relevance
   * @param {Array} vocabulary - Array of vocabulary words
   * @returns {Array} Deduplicated and sorted vocabulary
   */
  deduplicateAndSort(vocabulary) {
    // Remove duplicates based on English word
    const seen = new Set()
    const unique = vocabulary.filter((word) => {
      if (seen.has(word.english)) {
        return false
      }
      seen.add(word.english)
      return true
    })

    // Sort by relevance (level, length, type)
    return unique.sort((a, b) => {
      // First, sort by level (higher level = more challenging = more valuable)
      if (a.level !== b.level) {
        return b.level - a.level
      }

      // Then by word length (longer words often more valuable)
      if (a.english.length !== b.english.length) {
        return b.english.length - a.english.length
      }

      // Finally alphabetically
      return a.english.localeCompare(b.english)
    })
  }

  /**
   * Get vocabulary statistics for a text
   * @param {string} text - The text to analyze
   * @returns {Object} Statistics about vocabulary in the text
   */
  async getVocabularyStats(text) {
    const vocabulary = await this.detectVocabulary(text)

    const stats = {
      totalWords: vocabulary.length,
      byType: {},
      byLevel: {},
      averageLevel: 0,
    }

    // Count by type
    vocabulary.forEach((word) => {
      stats.byType[word.type] = (stats.byType[word.type] || 0) + 1
      stats.byLevel[word.level] = (stats.byLevel[word.level] || 0) + 1
    })

    // Calculate average level
    if (vocabulary.length > 0) {
      stats.averageLevel =
        vocabulary.reduce((sum, word) => sum + word.level, 0) /
        vocabulary.length
    }

    return stats
  }

  /**
   * Clear the vocabulary cache
   */
  clearCache() {
    this.vocabularyCache.clear()
  }
}

// Create singleton instance
const vocabularyService = new VocabularyService()

export default vocabularyService
