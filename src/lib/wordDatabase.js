import translationService from "../services/translationService"

// Shared Japanese-English word database for the entire application
// This eliminates duplication between NewsFeed and EnhancedCommentSystem
// Now enhanced with real-time translation API and NER-based vocabulary detection

// Removed hardcoded words - now using only API translations
export const japaneseWords = {}

// Function to handle word clicks with enhanced vocabulary detection
export const handleWordClick = async (
  word,
  setSelectedWord,
  isJapanese = null,
  context = null,
  contextTranslation = null,
  setLoading = null,
  targetLanguage = 'Japanese', // Add target language parameter
  clickPosition = null // Add click position parameter
) => {
  const contextText = typeof context === 'string' ? context : (context?.text || null)
  const contextPostHash = typeof context === 'object' && context ? (context.postHash || context.postId || null) : null

  // Auto-detect if word is in target language or English if not specified
  let isTargetLang = isJapanese
  if (isTargetLang === null) {
    if (targetLanguage === 'Korean') {
      isTargetLang = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(word)
    } else {
      isTargetLang = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(word)
    }
  }

  // Clean the word (remove punctuation)
  const cleanWord = word.replace(/[。、！？]/g, "")

  // Set loading state if provided
  if (setLoading) {
    setLoading(true)
  }

  try {
    console.log(
      `Translating word: ${cleanWord} using API with vocabulary detection...`
    )

    let translation,
      pronunciation,
      contextTranslationResult

    const langCode = targetLanguage === 'Korean' ? 'ko' : 'ja'

    if (isTargetLang) {
      // Target language to English
      translation = await translationService.translateText(
        cleanWord,
        langCode,
        "en"
      )
      pronunciation = cleanWord // Use the original text as pronunciation

      if (contextText && !contextTranslation) {
        contextTranslationResult = await translationService.translateText(
          contextText,
          langCode,
          "en"
        )
      }
    } else {
      // English to target language with vocabulary detection
      // Regular translation (backend-free)
      translation = await translationService.translateText(
        cleanWord,
        "en",
        langCode
      )
      pronunciation = translation

      if (contextText && !contextTranslation) {
        contextTranslationResult = await translationService.translateText(
          contextText,
          "en",
          langCode
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
      isVocabulary: true,
      clickPosition: clickPosition, // Add click position for anchored popup
      postHash: contextPostHash,
    }

    if (targetLanguage === 'Korean') {
      wordData.korean = isTargetLang ? cleanWord : translation
      wordData.romanization = pronunciation
      wordData.showKoreanTranslation = !isTargetLang
    } else {
      wordData.japanese = isTargetLang ? cleanWord : translation
      wordData.hiragana = pronunciation
      wordData.isJapanese = isTargetLang
      wordData.showJapaneseTranslation = !isTargetLang
    }

    setSelectedWord(wordData)
  } catch (error) {
    console.error("Translation API failed:", error)

    // Show error message - don't pretend we have a translation
    const errorData = {
      english: isTargetLang ? "⚠️ Translation failed" : cleanWord,
      level: 5,
      example: contextText || `"${cleanWord}"`,
      exampleEn: "Translation service is currently unavailable.",
      original: cleanWord,
      isApiFallback: true,
      error: true,
      clickPosition: clickPosition, // Add click position for anchored popup
      postHash: contextPostHash,
    }

    if (targetLanguage === 'Korean') {
      errorData.korean = isTargetLang ? cleanWord : "⚠️ Translation failed"
      errorData.romanization = "Translation service unavailable"
      errorData.showKoreanTranslation = !isTargetLang
    } else {
      errorData.japanese = isTargetLang ? cleanWord : "⚠️ Translation failed"
      errorData.hiragana = "Translation service unavailable"
      errorData.isJapanese = isTargetLang
      errorData.showJapaneseTranslation = !isTargetLang
    }

    setSelectedWord(errorData)
  } finally {
    // Clear loading state
    if (setLoading) {
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
