# Universal Translation System - Quick Start Guide

## 🚀 Using the Translation System

### Basic Translation

```javascript
import translationService from './services/translationService.js'

// Translate text
const result = await translationService.translateText('hello', 'en', 'ja')
console.log(result) // "こんにちは"
```

### All Supported Pairs

```javascript
// English → Japanese
await translationService.translateText('hello', 'en', 'ja')

// Japanese → English
await translationService.translateText('こんにちは', 'ja', 'en')

// English → Korean
await translationService.translateText('hello', 'en', 'ko')

// Korean → English
await translationService.translateText('안녕하세요', 'ko', 'en')

// Japanese → Korean
await translationService.translateText('こんにちは', 'ja', 'ko')

// Korean → Japanese
await translationService.translateText('안녕하세요', 'ko', 'ja')
```

### Batch Translation

```javascript
const results = await translationService.translateBatch(
  ['hello', 'world', 'cat'],
  'en',
  'ja'
)

results.forEach(r => {
  console.log(`${r.original} → ${r.translation}`)
})
```

### Mixed Language Content (for Learning)

```javascript
const mixed = await translationService.createMixedLanguageContent(
  'The quick brown fox jumps over the lazy dog',
  3,      // user level (1-5)
  'ja',   // target language
  'en'    // source language
)

console.log(mixed.text) // Text with {{WORD:X}} markers
console.log(mixed.wordMetadata) // Array of translated words
```

### Check if Translation Pair is Supported

```javascript
const isSupported = translationService.isTranslationPairSupported('en', 'ja')
console.log(isSupported) // true

const notSupported = translationService.isTranslationPairSupported('en', 'fr')
console.log(notSupported) // false
```

### Get All Supported Pairs

```javascript
const pairs = translationService.getSupportedTranslationPairs()
console.log(pairs)
// [
//   { key: 'en-ja', from: 'en', to: 'ja', ... },
//   { key: 'ja-en', from: 'ja', to: 'en', ... },
//   ...
// ]
```

### Language Detection

```javascript
// Check for Japanese characters
const hasJP = translationService.containsJapanese('こんにちは')
console.log(hasJP) // true

// Check for Korean characters
const hasKR = translationService.containsKorean('안녕하세요')
console.log(hasKR) // true

// Check if English only
const isEn = translationService.isEnglishOnly('hello world')
console.log(isEn) // true

// Generic language detection
const hasLang = translationService.containsLanguageCharacters('猫', 'ja')
console.log(hasLang) // true
```

### Get Language Information

```javascript
const jaInfo = translationService.getLanguageInfo('ja')
console.log(jaInfo)
// {
//   code: 'ja',
//   name: 'Japanese',
//   nativeName: '日本語',
//   flag: '🇯🇵',
//   ...
// }
```

## 🧪 Testing

### Quick Test (5 seconds)
```bash
cd backend
node tests/quickTest.js
```

### Full Test Suite (2-3 minutes)
```bash
cd backend
node tests/translationSystem.test.js
```

### API Test (requires server running)
```bash
# Terminal 1
cd backend
npm start

# Terminal 2
cd backend
node tests/apiTest.js
```

## ➕ Adding a New Language

### 1. Edit `src/config/translationMappings.json`

Add language:
```json
{
  "languages": {
    "es": {
      "code": "es",
      "name": "Spanish",
      "nativeName": "Español",
      "flag": "🇪🇸",
      "characterRanges": {
        "regex": "[áéíóúñü\\w\\s.,!?;:\"'()[\\]{}—–-]+",
        "description": "Spanish characters"
      }
    }
  }
}
```

Add translation pairs:
```json
{
  "translationPairs": {
    "en-es": {
      "from": "en",
      "to": "es",
      "enabled": true,
      "bidirectional": true,
      "apiProviders": ["lingva", "mymemory", "libretranslate"],
      "priority": 1
    },
    "es-en": {
      "from": "es",
      "to": "en",
      "enabled": true,
      "bidirectional": true,
      "apiProviders": ["lingva", "mymemory", "libretranslate"],
      "priority": 1
    }
  }
}
```

### 2. Copy to Backend
```bash
cp src/config/translationMappings.json backend/config/translationMappings.json
```

### 3. Test
```bash
cd backend
node tests/quickTest.js
```

**Done!** No code changes needed.

## 🎯 Common Use Cases

### Use Case 1: Translate User Input
```javascript
async function handleUserInput(text, fromLang, toLang) {
  try {
    const translation = await translationService.translateText(text, fromLang, toLang)
    return translation
  } catch (error) {
    console.error('Translation failed:', error)
    return text // Return original on error
  }
}
```

### Use Case 2: Create Learning Content
```javascript
async function createLearningPost(englishText, userLevel, targetLang) {
  const mixed = await translationService.createMixedLanguageContent(
    englishText,
    userLevel,
    targetLang,
    'en'
  )

  return {
    displayText: mixed.text,
    wordData: mixed.wordMetadata
  }
}
```

### Use Case 3: Multi-Language Dictionary
```javascript
async function translateWordToMultipleLanguages(word) {
  const languages = ['ja', 'ko']
  const translations = {}

  for (const lang of languages) {
    translations[lang] = await translationService.translateText(word, 'en', lang)
  }

  return translations
}
```

## 🔍 Troubleshooting

### Translation Returns Original Text
- Check if the translation pair is supported
- Verify API providers are accessible
- Check network connectivity
- Review backend logs for API errors

### Empty or Null Translation
- Ensure text is not empty
- Check language codes are valid
- Verify translation pair exists in JSON config

### Rate Limiting Errors
- Translation APIs have rate limits
- System automatically falls back to other providers
- Consider implementing request throttling

## 📚 Documentation

- **Full Guide**: `docs/UNIVERSAL_TRANSLATION_SYSTEM.md`
- **Summary**: `TRANSLATION_SYSTEM_SUMMARY.md`
- **This Guide**: `TRANSLATION_QUICK_START.md`

## 🎉 That's It!

You now have a fully functional, bidirectional, modular translation system. Happy translating! 🌐
