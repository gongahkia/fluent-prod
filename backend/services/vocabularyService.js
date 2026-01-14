import nlp from 'compromise'
import NodeCache from 'node-cache'
import { translateText } from './translationService.js'
import { CacheMetrics, startBatchTimer, logPerformance } from '../utils/performanceMonitor.js'
import logger from '../utils/logger.js'
import { calculateWordDifficulty } from '../utils/difficultyUtils.js'

// Cache for 1 hour
const cache = new NodeCache({ stdTTL: 3600 })

// Performance monitoring
const cacheMetrics = new CacheMetrics()

// Log cache stats every hour
setInterval(() => {
  cacheMetrics.logStats('Vocabulary Cache')
}, 3600000)

// Word type classification levels (difficulty)
const WORD_LEVELS = {
  properNoun: 1,
  noun: 3,
  verb: 4,
  adjective: 5,
  adverb: 6
}

// Detect vocabulary words in text using NLP (OPTIMIZED WITH PARALLEL PROCESSING)
export async function detectVocabulary(text) {
  const cacheKey = `vocab:detect:${text.substring(0, 100)}`
  const cached = cache.get(cacheKey)
  if (cached) {
    cacheMetrics.recordHit()
    return cached
  }

  cacheMetrics.recordMiss()

  // Start performance timer
  const timer = startBatchTimer('Vocabulary detection', text.length)

  let doc
  try {
    doc = nlp(text)
  } catch (error) {
    logger.error('NLP parsing failed', { error })
    return {
      error: {
        code: 'NLP_PARSE_ERROR',
        message: error.message
      },
      vocabulary: []
    }
  }

  // Extract different word types
  const nouns = doc.nouns().out('array')
  const verbs = doc.verbs().out('array')
  const adjectives = doc.adjectives().out('array')
  const adverbs = doc.adverbs().out('array')
  const properNouns = doc.places().out('array').concat(doc.people().out('array'))

  // OPTIMIZATION: Process all word types in parallel
  const [properNounWords, nounWords, verbWords, adjectiveWords, adverbWords] = await Promise.all([
    // Process proper nouns
    Promise.all(
      properNouns
        .filter(word => isValidVocabularyWord(word))
        .map(word => createVocabularyWord(word, 'properNoun'))
    ),
    // Process nouns
    Promise.all(
      nouns
        .filter(word => isValidVocabularyWord(word))
        .map(word => createVocabularyWord(word, 'noun'))
    ),
    // Process verbs
    Promise.all(
      verbs
        .filter(word => isValidVocabularyWord(word))
        .map(word => createVocabularyWord(word, 'verb'))
    ),
    // Process adjectives
    Promise.all(
      adjectives
        .filter(word => isValidVocabularyWord(word))
        .map(word => createVocabularyWord(word, 'adjective'))
    ),
    // Process adverbs
    Promise.all(
      adverbs
        .filter(word => isValidVocabularyWord(word))
        .map(word => createVocabularyWord(word, 'adverb'))
    )
  ])

  // Combine all results
  const vocabulary = [
    ...properNounWords,
    ...nounWords,
    ...verbWords,
    ...adjectiveWords,
    ...adverbWords
  ]

  // Filter out duplicates
  const uniqueVocabulary = vocabulary.filter(
    (word, index, self) => index === self.findIndex((w) => w.english === word.english)
  )

  const result = { vocabulary: uniqueVocabulary }
  cache.set(cacheKey, result)
  cacheMetrics.recordSet()

  // Log performance
  const metrics = timer.stop()
  logPerformance(metrics, 'success')

  return result
}

// Create a vocabulary word object with translation
export async function createVocabularyWord(word, type = 'unknown', context = '', targetLang = 'ja') {
  const cleanWord = word.toLowerCase().trim()

  const cacheKey = `vocab:word:${cleanWord}:${type}:${targetLang}`
  const cached = cache.get(cacheKey)
  if (cached) {
    cacheMetrics.recordHit()
    return cached
  }

  cacheMetrics.recordMiss()

  // Calculate word-level difficulty based on word characteristics
  const wordDifficulty = calculateWordDifficulty(cleanWord, type)

  // Get translation
  const translation = await translateText(cleanWord, 'en', targetLang)

  const vocabularyWord = {
    english: cleanWord,
    translation: translation.translation,
    japanese: targetLang === 'ja' ? translation.translation : undefined,
    type: type,
    level: wordDifficulty, // Use calculated word difficulty instead of type-based
    pronunciation: '', // Could be enhanced with pronunciation API
    isVocabulary: isValidVocabularyWord(cleanWord),
    context: context || ''
  }

  cache.set(cacheKey, vocabularyWord)
  cacheMetrics.recordSet()
  return vocabularyWord
}

// Validate if a word is valid vocabulary
export function isValidVocabularyWord(word) {
  if (!word || typeof word !== 'string') {
    return false
  }

  const cleanWord = word.toLowerCase().trim()

  // MODIFIED: Removed excludeWords list to make ALL words clickable
  // Now only basic validation checks

  // Length check - relaxed to allow shorter words (2 chars minimum)
  if (cleanWord.length < 2 || cleanWord.length > 20) {
    return false
  }

  // Check for pure numbers
  if (/^\d+$/.test(cleanWord)) {
    return false
  }

  // Check for special characters (allow apostrophes and hyphens)
  if (/[^a-zA-Z'-]/.test(cleanWord)) {
    return false
  }

  // Check for too many consecutive same characters
  if (/(.)\1{3,}/.test(cleanWord)) {
    return false
  }

  return true
}

// Get vocabulary statistics for text
export async function getVocabularyStats(text) {
  const { vocabulary } = await detectVocabulary(text)

  const byType = {}
  const byLevel = {}
  let totalWords = vocabulary.length
  let totalLevel = 0

  for (const word of vocabulary) {
    // Count by type
    byType[word.type] = (byType[word.type] || 0) + 1

    // Count by level
    byLevel[word.level] = (byLevel[word.level] || 0) + 1

    totalLevel += word.level
  }

  return {
    totalWords,
    byType,
    byLevel,
    averageLevel: totalWords > 0 ? (totalLevel / totalWords).toFixed(2) : 0,
    vocabulary: vocabulary.slice(0, 20) // Return top 20 words
  }
}

/**
 * NEW: Extract ALL vocabulary words from text with positions and metadata
 * This provides comprehensive vocabulary data for every vocabulary word in the text
 * @param {string} text - Text to analyze
 * @param {string} targetLang - Target language for translations
 * @returns {Promise<Array>} - Array of { word, position, type, difficulty, translation }
 */
export async function extractAllVocabularyWords(text, targetLang = 'ja') {
  if (!text || typeof text !== 'string') {
    return []
  }

  const timer = startBatchTimer('Extract all vocabulary words', text.length)

  const doc = nlp(text)

  // Extract different word types with their positions in the text
  const vocabularyWords = []

  // Process each word type
  const wordTypes = [
    { name: 'properNoun', extractor: () => doc.places().out('array').concat(doc.people().out('array')) },
    { name: 'noun', extractor: () => doc.nouns().out('array') },
    { name: 'verb', extractor: () => doc.verbs().out('array') },
    { name: 'adjective', extractor: () => doc.adjectives().out('array') },
    { name: 'adverb', extractor: () => doc.adverbs().out('array') }
  ]

  // Extract words by type
  for (const wordType of wordTypes) {
    const words = wordType.extractor()

    for (const word of words) {
      if (!isValidVocabularyWord(word)) {
        continue
      }

      // Find all positions of this word in the text
      const cleanWord = word.toLowerCase()
      const wordRegex = new RegExp(`\\b${word}\\b`, 'gi')
      let match

      while ((match = wordRegex.exec(text)) !== null) {
        vocabularyWords.push({
          word: cleanWord,
          originalWord: word,
          position: match.index,
          type: wordType.name,
          difficulty: calculateWordDifficulty(cleanWord, wordType.name)
        })
      }
    }
  }

  // Sort by position
  vocabularyWords.sort((a, b) => a.position - b.position)

  // Translate all unique words in parallel
  const uniqueWords = [...new Set(vocabularyWords.map(v => v.word))]
  const translationMap = {}

  const translationPromises = uniqueWords.map(async (word) => {
    try {
      const result = await translateText(word, 'en', targetLang)
      translationMap[word] = result.translation
    } catch (error) {
      console.warn(`Failed to translate word "${word}":`, error.message)
      translationMap[word] = word // Fallback to original
    }
  })

  await Promise.all(translationPromises)

  // Add translations to vocabulary words
  const vocabularyWithTranslations = vocabularyWords.map(v => ({
    ...v,
    translation: translationMap[v.word] || v.word
  }))

  const metrics = timer.stop()
  logPerformance(metrics, 'success')

  console.log(`  Extracted ${vocabularyWithTranslations.length} vocabulary words`)

  return vocabularyWithTranslations
}
