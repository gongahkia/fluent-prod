import translationService from '../services/translationService';

// Shared Japanese-English word database for the entire application
// This eliminates duplication between NewsFeed and EnhancedCommentSystem
// Now enhanced with real-time translation API

// Removed hardcoded words - now using only API translations
export const japaneseWords = {};

// Removed hardcoded translations - using API only

// Removed hardcoded sentence translations - using API only

// Function to handle word clicks with real-time translation API
export const handleWordClick = async (word, setSelectedWord, isJapanese = null, context = null, contextTranslation = null, setLoading = null) => {
  // Auto-detect if word is Japanese or English if not specified
  if (isJapanese === null) {
    isJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(word);
  }

  // Clean the word (remove punctuation)
  const cleanWord = word.replace(/[。、！？]/g, '');

  // Set loading state if provided
  if (setLoading) {
    setLoading(true);
  }

  // Always use API for translation (no hardcoded words)
  try {
    console.log(`Translating word: ${cleanWord} using API...`);

    let translation, pronunciation, contextTranslationResult;

    if (isJapanese) {
      // Japanese to English
      translation = await translationService.translateText(cleanWord, 'ja', 'en');
      pronunciation = translationService.getBasicReading(cleanWord);

      if (context && !contextTranslation) {
        contextTranslationResult = await translationService.translateText(context, 'ja', 'en');
      }
    } else {
      // English to Japanese
      translation = await translationService.translateText(cleanWord, 'en', 'ja');
      pronunciation = translationService.getEnglishPronunciation(cleanWord);

      if (context && !contextTranslation) {
        contextTranslationResult = await translationService.translateText(context, 'en', 'ja');
      }
    }

    const level = translationService.estimateLevel(cleanWord);

    setSelectedWord({
      japanese: isJapanese ? cleanWord : cleanWord,
      hiragana: pronunciation,
      english: translation,
      level: level,
      example: context || `Example with "${cleanWord}".`,
      exampleEn: contextTranslationResult || contextTranslation || (isJapanese ? `Example with ${cleanWord}.` : `「${cleanWord}」を使った例文。`),
      original: cleanWord,
      isJapanese: isJapanese,
      showJapaneseTranslation: !isJapanese,
      isApiTranslated: true // Flag to indicate this came from API
    });

  } catch (error) {
    console.error('Translation API failed:', error);

    // Minimal fallback when API fails
    setSelectedWord({
      japanese: cleanWord,
      hiragana: cleanWord.toLowerCase(),
      english: `Translation unavailable for "${cleanWord}"`,
      level: 5,
      example: context || `Example with "${cleanWord}".`,
      exampleEn: context || `Translation unavailable.`,
      original: cleanWord,
      isJapanese: isJapanese,
      showJapaneseTranslation: !isJapanese,
      isApiFallback: true // Flag to indicate API failed
    });
  } finally {
    // Clear loading state
    if (setLoading) {
      setLoading(false);
    }
  }
};

// Function to add word to dictionary
export const addWordToDictionary = (selectedWord, userDictionary, setUserDictionary, setFeedbackMessage, setShowFeedback) => {
  if (selectedWord) {
    let wordToAdd;
    
    if (selectedWord.showJapaneseTranslation) {
      // English word - add the Japanese translation to dictionary
      wordToAdd = {
        japanese: selectedWord.english, // Japanese translation
        hiragana: selectedWord.hiragana, // Katakana pronunciation
        english: selectedWord.japanese, // Original English word
        level: selectedWord.level,
        example: selectedWord.example,
        exampleEn: selectedWord.exampleEn,
        source: "LivePeek"
      };
    } else {
      // Japanese word - add normally
      wordToAdd = {
        japanese: selectedWord.japanese,
        hiragana: selectedWord.hiragana,
        english: selectedWord.english,
        level: selectedWord.level,
        example: selectedWord.example,
        exampleEn: selectedWord.exampleEn,
        source: "LivePeek"
      };
    }

    // Check if word already exists
    const wordExists = userDictionary.some(word => word.japanese === wordToAdd.japanese);
    
    if (!wordExists) {
      setUserDictionary(prev => [...prev, wordToAdd]);
      setFeedbackMessage({
        icon: "📚",
        message: "Added to your dictionary!"
      });
    } else {
      setFeedbackMessage({
        icon: "ℹ️",
        message: "Already in your dictionary"
      });
    }
    
    setShowFeedback(true);
    setTimeout(() => {
      setShowFeedback(false);
      setFeedbackMessage(null);
    }, 2000);
  }
};
