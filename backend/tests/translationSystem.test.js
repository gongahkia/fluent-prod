/**
 * Comprehensive Test Suite for Universal Translation System
 * Tests all translation pairs and functionality
 */

import {
  translateText,
  translateBatch,
  createMixedLanguageContent,
  containsJapanese,
  containsKorean,
  containsTargetLanguage,
  isEnglishOnly,
  getSupportedTranslationPairs,
  getLanguageInfo
} from '../services/translationService.js'

// ANSI color codes for better test output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  console.log('\n' + '='.repeat(60))
  log(title, 'bold')
  console.log('='.repeat(60))
}

function logTest(testName) {
  log(`\n📋 ${testName}`, 'blue')
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

// Test counters
let totalTests = 0
let passedTests = 0
let failedTests = 0

function assert(condition, successMsg, errorMsg) {
  totalTests++
  if (condition) {
    passedTests++
    logSuccess(successMsg)
    return true
  } else {
    failedTests++
    logError(errorMsg)
    return false
  }
}

// Delay function for rate limiting
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Test 1: Configuration and Setup
async function testConfiguration() {
  logSection('TEST 1: Configuration and Setup')

  logTest('Testing translation pairs configuration')
  const pairs = getSupportedTranslationPairs()
  assert(
    pairs.length === 6,
    `Found ${pairs.length} translation pairs (expected 6)`,
    `Expected 6 translation pairs, found ${pairs.length}`
  )

  const expectedPairs = ['en-ja', 'ja-en', 'en-ko', 'ko-en', 'ja-ko', 'ko-ja']
  for (const pairKey of expectedPairs) {
    const pair = pairs.find(p => p.key === pairKey)
    assert(
      pair !== undefined,
      `Translation pair ${pairKey} is configured`,
      `Translation pair ${pairKey} is missing`
    )
  }

  logTest('Testing language information')
  const languages = ['en', 'ja', 'ko']
  for (const lang of languages) {
    const info = getLanguageInfo(lang)
    assert(
      info !== null,
      `Language info for ${lang} exists`,
      `Language info for ${lang} is missing`
    )
  }
}

// Test 2: EN→JA Translation
async function testEnglishToJapanese() {
  logSection('TEST 2: English → Japanese Translation')

  const testCases = [
    { text: 'hello', expectedContains: true },
    { text: 'world', expectedContains: true },
    { text: 'cat', expectedContains: true }
  ]

  for (const testCase of testCases) {
    logTest(`Translating "${testCase.text}" from EN to JA`)
    try {
      const result = await translateText(testCase.text, 'en', 'ja')

      assert(
        result.translation !== testCase.text,
        `Translation received: "${result.translation}"`,
        `Translation failed or returned original text`
      )

      assert(
        containsJapanese(result.translation),
        'Translation contains Japanese characters',
        'Translation does not contain Japanese characters'
      )

      assert(
        result.fromLang === 'en' && result.toLang === 'ja',
        'Language codes are correct',
        'Language codes are incorrect'
      )

      await delay(1000) // Rate limiting
    } catch (error) {
      logError(`Translation failed: ${error.message}`)
      failedTests++
    }
  }
}

// Test 3: JA→EN Translation
async function testJapaneseToEnglish() {
  logSection('TEST 3: Japanese → English Translation')

  const testCases = [
    { text: 'こんにちは', description: 'konnichiwa (hello)' },
    { text: '世界', description: 'sekai (world)' },
    { text: '猫', description: 'neko (cat)' }
  ]

  for (const testCase of testCases) {
    logTest(`Translating "${testCase.description}" from JA to EN`)
    try {
      const result = await translateText(testCase.text, 'ja', 'en')

      assert(
        result.translation !== testCase.text,
        `Translation received: "${result.translation}"`,
        `Translation failed or returned original text`
      )

      assert(
        isEnglishOnly(result.translation),
        'Translation is in English',
        'Translation is not in English'
      )

      assert(
        result.fromLang === 'ja' && result.toLang === 'en',
        'Language codes are correct',
        'Language codes are incorrect'
      )

      await delay(1000)
    } catch (error) {
      logError(`Translation failed: ${error.message}`)
      failedTests++
    }
  }
}

// Test 4: EN→KO Translation
async function testEnglishToKorean() {
  logSection('TEST 4: English → Korean Translation')

  const testCases = [
    { text: 'hello', expectedContains: true },
    { text: 'world', expectedContains: true },
    { text: 'dog', expectedContains: true }
  ]

  for (const testCase of testCases) {
    logTest(`Translating "${testCase.text}" from EN to KO`)
    try {
      const result = await translateText(testCase.text, 'en', 'ko')

      assert(
        result.translation !== testCase.text,
        `Translation received: "${result.translation}"`,
        `Translation failed or returned original text`
      )

      assert(
        containsKorean(result.translation),
        'Translation contains Korean characters',
        'Translation does not contain Korean characters'
      )

      assert(
        result.fromLang === 'en' && result.toLang === 'ko',
        'Language codes are correct',
        'Language codes are incorrect'
      )

      await delay(1000)
    } catch (error) {
      logError(`Translation failed: ${error.message}`)
      failedTests++
    }
  }
}

// Test 5: KO→EN Translation
async function testKoreanToEnglish() {
  logSection('TEST 5: Korean → English Translation')

  const testCases = [
    { text: '안녕하세요', description: 'annyeonghaseyo (hello)' },
    { text: '세계', description: 'segye (world)' },
    { text: '개', description: 'gae (dog)' }
  ]

  for (const testCase of testCases) {
    logTest(`Translating "${testCase.description}" from KO to EN`)
    try {
      const result = await translateText(testCase.text, 'ko', 'en')

      assert(
        result.translation !== testCase.text,
        `Translation received: "${result.translation}"`,
        `Translation failed or returned original text`
      )

      assert(
        isEnglishOnly(result.translation),
        'Translation is in English',
        'Translation is not in English'
      )

      assert(
        result.fromLang === 'ko' && result.toLang === 'en',
        'Language codes are correct',
        'Language codes are incorrect'
      )

      await delay(1000)
    } catch (error) {
      logError(`Translation failed: ${error.message}`)
      failedTests++
    }
  }
}

// Test 6: JA→KO Translation
async function testJapaneseToKorean() {
  logSection('TEST 6: Japanese → Korean Translation')

  const testCases = [
    { text: 'こんにちは', description: 'konnichiwa (hello)' },
    { text: '猫', description: 'neko (cat)' }
  ]

  for (const testCase of testCases) {
    logTest(`Translating "${testCase.description}" from JA to KO`)
    try {
      const result = await translateText(testCase.text, 'ja', 'ko')

      assert(
        result.translation !== testCase.text,
        `Translation received: "${result.translation}"`,
        `Translation failed or returned original text`
      )

      assert(
        containsKorean(result.translation),
        'Translation contains Korean characters',
        'Translation does not contain Korean characters'
      )

      assert(
        result.fromLang === 'ja' && result.toLang === 'ko',
        'Language codes are correct',
        'Language codes are incorrect'
      )

      await delay(1000)
    } catch (error) {
      logError(`Translation failed: ${error.message}`)
      failedTests++
    }
  }
}

// Test 7: KO→JA Translation
async function testKoreanToJapanese() {
  logSection('TEST 7: Korean → Japanese Translation')

  const testCases = [
    { text: '안녕하세요', description: 'annyeonghaseyo (hello)' },
    { text: '고양이', description: 'goyangi (cat)' }
  ]

  for (const testCase of testCases) {
    logTest(`Translating "${testCase.description}" from KO to JA`)
    try {
      const result = await translateText(testCase.text, 'ko', 'ja')

      assert(
        result.translation !== testCase.text,
        `Translation received: "${result.translation}"`,
        `Translation failed or returned original text`
      )

      assert(
        containsJapanese(result.translation),
        'Translation contains Japanese characters',
        'Translation does not contain Japanese characters'
      )

      assert(
        result.fromLang === 'ko' && result.toLang === 'ja',
        'Language codes are correct',
        'Language codes are incorrect'
      )

      await delay(1000)
    } catch (error) {
      logError(`Translation failed: ${error.message}`)
      failedTests++
    }
  }
}

// Test 8: Batch Translation
async function testBatchTranslation() {
  logSection('TEST 8: Batch Translation')

  logTest('Testing batch EN→JA translation')
  try {
    const texts = ['hello', 'world', 'cat']
    const result = await translateBatch(texts, 'en', 'ja')

    assert(
      result.translations.length === 3,
      'Received 3 translations',
      `Expected 3 translations, got ${result.translations.length}`
    )

    for (let i = 0; i < texts.length; i++) {
      assert(
        result.translations[i].translation !== texts[i],
        `Translation ${i + 1} successful: "${result.translations[i].translation}"`,
        `Translation ${i + 1} failed`
      )
    }

    await delay(2000)
  } catch (error) {
    logError(`Batch translation failed: ${error.message}`)
    failedTests++
  }

  logTest('Testing batch JA→EN translation')
  try {
    const texts = ['こんにちは', '世界', '猫']
    const result = await translateBatch(texts, 'ja', 'en')

    assert(
      result.translations.length === 3,
      'Received 3 translations',
      `Expected 3 translations, got ${result.translations.length}`
    )

    await delay(2000)
  } catch (error) {
    logError(`Batch translation failed: ${error.message}`)
    failedTests++
  }
}

// Test 9: Mixed Content Generation
async function testMixedContent() {
  logSection('TEST 9: Mixed Language Content Generation')

  logTest('Testing mixed EN→JA content (Level 3)')
  try {
    const text = 'The quick brown fox jumps over the lazy dog'
    const result = await createMixedLanguageContent(text, 3, 'ja', 'en')

    assert(
      result.text.includes('{{WORD:'),
      'Mixed content contains word markers',
      'Mixed content does not contain word markers'
    )

    assert(
      result.wordMetadata.length > 0,
      `Generated ${result.wordMetadata.length} word translations`,
      'No word metadata generated'
    )

    await delay(2000)
  } catch (error) {
    logError(`Mixed content generation failed: ${error.message}`)
    failedTests++
  }

  logTest('Testing mixed EN→KO content (Level 3)')
  try {
    const text = 'Hello world from the translation system'
    const result = await createMixedLanguageContent(text, 3, 'ko', 'en')

    assert(
      result.text.includes('{{WORD:'),
      'Mixed content contains word markers',
      'Mixed content does not contain word markers'
    )

    assert(
      result.wordMetadata.length > 0,
      `Generated ${result.wordMetadata.length} word translations`,
      'No word metadata generated'
    )

    await delay(2000)
  } catch (error) {
    logError(`Mixed content generation failed: ${error.message}`)
    failedTests++
  }
}

// Test 10: Character Detection
async function testCharacterDetection() {
  logSection('TEST 10: Character Detection Functions')

  logTest('Testing Japanese character detection')
  assert(
    containsJapanese('こんにちは'),
    'Detected Japanese in "こんにちは"',
    'Failed to detect Japanese'
  )
  assert(
    !containsJapanese('hello'),
    'Correctly identified "hello" as not Japanese',
    'Incorrectly detected Japanese in "hello"'
  )

  logTest('Testing Korean character detection')
  assert(
    containsKorean('안녕하세요'),
    'Detected Korean in "안녕하세요"',
    'Failed to detect Korean'
  )
  assert(
    !containsKorean('hello'),
    'Correctly identified "hello" as not Korean',
    'Incorrectly detected Korean in "hello"'
  )

  logTest('Testing English-only detection')
  assert(
    isEnglishOnly('hello world'),
    'Detected "hello world" as English only',
    'Failed to detect English-only text'
  )
  assert(
    !isEnglishOnly('こんにちは'),
    'Correctly identified "こんにちは" as not English',
    'Incorrectly detected "こんにちは" as English'
  )

  logTest('Testing generic language detection')
  assert(
    containsTargetLanguage('こんにちは', 'ja'),
    'Detected Japanese via containsTargetLanguage',
    'Failed generic Japanese detection'
  )
  assert(
    containsTargetLanguage('안녕하세요', 'ko'),
    'Detected Korean via containsTargetLanguage',
    'Failed generic Korean detection'
  )
}

// Test 11: Error Handling
async function testErrorHandling() {
  logSection('TEST 11: Error Handling')

  logTest('Testing unsupported translation pair')
  try {
    const result = await translateText('hello', 'en', 'fr')
    assert(
      result.provider === 'unsupported',
      'Correctly handled unsupported language pair',
      'Did not handle unsupported language pair correctly'
    )
  } catch (error) {
    logWarning('Unsupported pair threw error (acceptable)')
    totalTests++
    passedTests++
  }

  logTest('Testing invalid input')
  try {
    await translateText('', 'en', 'ja')
    logWarning('Empty string handled (may or may not translate)')
  } catch (error) {
    logWarning('Empty string threw error (acceptable)')
  }
}

// Main test runner
async function runAllTests() {
  log('\n' + '█'.repeat(60), 'bold')
  log('     UNIVERSAL TRANSLATION SYSTEM - TEST SUITE', 'bold')
  log('█'.repeat(60) + '\n', 'bold')

  try {
    await testConfiguration()
    await testEnglishToJapanese()
    await testJapaneseToEnglish()
    await testEnglishToKorean()
    await testKoreanToEnglish()
    await testJapaneseToKorean()
    await testKoreanToJapanese()
    await testBatchTranslation()
    await testMixedContent()
    await testCharacterDetection()
    await testErrorHandling()
  } catch (error) {
    logError(`Fatal test error: ${error.message}`)
    console.error(error)
  }

  // Final report
  logSection('TEST RESULTS')
  log(`\nTotal Tests: ${totalTests}`, 'bold')
  log(`Passed: ${passedTests}`, 'green')
  log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green')

  const successRate = ((passedTests / totalTests) * 100).toFixed(2)
  log(`\nSuccess Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'red')

  if (failedTests === 0) {
    log('\n🎉 ALL TESTS PASSED! 🎉\n', 'green')
  } else {
    log(`\n⚠️  ${failedTests} TEST(S) FAILED\n`, 'yellow')
  }

  process.exit(failedTests > 0 ? 1 : 0)
}

// Run tests
runAllTests()
