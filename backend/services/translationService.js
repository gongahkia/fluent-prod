import axios from 'axios'
import NodeCache from 'node-cache'
import { isValidVocabularyWord, extractAllVocabularyWords } from './vocabularyService.js'
import { tokenize as kuromojiTokenize } from 'kuromojin'
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
      logger.error('Translation error', { error });
      return {
        error: {
          code: 'TRANSLATION_ERROR',
          message: error.message
        },
        original: text,
        translation: text,
        fromLang,
        toLang,
        cached: false,
        provider: 'fallback'
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
    logger.warn('Lingva Translate failed', { error });
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
// translateBatch removed (not used by cache generator)

// Note: stripMarkdownFormatting is now imported from utils/textUtils.js

/**
 * NEW: Translate ALL words in text and return complete translation map
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code
 * @returns {Promise<Object>} - Map of all word translations
 */
async function translateAllWords(text, targetLang = 'ja', sourceLang = 'en') {
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

  console.log(`  Translating ${uniqueWords.length} unique words...`)

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
    const err = new Error('Invalid text input')
    err.code = 'INVALID_TEXT_INPUT'
    throw err
  }

  // NOTE: For the cache generator, we translate target-language tokens -> English.
  // userLevel is intentionally ignored (cache always precomputes everything).
  const toLang = sourceLang || 'en'

  // Validate translation pair (e.g., ja-en)
  if (!isTranslationPairSupported(targetLang, toLang)) {
    const err = new Error(`Translation pair ${targetLang}-${toLang} is not supported`)
    err.code = 'UNSUPPORTED_LANGUAGE_PAIR'
    throw err
  }

  const cleanedText = stripMarkdownFormatting(text)

  const occurrences = await extractTargetLanguageTokenOccurrences(cleanedText, targetLang)
  if (occurrences.length === 0) {
    return {
      text: cleanedText,
      wordMetadata: [],
      allWordTranslations: {},
      vocabularyWords: []
    }
  }

  const uniqueTokens = [...new Set(occurrences.map((o) => o.token))]

  const allWordTranslations = {}
  await Promise.all(
    uniqueTokens.map(async (token) => {
      try {
        const result = await translateText(token, targetLang, toLang)
        allWordTranslations[token] = result.translation || token
      } catch {
        allWordTranslations[token] = token
      }
    })
  )

  // Build placeholder text using non-overlapping positions
  const sorted = occurrences.slice().sort((a, b) => a.start - b.start)

  let cursor = 0
  let out = ''
  const wordMetadata = []
  let wordIndex = 0

  for (const occ of sorted) {
    if (occ.start < cursor) continue
    out += cleanedText.slice(cursor, occ.start)
    out += `{{WORD:${wordIndex}}}`

    const metadataEntry = {
      index: wordIndex,
      original: occ.token,
      translation: allWordTranslations[occ.token] || occ.token,
      targetLanguage: targetLang
    }

    if (targetLang === 'ja') metadataEntry.showJapanese = true

    wordMetadata.push(metadataEntry)
    wordIndex++
    cursor = occ.end
  }

  out += cleanedText.slice(cursor)

  return {
    text: out,
    wordMetadata,
    allWordTranslations,
    vocabularyWords: []
  }
}

async function extractTargetLanguageTokenOccurrences(text, targetLang) {
  if (!text) return []

  if (targetLang === 'ja') {
    const tokens = await kuromojiTokenize(text)
    const excludedPos = new Set(['助詞', '助動詞', '記号', '接続詞'])

    return tokens
      .map((t) => ({
        token: t.surface_form,
        start: Math.max(0, (t.word_position || 1) - 1),
        end: Math.max(0, (t.word_position || 1) - 1) + String(t.surface_form || '').length,
        pos: t.pos
      }))
      .filter((t) => t.token && containsJapanese(t.token))
      .filter((t) => !excludedPos.has(t.pos))
      .filter((t) => t.end > t.start)
  }

  return []
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
      if (targetLang === 'ja') {
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

// containsTargetLanguage/isEnglishOnly/getSupportedTranslationPairs/getLanguageInfo removed
