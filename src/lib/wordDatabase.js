import translationService from "../services/translationService"
import { getLanguageByName } from "@config/languages"
import { emitToast } from "./toastBus"

// Shared Japanese-English word database for the entire application
// This eliminates duplication between NewsFeed and EnhancedCommentSystem
// Uses client-side translation and a simple local vocabulary heuristic.

// Removed hardcoded words - now using only API translations
export const japaneseWords = {}

const TRANSLATION_CACHE_STORAGE_KEY = "fluent.translationCache.v1"
const TRANSLATION_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const TRANSLATION_CACHE_MAX_ENTRIES = 1500

const memoryCache = new Map()
const inFlight = new Map()
const lastClickAtByKey = new Map()
const japaneseReadingCache = new Map()
let persistentCacheLoaded = false
let persistTimer = null
let kuromojinTokenizerPromise = null
let activeWordRequestController = null

// Rate limiting (per tab/session)
const requestTimestamps = []
const REQUESTS_PER_MINUTE = 180
const CLICK_DEBOUNCE_MS = 250
const READING_SOURCE_KUROMOJIN = "kuromojin"
const READING_SOURCE_NONE = "none"

function nowMs() {
  return Date.now()
}

function beginWordRequest() {
  if (activeWordRequestController) {
    activeWordRequestController.abort()
  }
  const controller = new AbortController()
  activeWordRequestController = controller
  return controller
}

function ensureNotAborted(signal) {
  if (signal?.aborted) {
    throw new DOMException("Translation request was aborted", "AbortError")
  }
}

function katakanaToHiragana(text) {
  if (!text) return ""
  return String(text).replace(/[\u30A1-\u30F6]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0x60)
  )
}

async function getKuromojinTokenizer() {
  if (!kuromojinTokenizerPromise) {
    kuromojinTokenizerPromise = import("kuromojin")
      .then((module) => module.getTokenizer())
      .catch((error) => {
        kuromojinTokenizerPromise = null
        throw error
      })
  }
  return kuromojinTokenizerPromise
}

async function parseJapaneseReading(word) {
  const safeWord = String(word || "").trim()
  if (!safeWord) return null

  const cached = japaneseReadingCache.get(safeWord)
  if (cached !== undefined) {
    return cached
  }

  try {
    const tokenizer = await getKuromojinTokenizer()
    const tokens = await tokenizer.tokenize(safeWord)
    const reading = tokens
      .map((token) => token?.reading || "")
      .join("")
      .trim()

    const normalized = reading ? katakanaToHiragana(reading) : null
    japaneseReadingCache.set(safeWord, normalized)
    return normalized
  } catch (error) {
    console.warn("Failed to parse Japanese reading via kuromojin:", error)
    japaneseReadingCache.set(safeWord, null)
    return null
  }
}

function hasLocalStorage() {
  try {
    return typeof window !== "undefined" && !!window.localStorage
  } catch {
    return false
  }
}

function normalizeToken(rawToken, fromLang) {
  if (typeof rawToken !== "string") return ""
  let token = rawToken

  try {
    token = token.normalize("NFKC")
  } catch {
    // ignore
  }

  token = token.trim()
  if (!token) return ""

  // Strip surrounding punctuation/quotes/brackets while keeping inner apostrophes/hyphens.
  token = token
    .replace(/^[\s"'“”‘’()\[\]{}<>.,!?;:|\\/]+/g, "")
    .replace(/[\s"'“”‘’()\[\]{}<>.,!?;:|\\/]+$/g, "")

  // Strip common Japanese punctuation
  token = token.replace(/[。、！？]/g, "")

  if (!token) return ""
  if (fromLang === "en") token = token.toLowerCase()

  return token
}

function shouldTranslateToken(normalizedToken, fromLang) {
  if (!normalizedToken) return false
  if (normalizedToken.length > 40) return false

  // Skip obvious URLs/emails
  if (/^(https?:\/\/|www\.)/i.test(normalizedToken)) return false
  if (/\S+@\S+\.\S+/.test(normalizedToken)) return false

  // Skip pure numbers / punctuation-only
  if (/^\d+$/.test(normalizedToken)) return false
  if (!/[\p{L}\p{N}]/u.test(normalizedToken)) return false

  // For English, require at least one A-Z letter
  if (fromLang === "en" && !/[a-z]/i.test(normalizedToken)) return false

  return true
}

function getLanguageCodeFromNameOrId(languageNameOrId) {
  const fallback = "ja"
  if (!languageNameOrId) return fallback
  try {
    const lang = getLanguageByName(String(languageNameOrId))
    return lang?.id || fallback
  } catch {
    return fallback
  }
}

function buildCacheKey(text, fromLang, toLang) {
  return `${fromLang}|${toLang}|${text}`
}

function loadPersistentCacheOnce() {
  if (persistentCacheLoaded) return
  persistentCacheLoaded = true
  if (!hasLocalStorage()) return

  try {
    const raw = window.localStorage.getItem(TRANSLATION_CACHE_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    const entries = parsed?.entries && typeof parsed.entries === "object" ? parsed.entries : {}
    const now = nowMs()

    for (const [key, entry] of Object.entries(entries)) {
      if (!entry || typeof entry !== "object") continue
      if (typeof entry.expiresAt !== "number" || entry.expiresAt <= now) continue
      if (!entry.value || typeof entry.value !== "object") continue

      memoryCache.set(key, entry)
    }
  } catch {
    // Ignore corrupt cache
  }
}

function schedulePersist() {
  if (!hasLocalStorage()) return
  if (persistTimer) return
  persistTimer = window.setTimeout(() => {
    persistTimer = null
    persistCacheToLocalStorage()
  }, 500)
}

function persistCacheToLocalStorage() {
  if (!hasLocalStorage()) return

  // Evict expired + enforce max entries (LRU by lastAccessAt)
  const now = nowMs()
  const all = []
  for (const [key, entry] of memoryCache.entries()) {
    if (!entry || entry.expiresAt <= now) {
      memoryCache.delete(key)
      continue
    }
    all.push([key, entry])
  }

  all.sort((a, b) => (b[1].lastAccessAt || 0) - (a[1].lastAccessAt || 0))
  const trimmed = all.slice(0, TRANSLATION_CACHE_MAX_ENTRIES)
  const entries = Object.fromEntries(trimmed)

  try {
    window.localStorage.setItem(
      TRANSLATION_CACHE_STORAGE_KEY,
      JSON.stringify({ version: 1, savedAt: now, entries })
    )
  } catch {
    // If storage is full, fall back to keeping fewer entries
    try {
      const smaller = Object.fromEntries(trimmed.slice(0, Math.floor(TRANSLATION_CACHE_MAX_ENTRIES / 2)))
      window.localStorage.setItem(
        TRANSLATION_CACHE_STORAGE_KEY,
        JSON.stringify({ version: 1, savedAt: now, entries: smaller })
      )
    } catch {
      // ignore
    }
  }
}

function getCachedTranslation(cacheKey) {
  loadPersistentCacheOnce()

  const entry = memoryCache.get(cacheKey)
  if (!entry) return null

  const now = nowMs()
  if (entry.expiresAt <= now) {
    memoryCache.delete(cacheKey)
    return null
  }

  entry.lastAccessAt = now
  memoryCache.set(cacheKey, entry)
  schedulePersist()
  return entry.value
}

function setCachedTranslation(cacheKey, value) {
  const now = nowMs()
  memoryCache.set(cacheKey, {
    value,
    expiresAt: now + TRANSLATION_CACHE_TTL_MS,
    lastAccessAt: now,
  })
  schedulePersist()
}

function assertRateLimit() {
  const now = nowMs()
  const windowStart = now - 60_000
  while (requestTimestamps.length > 0 && requestTimestamps[0] < windowStart) {
    requestTimestamps.shift()
  }
  if (requestTimestamps.length >= REQUESTS_PER_MINUTE) {
    throw new Error("Too many translation requests. Please slow down a bit.")
  }
  requestTimestamps.push(now)
}

async function translateWithCache(text, fromLang, toLang) {
  const cacheKey = buildCacheKey(text, fromLang, toLang)

  const cached = getCachedTranslation(cacheKey)
  if (cached?.translation) return cached

  if (inFlight.has(cacheKey)) return inFlight.get(cacheKey)

  assertRateLimit()

  const promise = (async () => {
    try {
      const translation = await translationService.translateText(text, fromLang, toLang)
      const value = { translation }
      setCachedTranslation(cacheKey, value)
      return value
    } finally {
      inFlight.delete(cacheKey)
    }
  })()

  inFlight.set(cacheKey, promise)
  return promise
}

export const prewarmTranslationCacheFromDictionary = (userDictionary, targetLanguage = "Japanese") => {
  if (!Array.isArray(userDictionary) || userDictionary.length === 0) return

  const targetLangCode = getLanguageCodeFromNameOrId(targetLanguage)
  const now = nowMs()

  // Prewarm up to a reasonable cap to avoid heavy localStorage writes.
  const MAX_PREWARM = 800
  for (const entry of userDictionary.slice(0, MAX_PREWARM)) {
    const japanese = typeof entry?.japanese === "string" ? entry.japanese : ""
    const english = typeof entry?.english === "string" ? entry.english : ""

    const jaNorm = normalizeToken(japanese, targetLangCode)
    const enNorm = normalizeToken(english, "en")

    if (jaNorm && enNorm) {
      setCachedTranslation(buildCacheKey(enNorm, "en", targetLangCode), { translation: japanese })
      setCachedTranslation(buildCacheKey(jaNorm, targetLangCode, "en"), { translation: english })
    }
  }

  // Ensure we persist after prewarm burst
  if (hasLocalStorage()) {
    // Touch persist schedule
    schedulePersist()
  }
  // Also update debounce map to prevent immediate double-click spam
  lastClickAtByKey.set("__prewarm__", now)
}

function isValidVocabularyWord(word) {
  if (!word || typeof word !== "string") return false
  const clean = word.toLowerCase().trim()
  if (clean.length < 1 || clean.length > 20) return false
  if (/^\d+$/.test(clean)) return false
  if (/[^a-zA-Z'-]/.test(clean)) return false
  return true
}

export const handleWordClick = async (
  word,
  setSelectedWord,
  isJapanese = null,
  context = null,
  contextTranslation = null,
  setLoading = null,
  targetLanguage = "Japanese", // Add target language parameter
  clickPosition = null // Add click position parameter
) => {
  const contextText = typeof context === 'string' ? context : (context?.text || null)
  const contextPostHash = typeof context === 'object' && context ? (context.postHash || context.postId || null) : null

  // Auto-detect if word is in target language or English if not specified
  let isTargetLang = isJapanese
  if (isTargetLang === null) {
    isTargetLang = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(word)
  }

  const targetLangCode = getLanguageCodeFromNameOrId(targetLanguage)
  const fromLang = isTargetLang ? targetLangCode : "en"
  const toLang = isTargetLang ? "en" : targetLangCode

  const cleanWord = normalizeToken(word, fromLang)
  const clickKey = buildCacheKey(cleanWord, fromLang, toLang)
  const lastClickAt = lastClickAtByKey.get(clickKey) || 0
  const now = nowMs()
  lastClickAtByKey.set(clickKey, now)

  if (!shouldTranslateToken(cleanWord, fromLang)) {
    emitToast({ message: "Not a translatable token", icon: "⚠️" })
    return
  }

  const requestController = beginWordRequest()
  const requestSignal = requestController.signal
  const isActiveRequest = () => activeWordRequestController === requestController

  // Set loading state if provided
  if (setLoading) {
    setLoading(true)
  }

  try {
    // Debounce rapid repeat clicks on the same token.
    if (now - lastClickAt < CLICK_DEBOUNCE_MS) {
      const cached = getCachedTranslation(clickKey)
      if (cached?.translation) {
        ensureNotAborted(requestSignal)
        const translation = cached.translation
        const readingTarget = isTargetLang ? cleanWord : translation
        const pronunciation = await parseJapaneseReading(readingTarget)
        ensureNotAborted(requestSignal)
        const readingSource = pronunciation
          ? READING_SOURCE_KUROMOJIN
          : READING_SOURCE_NONE

        const level = cleanWord.length <= 4 ? 3 : cleanWord.length <= 7 ? 5 : 7
        const wordData = {
          english: isTargetLang ? translation : cleanWord,
          level,
          example: contextText || `Example with "${cleanWord}".`,
          exampleEn: contextTranslation || (isTargetLang ? `Example with ${cleanWord}.` : `Example with "${cleanWord}".`),
          original: cleanWord,
          isApiTranslated: true,
          isVocabulary: !isTargetLang && isValidVocabularyWord(cleanWord),
          clickPosition,
          postHash: contextPostHash,
          readingSource,
        }
        wordData.japanese = isTargetLang ? cleanWord : translation
        wordData.hiragana = pronunciation
        wordData.isJapanese = isTargetLang
        wordData.showJapaneseTranslation = !isTargetLang
        ensureNotAborted(requestSignal)
        setSelectedWord(wordData)
        return
      }
    }

    console.log(`Translating word: ${cleanWord} using API...`)

    let translation,
      pronunciation,
      contextTranslationResult,
      readingSource = READING_SOURCE_NONE

    if (isTargetLang) {
      // Target language to English
      translation = (await translateWithCache(cleanWord, fromLang, toLang)).translation
      ensureNotAborted(requestSignal)
      const reading = await parseJapaneseReading(cleanWord)
      ensureNotAborted(requestSignal)
      pronunciation = reading || null
      readingSource = reading
        ? READING_SOURCE_KUROMOJIN
        : READING_SOURCE_NONE

      if (contextText && !contextTranslation) {
        contextTranslationResult = await translationService.translateText(
          contextText,
          fromLang,
          toLang
        )
      }
    } else {
      // English to target language
      translation = (await translateWithCache(cleanWord, fromLang, toLang)).translation
      ensureNotAborted(requestSignal)
      const reading = await parseJapaneseReading(translation)
      ensureNotAborted(requestSignal)
      pronunciation = reading
      readingSource = reading
        ? READING_SOURCE_KUROMOJIN
        : READING_SOURCE_NONE

      if (contextText && !contextTranslation) {
        contextTranslationResult = await translationService.translateText(
          contextText,
          fromLang,
          toLang
        )
      }
    }

    // Simple level estimation based on word length
    const level = cleanWord.length <= 4 ? 3 : cleanWord.length <= 7 ? 5 : 7

    const wordData = {
      english: isTargetLang ? translation : cleanWord,
      level: level,
      example: contextText || `Example with "${cleanWord}".`,
      exampleEn:
        contextTranslationResult ||
        contextTranslation ||
        (isTargetLang
          ? `Example with ${cleanWord}.`
          : `Example with "${cleanWord}".`),
      original: cleanWord,
      isApiTranslated: true,
      isVocabulary: !isTargetLang && isValidVocabularyWord(cleanWord),
      clickPosition: clickPosition, // Add click position for anchored popup
      postHash: contextPostHash,
      readingSource,
    }

    wordData.japanese = isTargetLang ? cleanWord : translation
    wordData.hiragana = pronunciation
    wordData.isJapanese = isTargetLang
    wordData.showJapaneseTranslation = !isTargetLang

    ensureNotAborted(requestSignal)
    setSelectedWord(wordData)
  } catch (error) {
    if (error?.name === "AbortError") {
      return
    }
    console.error("Translation API failed:", error)

    emitToast({ message: "Translation unavailable. Try again.", icon: "⚠️" })
    if (setSelectedWord) setSelectedWord(null)
  } finally {
    // Clear loading state
    const stillActive = isActiveRequest()
    if (stillActive) {
      activeWordRequestController = null
    }
    if (setLoading && stillActive) {
      setLoading(false)
    }
  }
}

// Function to add word to dictionary
export const addWordToDictionary = (
  selectedWord,
  userDictionary,
  setUserDictionary,
  setFeedbackMessage,
  setShowFeedback
) => {
  if (selectedWord) {
    let wordToAdd

    if (selectedWord.showJapaneseTranslation) {
      // English word - add the Japanese translation to dictionary
      wordToAdd = {
        japanese: selectedWord.english, // Japanese translation
        hiragana: selectedWord.hiragana, // Katakana pronunciation
        english: selectedWord.japanese, // Original English word
        level: selectedWord.level,
        example: selectedWord.example,
        exampleEn: selectedWord.exampleEn,
        source: "Fluent",
      }
    } else {
      // Japanese word - add normally
      wordToAdd = {
        japanese: selectedWord.japanese,
        hiragana: selectedWord.hiragana,
        english: selectedWord.english,
        level: selectedWord.level,
        example: selectedWord.example,
        exampleEn: selectedWord.exampleEn,
        source: "Fluent",
      }
    }

    // Check if word already exists
    const wordExists = userDictionary.some(
      (word) => word.japanese === wordToAdd.japanese
    )

    if (!wordExists) {
      setUserDictionary((prev) => [...prev, wordToAdd])
      setFeedbackMessage({
        icon: "",
        message: "Added to your dictionary!",
      })
    } else {
      setFeedbackMessage({
        icon: "",
        message: "Already in your dictionary",
      })
    }

    setShowFeedback(true)
    setTimeout(() => {
      setShowFeedback(false)
      setFeedbackMessage(null)
    }, 2000)
  }
}
