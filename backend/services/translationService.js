import axios from 'axios'
import NodeCache from 'node-cache'
import { isValidVocabularyWord, extractAllVocabularyWords } from './vocabularyService.js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { stripMarkdownFormatting } from '../utils/textUtils.js'
import { CacheMetrics, RequestDeduplicator, startTimer } from '../utils/performanceMonitor.js'

// Get current directory path
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load translation mappings
const translationMappings = JSON.parse(
  readFileSync(join(__dirname, '../../config/translationMappings.json'), 'utf-8')
)

// Cache for 30 days (translations rarely change)
const cache = new NodeCache({ stdTTL: 2592000 })

// Performance monitoring
const cacheMetrics = new CacheMetrics()
const requestDeduplicator = new RequestDeduplicator()

// Log cache stats every hour
setInterval(() => {
  cacheMetrics.logStats('Translation Cache')
}, 3600000)

// Helper function to check if a translation pair is supported
function isTranslationPairSupported(fromLang, toLang) {
  const pairKey = `${fromLang}-${toLang}`
  const pair = translationMappings.translationPairs[pairKey]
  return pair && pair.enabled
}

// Helper function to get API providers for a language pair
function getAPIProvidersForPair(fromLang, toLang) {
  const pairKey = `${fromLang}-${toLang}`
  const pair = translationMappings.translationPairs[pairKey]
  if (!pair) return ['lingva', 'mymemory', 'libretranslate'] // fallback
  return pair.apiProviders || ['lingva', 'mymemory', 'libretranslate']
}

// Main translation function with request deduplication
export async function translateText(text, fromLang = 'en', toLang = 'ja') {
  // Validate language pair
  if (!isTranslationPairSupported(fromLang, toLang)) {
    console.warn(`Translation pair ${fromLang}-${toLang} is not supported or disabled`)
    return {
      original: text,
      translation: text,
      fromLang,
      toLang,
      cached: false,
      provider: 'unsupported',
      error: 'Translation pair not supported'
    }
  }

  const cacheKey = `translation:${text}:${fromLang}:${toLang}`

  // Check cache first
  const cached = cache.get(cacheKey)
  if (cached) {
    cacheMetrics.recordHit()
    return {
      original: text,
      translation: cached,
      fromLang,
      toLang,
      cached: true,
      provider: 'cache'
    }
  }

  cacheMetrics.recordMiss()

  // Use request deduplication to prevent duplicate in-flight requests
  return await requestDeduplicator.dedupe(cacheKey, async () => {
    let translation = null
    let provider = null

    // Get API providers for this language pair
    const providers = getAPIProvidersForPair(fromLang, toLang)

    try {
      // OPTIMIZATION: Try all providers in parallel and use the first successful result
      const providerPromises = providers.map(async (providerName) => {
        try {
          if (providerName === 'lingva') {
            const result = await tryLingvaTranslate(text, fromLang, toLang)
            if (result) return { translation: result, provider: 'lingva' }
          } else if (providerName === 'mymemory') {
            const result = await tryMyMemoryTranslation(text, fromLang, toLang)
            if (result) return { translation: result, provider: 'mymemory' }
          } else if (providerName === 'libretranslate') {
            const result = await tryLibreTranslate(text, fromLang, toLang)
            if (result) return { translation: result, provider: 'libretranslate' }
          }
        } catch (error) {
          // Silently fail individual providers
          return null
        }
        return null
      })

      // Race all providers and use first successful result
      const results = await Promise.all(providerPromises)
      const successfulResult = results.find(r => r !== null)

      if (successfulResult) {
        translation = successfulResult.translation
        provider = successfulResult.provider
      }

      // Cache the result
      if (translation) {
        cache.set(cacheKey, translation)
        cacheMetrics.recordSet()
      }

      return {
        original: text,
        translation: translation || text,
        fromLang,
        toLang,
        cached: false,
        provider: provider || 'fallback'
      }
    } catch (error) {
      console.error('Translation error:', error.message)
      return {
        original: text,
        translation: text,
        fromLang,
        toLang,
        cached: false,
        provider: 'fallback',
        error: error.message
      }
    }
  })
}

// Lingva Translate API
async function tryLingvaTranslate(text, fromLang, toLang) {
  try {
    const endpoint = translationMappings.apiEndpoints.lingva
    if (!endpoint.enabled) return null

    const url = `${endpoint.baseUrl}/${fromLang}/${toLang}/${encodeURIComponent(text)}`
    const { data } = await axios.get(url, { timeout: endpoint.timeout })

    if (data && data.translation) {
      const translation = data.translation

      if (
        translation &&
        translation.length > 0 &&
        translation !== text &&
        !translation.match(/^[.,!?;:]+$/)
      ) {
        return translation
      }
    }
  } catch (error) {
    console.warn('Lingva Translate failed:', error.message)
  }
  return null
}

// MyMemory Translation API
async function tryMyMemoryTranslation(text, fromLang, toLang) {
  try {
    const endpoint = translationMappings.apiEndpoints.mymemory
    if (!endpoint.enabled) return null

    const url = `${endpoint.baseUrl}?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`
    const { data } = await axios.get(url, { timeout: endpoint.timeout })

    if (data.responseStatus === 200 && data.responseData) {
      const translation = data.responseData.translatedText

      if (
        translation &&
        translation.length > 1 &&
        translation !== '.' &&
        translation !== text &&
        !translation.match(/^[.,!?;:]+$/)
      ) {
        return translation
      }
    }
  } catch (error) {
    console.warn('MyMemory translation failed:', error.message)
  }
  return null
}

// LibreTranslate API
async function tryLibreTranslate(text, fromLang, toLang) {
  try {
    const endpoint = translationMappings.apiEndpoints.libretranslate
    if (!endpoint.enabled) return null

    const { data } = await axios.post(
      endpoint.baseUrl,
      {
        q: text,
        source: fromLang,
        target: toLang,
        format: 'text'
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: endpoint.timeout
      }
    )

    return data.translatedText
  } catch (error) {
    console.warn('LibreTranslate failed:', error.message)
  }
  return null
}

// Batch translation
export async function translateBatch(texts, fromLang = 'en', toLang = 'ja') {
  const translations = await Promise.all(
    texts.map(text => translateText(text, fromLang, toLang))
  )

  return { translations }
}

// Note: stripMarkdownFormatting is now imported from utils/textUtils.js

/**
 * NEW: Translate ALL words in text and return complete translation map
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code
 * @returns {Promise<Object>} - Map of all word translations
 */
export async function translateAllWords(text, targetLang = 'ja', sourceLang = 'en') {
  if (!text || typeof text !== 'string') {
    return {}
  }

  // Validate translation pair
  if (!isTranslationPairSupported(sourceLang, targetLang)) {
    console.warn(`Translation pair ${sourceLang}-${targetLang} is not supported`)
    return {}
  }

  // Strip markdown first
  const cleanedText = stripMarkdownFormatting(text)

  // Extract all words
  const wordPattern = /\b\w+\b/g
  const words = cleanedText.match(wordPattern) || []

  // Never translate these common words
  const neverTranslate = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be'
  ])

  // Get unique words to translate
  const uniqueWords = [...new Set(words.map(w => w.toLowerCase()))]
    .filter(w => !neverTranslate.has(w))

  console.log(`  📝 Translating ${uniqueWords.length} unique words...`)

  // Translate all words in parallel
  const allWordTranslations = {}
  const translationPromises = uniqueWords.map(async (word) => {
    try {
      const result = await translateText(word, sourceLang, targetLang)
      allWordTranslations[word] = result.translation
    } catch (error) {
      console.warn(`Failed to translate word "${word}":`, error.message)
      allWordTranslations[word] = word // Fallback to original
    }
  })

  await Promise.all(translationPromises)

  return allWordTranslations
}

/**
 * Create mixed language content with partial translation
 * NEW: Extracts ALL vocabulary words with positions, difficulties, and translations
 * @param {string} text - Text to process
 * @param {number} userLevel - User's learning level (1-5)
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code
 * @returns {Promise<Object>} - { text, wordMetadata, allWordTranslations, vocabularyWords }
 */
export async function createMixedLanguageContent(text, userLevel = 5, targetLang = 'ja', sourceLang = 'en') {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input')
  }

  // Validate translation pair
  if (!isTranslationPairSupported(sourceLang, targetLang)) {
    throw new Error(`Translation pair ${sourceLang}-${targetLang} is not supported`)
  }

  // Strip all markdown formatting FIRST, before translation
  const cleanedText = stripMarkdownFormatting(text)

  // NEW: Extract ALL vocabulary words with comprehensive metadata
  const vocabularyWords = await extractAllVocabularyWords(cleanedText, targetLang)

  // Generate translations for ALL words (for backward compatibility)
  const allWordTranslations = await translateAllWords(cleanedText, targetLang, sourceLang)

  const translationPercentage = getTranslationPercentage(userLevel)

  // Split cleaned text into sentences
  const sentences = cleanedText.split(/(?<=[.!?])\s+/)

  // Process sentences in parallel for better performance
  const sentencePromises = sentences.map(async (sentence, index) => {
    // Calculate starting index for this sentence's words
    let startIndex = 0
    for (let i = 0; i < index; i++) {
      const prevTokens = sentences[i].match(/\b\w+\b/g) || []
      startIndex += prevTokens.length
    }

    const result = await processSentenceForMixedContent(
      sentence,
      translationPercentage,
      startIndex,
      sourceLang,
      targetLang,
      allWordTranslations  // Pass the complete translation map
    )

    return {
      ...result,
      originalIndex: index
    }
  })

  const sentenceResults = await Promise.all(sentencePromises)

  // Reconstruct in original order
  const processedResult = {
    text: '',
    wordMetadata: [],
    allWordTranslations,  // Include all simple word translations
    vocabularyWords  // NEW: Include comprehensive vocabulary data with difficulty levels
  }

  for (const result of sentenceResults) {
    processedResult.text += (processedResult.text ? ' ' : '') + result.text
    processedResult.wordMetadata.push(...result.metadata)
  }

  return processedResult
}

function getTranslationPercentage(level) {
  const levelNum = parseInt(level, 10)
  const levelConfig = translationMappings.learningLevels[levelNum]
  return levelConfig ? levelConfig.translationPercentage : 0.15
}

async function processSentenceForMixedContent(sentence, translationPercentage, startIndex = 0, sourceLang = 'en', targetLang = 'ja', allWordTranslations = {}) {
  const wordPattern = /(\b\w+\b|\s+|[^\w\s])/g
  const tokens = sentence.match(wordPattern) || []

  const wordTokens = tokens.filter(token => /^\w+$/.test(token))
  const wordsToTranslate = await selectWordsForTranslation(wordTokens, translationPercentage)

  // Use pre-generated translations instead of translating again
  const translationMap = new Map()
  for (const token of tokens) {
    if (/^\w+$/.test(token) && wordsToTranslate.has(token.toLowerCase())) {
      const translation = allWordTranslations[token.toLowerCase()] || token
      translationMap.set(token, translation)
    }
  }

  // Build the result with translations
  const processedTokens = []
  const metadata = []
  let wordIndex = startIndex

  for (const token of tokens) {
    if (/^\w+$/.test(token) && wordsToTranslate.has(token.toLowerCase())) {
      const translation = translationMap.get(token)

      const metadataEntry = {
        index: wordIndex,
        original: token,
        translation: translation,
        targetLanguage: targetLang
      }

      // Add appropriate flag based on target language
      if (targetLang === 'ko') {
        metadataEntry.showKorean = true
      } else if (targetLang === 'ja') {
        metadataEntry.showJapanese = true
      }

      metadata.push(metadataEntry)

      processedTokens.push(`{{WORD:${wordIndex}}}`)
      wordIndex++
    } else {
      processedTokens.push(token)
    }
  }

  return {
    text: processedTokens.join(''),
    metadata
  }
}

async function selectWordsForTranslation(words, percentage) {
  const wordsToTranslate = new Set()

  // MODIFIED: Make ALL words selectable for translation
  // No more neverTranslate list - every word is now clickable

  // Still prioritize vocabulary words for marker selection
  const vocabularyWords = []
  const nonVocabularyWords = []

  for (const word of words) {
    // Skip empty words or pure punctuation
    if (!word.trim() || /^[^\w]+$/.test(word)) {
      continue
    }

    if (isValidVocabularyWord(word)) {
      vocabularyWords.push(word)
    } else {
      nonVocabularyWords.push(word)
    }
  }

  const totalWords = words.length
  const targetCount = Math.floor(totalWords * percentage)

  // Add vocabulary words first (for marker selection)
  let count = 0
  for (const word of vocabularyWords) {
    if (count >= targetCount) break
    wordsToTranslate.add(word.toLowerCase())
    count++
  }

  // Add non-vocabulary words if needed (for marker selection)
  if (count < targetCount) {
    for (const word of nonVocabularyWords) {
      if (count >= targetCount) break
      wordsToTranslate.add(word.toLowerCase())
      count++
    }
  }

  return wordsToTranslate
}

// Language detection helpers - now use mappings
export function containsJapanese(text) {
  const regex = new RegExp(translationMappings.languages.ja.characterRanges.regex)
  return regex.test(text)
}

export function containsKorean(text) {
  const regex = new RegExp(translationMappings.languages.ko.characterRanges.regex)
  return regex.test(text)
}

export function containsTargetLanguage(text, languageCode) {
  const language = translationMappings.languages[languageCode]
  if (!language) return false
  const regex = new RegExp(language.characterRanges.regex)
  return regex.test(text)
}

export function isEnglishOnly(text) {
  const regex = new RegExp(translationMappings.languages.en.characterRanges.regex)
  return regex.test(text)
}

// Get all supported translation pairs
export function getSupportedTranslationPairs() {
  return Object.entries(translationMappings.translationPairs)
    .filter(([_, pair]) => pair.enabled)
    .map(([key, pair]) => ({
      key,
      from: pair.from,
      to: pair.to,
      fromLanguage: translationMappings.languages[pair.from],
      toLanguage: translationMappings.languages[pair.to]
    }))
}

// Get language information
export function getLanguageInfo(languageCode) {
  return translationMappings.languages[languageCode] || null
}
