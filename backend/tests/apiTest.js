/**
 * API Integration Test
 * Tests the translation system via HTTP endpoints
 */

import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001'

console.log('🌐 Starting API Integration Test...\n')
console.log('⚠️  Make sure the backend server is running on port 3001\n')

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Test 1: Single Translation EN→JA
async function testSingleTranslation() {
  console.log('📋 TEST 1: Single Translation (EN→JA)')
  try {
    const response = await axios.post(`${API_BASE_URL}/api/translate`, {
      text: 'hello',
      fromLang: 'en',
      toLang: 'ja'
    })

    if (response.data.translation) {
      console.log(`✅ Translation successful: "${response.data.translation}"`)
      console.log(`   Provider: ${response.data.provider}`)
      console.log(`   Cached: ${response.data.cached}\n`)
      return true
    } else {
      console.log('❌ Translation failed\n')
      return false
    }
  } catch (error) {
    console.log(`❌ API Error: ${error.message}\n`)
    return false
  }
}

// Test 2: Reverse Translation JA→EN
async function testReverseTranslation() {
  console.log('📋 TEST 2: Reverse Translation (JA→EN)')
  try {
    const response = await axios.post(`${API_BASE_URL}/api/translate`, {
      text: 'こんにちは',
      fromLang: 'ja',
      toLang: 'en'
    })

    if (response.data.translation) {
      console.log(`✅ Translation successful: "${response.data.translation}"`)
      console.log(`   Provider: ${response.data.provider}\n`)
      return true
    } else {
      console.log('❌ Translation failed\n')
      return false
    }
  } catch (error) {
    console.log(`❌ API Error: ${error.message}\n`)
    return false
  }
}

// Test 3: Cross-Language Translation JA→KO
async function testCrossLanguageTranslation() {
  console.log('📋 TEST 3: Cross-Language Translation (JA→KO)')
  try {
    const response = await axios.post(`${API_BASE_URL}/api/translate`, {
      text: '猫',
      fromLang: 'ja',
      toLang: 'ko'
    })

    if (response.data.translation) {
      console.log(`✅ Translation successful: "${response.data.translation}"`)
      console.log(`   Provider: ${response.data.provider}\n`)
      return true
    } else {
      console.log('❌ Translation failed\n')
      return false
    }
  } catch (error) {
    console.log(`❌ API Error: ${error.message}\n`)
    return false
  }
}

// Test 4: Batch Translation
async function testBatchTranslation() {
  console.log('📋 TEST 4: Batch Translation (EN→JA)')
  try {
    const response = await axios.post(`${API_BASE_URL}/api/translate/batch`, {
      texts: ['hello', 'world', 'cat'],
      fromLang: 'en',
      toLang: 'ja'
    })

    if (response.data.translations && response.data.translations.length === 3) {
      console.log('✅ Batch translation successful:')
      response.data.translations.forEach((t, i) => {
        console.log(`   ${i + 1}. "${t.original}" → "${t.translation}"`)
      })
      console.log()
      return true
    } else {
      console.log('❌ Batch translation failed\n')
      return false
    }
  } catch (error) {
    console.log(`❌ API Error: ${error.message}\n`)
    return false
  }
}

// Test 5: Mixed Content Generation
async function testMixedContent() {
  console.log('📋 TEST 5: Mixed Content Generation (EN→JA)')
  try {
    const response = await axios.post(`${API_BASE_URL}/api/translate/mixed-content`, {
      text: 'The quick brown fox',
      userLevel: 3,
      targetLang: 'ja',
      sourceLang: 'en'
    })

    if (response.data.text && response.data.wordMetadata) {
      console.log('✅ Mixed content generation successful:')
      console.log(`   Text: ${response.data.text}`)
      console.log(`   Words translated: ${response.data.wordMetadata.length}\n`)
      return true
    } else {
      console.log('❌ Mixed content generation failed\n')
      return false
    }
  } catch (error) {
    console.log(`❌ API Error: ${error.message}\n`)
    return false
  }
}

// Test 6: Error Handling
async function testErrorHandling() {
  console.log('📋 TEST 6: Error Handling (Unsupported Pair)')
  try {
    const response = await axios.post(`${API_BASE_URL}/api/translate`, {
      text: 'hello',
      fromLang: 'en',
      toLang: 'fr'
    })

    if (response.data.provider === 'unsupported') {
      console.log('✅ Correctly handled unsupported language pair\n')
      return true
    } else {
      console.log('⚠️  Expected unsupported error\n')
      return false
    }
  } catch (error) {
    console.log(`⚠️  API returned error (acceptable): ${error.message}\n`)
    return true
  }
}

// Run all tests
async function runTests() {
  const results = []

  results.push(await testSingleTranslation())
  await delay(1000)

  results.push(await testReverseTranslation())
  await delay(1000)

  results.push(await testCrossLanguageTranslation())
  await delay(1000)

  results.push(await testBatchTranslation())
  await delay(2000)

  results.push(await testMixedContent())
  await delay(2000)

  results.push(await testErrorHandling())

  // Summary
  const passed = results.filter(r => r).length
  const total = results.length

  console.log('═'.repeat(50))
  console.log(`\n✅ Tests Passed: ${passed}/${total}`)

  if (passed === total) {
    console.log('\n🎉 ALL API TESTS PASSED! 🎉\n')
  } else {
    console.log(`\n⚠️  ${total - passed} test(s) failed\n`)
  }
}

runTests().catch(error => {
  console.error('Fatal error:', error.message)
  console.error('\n⚠️  Is the backend server running on port 3001?')
  process.exit(1)
})
