import axios from 'axios'
import NodeCache from 'node-cache'
import { isValidVocabularyWord } from './vocabularyService.js'

// Cache for 30 days (translations rarely change)
const cache = new NodeCache({ stdTTL: 2592000 })

const API_ENDPOINTS = {
  lingva: 'https://lingva.ml/api/v1',
  mymemory: 'https://api.mymemory.translated.net/get',
  libretranslate: 'https://libretranslate.com/translate'
}

// Main translation function
export async function translateText(text, fromLang = 'en', toLang = 'ja') {
  const cacheKey = `translation:${text}:${fromLang}:${toLang}`

  // Check cache first
  const cached = cache.get(cacheKey)
  if (cached) {
    console.log(`Cache hit for: ${text}`)
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

  try {
    // Try Lingva first (most reliable)
    translation = await tryLingvaTranslate(text, fromLang, toLang)
    provider = 'lingva'

    if (!translation) {
      translation = await tryMyMemoryTranslation(text, fromLang, toLang)
      provider = 'mymemory'
    }

    if (!translation) {
      translation = await tryLibreTranslate(text, fromLang, toLang)
      provider = 'libretranslate'
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
    const url = `${API_ENDPOINTS.lingva}/${fromLang}/${toLang}/${encodeURIComponent(text)}`
    const { data } = await axios.get(url, { timeout: 5000 })

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
    const url = `${API_ENDPOINTS.mymemory}?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`
    const { data } = await axios.get(url, { timeout: 5000 })

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
    const { data } = await axios.post(
      API_ENDPOINTS.libretranslate,
      {
        q: text,
        source: fromLang,
        target: toLang,
        format: 'text'
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
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

// Create mixed language content - now processes sentences in parallel
export async function createMixedLanguageContent(text, userLevel = 5, targetLang = 'ja') {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid text input')
  }

  const translationPercentage = getTranslationPercentage(userLevel)

  // Split text into sentences
  const sentences = text.split(/(?<=[.!?])\s+/)

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
      targetLang
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
    wordMetadata: []
  }

  for (const result of sentenceResults) {
    processedResult.text += (processedResult.text ? ' ' : '') + result.text
    processedResult.wordMetadata.push(...result.metadata)
  }

  return processedResult
}

function getTranslationPercentage(level) {
  const levelNum = parseInt(level, 10)
  // 5-level system: Beginner (1), Intermediate (2), Advanced (3), Expert (4), Native (5)
  if (levelNum === 1) return 0.15  // Beginner - 15% translated
  if (levelNum === 2) return 0.35  // Intermediate - 35% translated
  if (levelNum === 3) return 0.55  // Advanced - 55% translated
  if (levelNum === 4) return 0.75  // Expert - 75% translated
  return 0.9                        // Native - 90% translated
}

async function processSentenceForMixedContent(sentence, translationPercentage, startIndex = 0, targetLang = 'ja') {
  const wordPattern = /(\b\w+\b|\s+|[^\w\s])/g
  const tokens = sentence.match(wordPattern) || []

  const wordTokens = tokens.filter(token => /^\w+$/.test(token))
  const wordsToTranslate = await selectWordsForTranslation(wordTokens, translationPercentage)

  // Translate all words in parallel
  const translationMap = new Map()
  const translationPromises = []

  for (const token of tokens) {
    if (/^\w+$/.test(token) && wordsToTranslate.has(token.toLowerCase())) {
      const promise = translateText(token, 'en', targetLang).then(result => {
        translationMap.set(token, result.translation)
      })
      translationPromises.push(promise)
    }
  }

  // Wait for all translations to complete
  await Promise.all(translationPromises)

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
        translation: translation
      }

      // Add appropriate flag based on target language
      if (targetLang === 'ko') {
        metadataEntry.showKorean = true
      } else {
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

// Language detection helpers
export function containsJapanese(text) {
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)
}

export function containsKorean(text) {
  return /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text)
}

export function containsTargetLanguage(text, languageCode) {
  if (languageCode === 'ja') {
    return containsJapanese(text)
  } else if (languageCode === 'ko') {
    return containsKorean(text)
  }
  return false
}

export function isEnglishOnly(text) {
  return /^[a-zA-Z\s.,!?;:"'()[\]{}—–-]+$/.test(text)
}
