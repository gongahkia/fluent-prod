import translationService from "../services/translationService"
import vocabularyService from "../services/vocabularyService"

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
      contextTranslationResult,
      isVocabularyWord = false

    const langCode = targetLanguage === 'Korean' ? 'ko' : 'ja'

    if (isTargetLang) {
      // Target language to English
      translation = await translationService.translateText(
        cleanWord,
        langCode,
        "en"
      )
      pronunciation = cleanWord // Use the original text as pronunciation

      if (context && !contextTranslation) {
        contextTranslationResult = await translationService.translateText(
          context,
          langCode,
          "en"
        )
      }
    } else {
      // English to target language with vocabulary detection

      // First check if this is a vocabulary word worth learning
      if (vocabularyService.isValidVocabularyWord(cleanWord)) {
        // Use vocabulary service for enhanced translation
        const vocabData = await vocabularyService.getVocabularyWord(
          cleanWord,
          "unknown",
          context
        )

        if (vocabData && vocabData.isVocabulary) {
          // Translate to target language
          translation = await translationService.translateText(
            cleanWord,
            "en",
            langCode
          )
          pronunciation = translation
          isVocabularyWord = true

          const wordData = {
            english: cleanWord,
            level: vocabData.level || 5,
            example: context || `Example with "${cleanWord}".`,
            exampleEn: context || `Example with "${cleanWord}".`,
            original: cleanWord,
            isApiTranslated: true,
            isVocabulary: true,
            wordType: vocabData.type || "unknown",
            clickPosition: clickPosition, // Add click position for anchored popup
          }

          if (targetLanguage === 'Korean') {
            wordData.korean = translation
            wordData.romanization = pronunciation
            wordData.showKoreanTranslation = true
          } else {
            wordData.japanese = translation
            wordData.hiragana = pronunciation
            wordData.showJapaneseTranslation = true
            wordData.isJapanese = false
          }

          setSelectedWord(wordData)

          if (setLoading) {
            setLoading(false)
          }
          return
        }
      }

      // Fallback to regular translation if not a vocabulary word
      translation = await translationService.translateText(
        cleanWord,
        "en",
        langCode
      )
      pronunciation = translation

      if (context && !contextTranslation) {
        contextTranslationResult = await translationService.translateText(
          context,
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
      example: context || `Example with "${cleanWord}".`,
      exampleEn:
        contextTranslationResult ||
        contextTranslation ||
        (isTargetLang
          ? `Example with ${cleanWord}.`
          : `Example with "${cleanWord}".`),
      original: cleanWord,
      isApiTranslated: true,
      isVocabulary: isVocabularyWord,
      clickPosition: clickPosition, // Add click position for anchored popup
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
      example: context || `"${cleanWord}"`,
      exampleEn: "Translation service is currently unavailable. Please check your backend connection.",
      original: cleanWord,
      isApiFallback: true,
      error: true,
      clickPosition: clickPosition, // Add click position for anchored popup
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

// Function to detect all vocabulary words in a text
export const detectVocabularyInText = async (text) => {
  try {
    return await vocabularyService.detectVocabulary(text)
  } catch (error) {
    console.error("Vocabulary detection failed:", error)
    return []
  }
}

// Function to get vocabulary statistics for a text
export const getVocabularyStats = async (text) => {
  try {
    return await vocabularyService.getVocabularyStats(text)
  } catch (error) {
    console.error("Vocabulary stats failed:", error)
    return { totalWords: 0, byType: {}, byLevel: {}, averageLevel: 0 }
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
        icon: "📚",
        message: "Added to your dictionary!",
      })
    } else {
      setFeedbackMessage({
        icon: "ℹ️",
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
