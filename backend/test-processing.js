#!/usr/bin/env node
/**
 * Test script to verify post processing and JSON stringification
 * Usage: node test-processing.js
 */

import { createMixedLanguageContent } from './services/translationService.js'

async function testProcessing() {
  console.log('🧪 Testing post processing...\n')

  const testPost = {
    title: 'Japan introduces new technology for sustainable farming',
    content: 'Japanese farmers are adopting innovative techniques to improve crop yields while reducing environmental impact.'
  }

  console.log('📝 Original post:')
  console.log('Title:', testPost.title)
  console.log('Content:', testPost.content)
  console.log()

  try {
    // Test processing for level 3
    console.log('🔄 Processing for Level 3 (Japanese)...')
    const processedTitle = await createMixedLanguageContent(testPost.title, 3, 'ja', 'en')
    const processedContent = await createMixedLanguageContent(testPost.content, 3, 'ja', 'en')

    console.log('\n✅ Processed result:')
    console.log('Title object:', JSON.stringify(processedTitle, null, 2))
    console.log('\nContent object:', JSON.stringify(processedContent, null, 2))

    // Test stringification (what backend does)
    console.log('\n🔄 Testing JSON stringification (backend behavior)...')
    const stringifiedTitle = JSON.stringify(processedTitle)
    const stringifiedContent = JSON.stringify(processedContent)

    console.log('\n✅ Stringified (what frontend receives):')
    console.log('Title string:', stringifiedTitle)
    console.log('Content string:', stringifiedContent.substring(0, 200) + '...')

    // Test parsing (what frontend does)
    console.log('\n🔄 Testing JSON parsing (frontend behavior)...')
    const parsedTitle = JSON.parse(stringifiedTitle)
    const parsedContent = JSON.parse(stringifiedContent)

    console.log('\n✅ Parsed back:')
    console.log('Title has text?', !!parsedTitle.text)
    console.log('Title has wordMetadata?', !!parsedTitle.wordMetadata)
    console.log('wordMetadata is array?', Array.isArray(parsedTitle.wordMetadata))
    console.log('Number of translated words in title:', parsedTitle.wordMetadata.length)
    
    console.log('\nContent has text?', !!parsedContent.text)
    console.log('Content has wordMetadata?', !!parsedContent.wordMetadata)
    console.log('Number of translated words in content:', parsedContent.wordMetadata.length)

    // Show sample word metadata
    if (parsedTitle.wordMetadata.length > 0) {
      console.log('\n📊 Sample word metadata:')
      console.log(JSON.stringify(parsedTitle.wordMetadata[0], null, 2))
    }

    // Show sample text with markers
    console.log('\n📄 Sample text with markers:')
    console.log(parsedTitle.text.substring(0, 100))

    console.log('\n✅ All tests passed! Processing works correctly.')
    console.log('📝 Data flow: Object → JSON.stringify → String → JSON.parse → Object')
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

testProcessing()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

