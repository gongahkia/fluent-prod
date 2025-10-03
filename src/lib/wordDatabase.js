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
  setLoading = null
) => {
  // Auto-detect if word is Japanese or English if not specified
  if (isJapanese === null) {
    isJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(word)
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

    if (isJapanese) {
      // Japanese to English
      translation = await translationService.translateText(
        cleanWord,
        "ja",
        "en"
      )
      pronunciation = cleanWord // Use the original Japanese text as pronunciation

      if (context && !contextTranslation) {
        contextTranslationResult = await translationService.translateText(
          context,
          "ja",
          "en"
        )
      }
    } else {
      // English to Japanese with vocabulary detection

      // First check if this is a vocabulary word worth learning
      if (vocabularyService.isValidVocabularyWord(cleanWord)) {
        // Use vocabulary service for enhanced translation
        const vocabData = await vocabularyService.getVocabularyWord(
          cleanWord,
          "unknown",
          context
        )

        if (vocabData && vocabData.isVocabulary) {
          translation = vocabData.japanese
          pronunciation = vocabData.japanese // Use Japanese translation as pronunciation
          isVocabularyWord = true

          setSelectedWord({
            japanese: translation,
            hiragana: pronunciation,
            english: cleanWord,
            level: vocabData.level || 5,
            example: context || `Example with "${cleanWord}".`,
            exampleEn: context || `Example with "${cleanWord}".`,
            original: cleanWord,
            isJapanese: false,
            showJapaneseTranslation: true, // Shows Japanese when clicked English
            isApiTranslated: true,
            isVocabulary: true,
            wordType: vocabData.type || "unknown",
          })

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
        "ja"
      )
      pronunciation = translation // Use Japanese translation as pronunciation

      if (context && !contextTranslation) {
        contextTranslationResult = await translationService.translateText(
          context,
          "en",
          "ja"
        )
      }
    }

    // Simple level estimation based on word length
    const level = cleanWord.length <= 4 ? 3 : cleanWord.length <= 7 ? 5 : 7

    setSelectedWord({
      japanese: isJapanese ? cleanWord : translation,
      hiragana: pronunciation,
      english: isJapanese ? translation : cleanWord,
      level: level,
      example: context || `Example with "${cleanWord}".`,
      exampleEn:
        contextTranslationResult ||
        contextTranslation ||
        (isJapanese
          ? `Example with ${cleanWord}.`
          : `「${cleanWord}」を使った例文。`),
      original: cleanWord,
      isJapanese: isJapanese,
      showJapaneseTranslation: !isJapanese,
      isApiTranslated: true, // Flag to indicate this came from API
      isVocabulary: isVocabularyWord,
    })
  } catch (error) {
    console.error("Translation API failed:", error)

    // Show error message - don't pretend we have a translation
    setSelectedWord({
      japanese: isJapanese ? cleanWord : "⚠️ Translation failed",
      hiragana: "Translation service unavailable",
      english: isJapanese ? "⚠️ Translation failed" : cleanWord,
      level: 5,
      example: context || `"${cleanWord}"`,
      exampleEn: "Translation service is currently unavailable. Please check your backend connection.",
      original: cleanWord,
      isJapanese: isJapanese,
      showJapaneseTranslation: !isJapanese,
      isApiFallback: true, // Flag to indicate API failed
      error: true
    })
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
        source: "LivePeek",
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
        source: "LivePeek",
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
