// Language Configuration System for Influent
// Centralized configuration for all supported languages

export const LANGUAGES = {
  JAPANESE: {
    id: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    enabled: true,
    writingSystem: {
      hasScript: true,
      scriptName: 'hiragana/kanji',
      scriptLabel: 'Reading',
      requiresReading: true,
    },
    characterRanges: {
      // Hiragana, Katakana, Kanji
      regex: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/,
      name: 'Japanese characters'
    },
    levels: {
      1: { name: 'Beginner', color: 'green' },
      2: { name: 'Intermediate', color: 'blue' },
      3: { name: 'Advanced', color: 'yellow' },
      4: { name: 'Expert', color: 'orange' },
      5: { name: 'Native', color: 'red' }
    },
    translationPairs: {
      from: 'en', // English to Japanese
      to: 'ja'
    },
    dictionaryFields: {
      word: 'japanese',
      reading: 'hiragana',
      meaning: 'english',
      exampleSentence: 'example',
      exampleTranslation: 'exampleEn'
    },
    uiLabels: {
      dictionary: 'My Japanese Dictionary',
      flashcards: 'Japanese Flashcards',
      wordLabel: 'Japanese',
      readingLabel: 'Reading (Hiragana)',
      learningMessage: 'Learning Japanese'
    }
  },

  KOREAN: {
    id: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    enabled: true,
    writingSystem: {
      hasScript: true,
      scriptName: 'hangul',
      scriptLabel: 'Romanization',
      requiresReading: true,
    },
    characterRanges: {
      // Hangul syllables and Jamo
      regex: /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/,
      name: 'Korean characters'
    },
    levels: {
      1: { name: 'Beginner', color: 'green' },
      2: { name: 'Intermediate', color: 'blue' },
      3: { name: 'Advanced', color: 'yellow' },
      4: { name: 'Expert', color: 'orange' },
      5: { name: 'Native', color: 'red' }
    },
    translationPairs: {
      from: 'en', // English to Korean
      to: 'ko'
    },
    dictionaryFields: {
      word: 'korean',
      reading: 'romanization',
      meaning: 'english',
      exampleSentence: 'example',
      exampleTranslation: 'exampleEn'
    },
    uiLabels: {
      dictionary: 'My Korean Dictionary',
      flashcards: 'Korean Flashcards',
      wordLabel: 'Korean',
      readingLabel: 'Romanization',
      learningMessage: 'Learning Korean'
    }
  }
}

// Helper functions
export const getLanguageById = (id) => {
  return Object.values(LANGUAGES).find(lang => lang.id === id) || LANGUAGES.JAPANESE
}

export const getLanguageByName = (name) => {
  return Object.values(LANGUAGES).find(lang =>
    lang.name.toLowerCase() === name.toLowerCase()
  ) || LANGUAGES.JAPANESE
}

export const getEnabledLanguages = () => {
  return Object.values(LANGUAGES).filter(lang => lang.enabled)
}

export const containsLanguageCharacters = (text, languageId) => {
  const language = getLanguageById(languageId)
  return language ? language.characterRanges.regex.test(text) : false
}

export const isEnglishOnly = (text) => {
  return /^[a-zA-Z\s.,!?;:"'()[\]{}—–-]+$/.test(text)
}

export const getLevelConfig = (languageId, level) => {
  const language = getLanguageById(languageId)
  return language ? language.levels[level] : { name: 'Beginner', color: 'green' }
}

export const getLevelColor = (languageId, level) => {
  const levelConfig = getLevelConfig(languageId, level)
  const colorMap = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500'
  }
  return colorMap[levelConfig.color] || 'bg-gray-500'
}

export const getLevelName = (languageId, level) => {
  const levelConfig = getLevelConfig(languageId, level)
  return levelConfig.name
}

export default LANGUAGES