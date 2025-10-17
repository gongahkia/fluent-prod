// Language Configuration System for Fluent
// Centralized configuration for all supported languages
// Now uses translationMappings.json for true universal configuration

import translationMappings from './translationMappings.json'

// Build LANGUAGES object from JSON mappings
export const LANGUAGES = {}

// Populate LANGUAGES with data from JSON
Object.entries(translationMappings.languages).forEach(([code, langData]) => {
  const langKey = code.toUpperCase()

  LANGUAGES[langKey] = {
    id: langData.code,
    name: langData.name,
    nativeName: langData.nativeName,
    flag: langData.flag,
    enabled: true,
    writingSystem: langData.writingSystem || {
      hasScript: false,
      scriptName: '',
      scriptLabel: '',
      requiresReading: false
    },
    characterRanges: {
      regex: new RegExp(langData.characterRanges.regex),
      name: langData.characterRanges.description
    },
    levels: translationMappings.learningLevels,
    // Get translation pairs for this language
    translationPairs: Object.entries(translationMappings.translationPairs)
      .filter(([_, pair]) => pair.from === code && pair.enabled)
      .reduce((acc, [key, pair]) => {
        acc[pair.to] = {
          from: pair.from,
          to: pair.to
        }
        return acc
      }, {}),
    dictionaryFields: translationMappings.dictionaryFields[code] || {},
    uiLabels: translationMappings.uiLabels[code] || {}
  }
})

// Helper functions
export const getLanguageById = (id) => {
  return Object.values(LANGUAGES).find(lang => lang.id === id) || LANGUAGES.EN || LANGUAGES.JA
}

export const getLanguageByName = (name) => {
  return Object.values(LANGUAGES).find(lang =>
    lang.name.toLowerCase() === name.toLowerCase()
  ) || LANGUAGES.EN || LANGUAGES.JA
}

export const getEnabledLanguages = () => {
  return Object.values(LANGUAGES).filter(lang => lang.enabled)
}

export const containsLanguageCharacters = (text, languageId) => {
  const language = getLanguageById(languageId)
  return language ? language.characterRanges.regex.test(text) : false
}

export const isEnglishOnly = (text) => {
  const enLang = LANGUAGES.EN
  return enLang ? enLang.characterRanges.regex.test(text) : /^[a-zA-Z\s.,!?;:"'()[\]{}—–-]+$/.test(text)
}

export const getLevelConfig = (languageId, level) => {
  const language = getLanguageById(languageId)
  if (!language) return { name: 'Beginner', translationPercentage: 0.15, color: 'green' }
  return language.levels[level] || language.levels['1']
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

// Get all supported translation pairs
export const getSupportedTranslationPairs = () => {
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

// Check if a translation pair is supported
export const isTranslationPairSupported = (fromLang, toLang) => {
  const pairKey = `${fromLang}-${toLang}`
  const pair = translationMappings.translationPairs[pairKey]
  return pair && pair.enabled
}

export default LANGUAGES
