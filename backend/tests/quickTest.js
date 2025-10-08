/**
 * Quick Test - Verify core translation functionality
 * This is a faster, simpler test for rapid verification
 */

import {
  translateText,
  getSupportedTranslationPairs,
  getLanguageInfo
} from '../services/translationService.js'

console.log('🚀 Starting Quick Translation System Test...\n')

// Test 1: Check configuration
console.log('✅ TEST 1: Configuration')
const pairs = getSupportedTranslationPairs()
console.log(`   - Found ${pairs.length} translation pairs`)
console.log('   - Supported pairs:', pairs.map(p => p.key).join(', '))

const enInfo = getLanguageInfo('en')
const jaInfo = getLanguageInfo('ja')
const koInfo = getLanguageInfo('ko')
console.log(`   - Languages configured: ${enInfo.name}, ${jaInfo.name}, ${koInfo.name}\n`)

// Test 2: EN→JA
console.log('✅ TEST 2: EN→JA Translation')
try {
  const result = await translateText('hello', 'en', 'ja')
  console.log(`   - "hello" → "${result.translation}"`)
  console.log(`   - Provider: ${result.provider}`)
  console.log(`   - Cached: ${result.cached}\n`)
} catch (error) {
  console.error(`   ❌ Error: ${error.message}\n`)
}

// Test 3: JA→EN
console.log('✅ TEST 3: JA→EN Translation')
try {
  const result = await translateText('こんにちは', 'ja', 'en')
  console.log(`   - "こんにちは" → "${result.translation}"`)
  console.log(`   - Provider: ${result.provider}`)
  console.log(`   - Cached: ${result.cached}\n`)
} catch (error) {
  console.error(`   ❌ Error: ${error.message}\n`)
}

// Test 4: EN→KO
console.log('✅ TEST 4: EN→KO Translation')
try {
  const result = await translateText('hello', 'en', 'ko')
  console.log(`   - "hello" → "${result.translation}"`)
  console.log(`   - Provider: ${result.provider}`)
  console.log(`   - Cached: ${result.cached}\n`)
} catch (error) {
  console.error(`   ❌ Error: ${error.message}\n`)
}

// Test 5: JA→KO
console.log('✅ TEST 5: JA→KO Translation')
try {
  const result = await translateText('猫', 'ja', 'ko')
  console.log(`   - "猫" → "${result.translation}"`)
  console.log(`   - Provider: ${result.provider}`)
  console.log(`   - Cached: ${result.cached}\n`)
} catch (error) {
  console.error(`   ❌ Error: ${error.message}\n`)
}

console.log('🎉 Quick test complete!\n')
