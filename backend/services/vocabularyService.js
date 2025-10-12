import nlp from 'compromise'
import NodeCache from 'node-cache'
import { translateText } from './translationService.js'
import { CacheMetrics, startBatchTimer, logPerformance } from '../utils/performanceMonitor.js'

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

  const doc = nlp(text)

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
export async function createVocabularyWord(word, type = 'unknown', context = '') {
  const cleanWord = word.toLowerCase().trim()

  const cacheKey = `vocab:word:${cleanWord}:${type}`
  const cached = cache.get(cacheKey)
  if (cached) {
    cacheMetrics.recordHit()
    return cached
  }

  cacheMetrics.recordMiss()

  // Get translation
  const translation = await translateText(cleanWord, 'en', 'ja')

  const vocabularyWord = {
    english: cleanWord,
    japanese: translation.translation,
    type: type,
    level: WORD_LEVELS[type] || 5,
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

  // Basic function words to exclude
  const excludeWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
    'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
    'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our',
    'their', 'am', 'not', 'no', 'yes', 'so', 'up', 'out', 'if', 'about',
    'who', 'get', 'which', 'go', 'me', 'when', 'make', 'than', 'look',
    'use', 'find', 'give', 'tell', 'work', 'call', 'try', 'ask', 'need',
    'feel', 'become', 'leave', 'put', 'mean', 'keep', 'let', 'begin',
    'seem', 'help', 'talk', 'turn', 'start', 'show', 'hear', 'play',
    'run', 'move', 'like', 'live', 'believe', 'hold', 'bring', 'happen',
    'write', 'provide', 'sit', 'stand', 'lose', 'pay', 'meet', 'include',
    'continue', 'set', 'learn', 'change', 'lead', 'understand', 'watch',
    'follow', 'stop', 'create', 'speak', 'read', 'allow', 'add', 'spend',
    'grow', 'open', 'walk', 'win', 'offer', 'remember', 'love', 'consider'
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
