import axios from 'axios'
import NodeCache from 'node-cache'
import { isValidVocabularyWord } from './vocabularyService.js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Get current directory path
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load translation mappings
const translationMappings = JSON.parse(
  readFileSync(join(__dirname, '../config/translationMappings.json'), 'utf-8')
)

// Cache for 30 days (translations rarely change)
const cache = new NodeCache({ stdTTL: 2592000 })

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

// Main translation function
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
    console.log(`Cache hit for: ${text} (${fromLang}->${toLang})`)
    return {
      original: text,
      translation: cached,
      fromLang,
      toLang,
      cached: true,
      provider: 'cache'
    }
  }

  let translation = null
  let provider = null

  // Get API providers for this language pair
  const providers = getAPIProvidersForPair(fromLang, toLang)

  try {
    // Try providers in order
    for (const providerName of providers) {
      if (providerName === 'lingva') {
        translation = await tryLingvaTranslate(text, fromLang, toLang)
        if (translation) {
          provider = 'lingva'
          break
        }
      } else if (providerName === 'mymemory') {
        translation = await tryMyMemoryTranslation(text, fromLang, toLang)
        if (translation) {
          provider = 'mymemory'
          break
        }
      } else if (providerName === 'libretranslate') {
        translation = await tryLibreTranslate(text, fromLang, toLang)
        if (translation) {
          provider = 'libretranslate'
          break
        }
      }
    }

    // Cache the result
    if (translation) {
      cache.set(cacheKey, translation)
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

/**
 * Strip all markdown formatting from text
 * @param {string} text - Text with markdown formatting
 * @returns {string} Plain text without markdown
 */
function stripMarkdownFormatting(text) {
  if (!text) return ''

  let cleaned = text

  // Remove bold: **text** or __text__
  cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1')
  cleaned = cleaned.replace(/__(.+?)__/g, '$1')

  // Remove italic: *text* or _text_ (but not within words)
  cleaned = cleaned.replace(/\*(.+?)\*/g, '$1')
  cleaned = cleaned.replace(/\b_(.+?)_\b/g, '$1')

  // Remove strikethrough: ~~text~~
  cleaned = cleaned.replace(/~~(.+?)~~/g, '$1')

  // Remove inline code: `code`
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1')

  // Remove code blocks: ```code```
  cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
    return match.replace(/```\w*\n?/g, '').replace(/```/g, '')
  })

  // Remove headers: # Header
  cleaned = cleaned.replace(/^#{1,6}\s+(.+)$/gm, '$1')

  // Remove list markers: - item or * item or 1. item
  cleaned = cleaned.replace(/^[\s]*[-*+]\s+/gm, '')
  cleaned = cleaned.replace(/^[\s]*\d+\.\s+/gm, '')

  // Remove horizontal rules: --- or ***
  cleaned = cleaned.replace(/^[\s]*[-*_]{3,}[\s]*$/gm, '')

  // Remove markdown links [text](url) - extract only the text
  cleaned = cleaned.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')

  // Remove Reddit quote markers: > or &gt;
  cleaned = cleaned.replace(/^[\s]*(&gt;|>)\s*/gm, '')

  return cleaned
}

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
 * Now also generates ALL word translations
 * @param {string} text - Text to process
 * @param {number} userLevel - User's learning level (1-5)
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code
 * @returns {Promise<Object>} - { text, wordMetadata, allWordTranslations }
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

  // NEW: Generate translations for ALL words first
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
    allWordTranslations  // NEW: Include all translations
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

  const neverTranslate = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be'
  ])

  // Prioritize vocabulary words
  const vocabularyWords = []
  const nonVocabularyWords = []

  for (const word of words) {
    if (neverTranslate.has(word.toLowerCase())) {
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

  // Add vocabulary words first
  let count = 0
  for (const word of vocabularyWords) {
    if (count >= targetCount) break
    wordsToTranslate.add(word.toLowerCase())
    count++
  }

  // Add non-vocabulary words if needed
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
