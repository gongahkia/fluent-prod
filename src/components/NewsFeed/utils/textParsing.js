import React from 'react'

// Utility to decode HTML entities and clean text
export const decodeHTMLEntities = (text) => {
  // Handle non-string inputs
  if (!text) return ''
  
  // If text is an object, try to stringify it first
  if (typeof text === 'object') {
    console.warn('decodeHTMLEntities received an object, stringifying:', text)
    try {
      text = JSON.stringify(text)
    } catch (e) {
      console.error('Failed to stringify object in decodeHTMLEntities:', e)
      return String(text)
    }
  }
  
  // Ensure text is a string
  if (typeof text !== 'string') {
    return String(text)
  }
  
  const textarea = document.createElement('textarea')
  textarea.innerHTML = text
  return textarea.value
}

// Function to segment Japanese text into meaningful words/phrases
export const segmentJapaneseText = (text) => {
  // Define common Japanese word patterns and boundaries
  const wordPatterns = [
    // Multi-character words from our database (longest first)
    "地元の人だけが知る",
    "何世代にもわたって",
    "これらの",
    "family-run",
    "self-expression",
    "limited-time",
    "constantly",
    "Traditional",
    "businesses",
    "generation",
    "地元",
    "人だけが",
    "だけが",
    "知る",
    "ラーメン",
    "東京",
    "最も",
    "地区",
    "地下",
    "探索",
    "何世代",
    "にもわたって",
    "提供",
    "してきました",
    "若者",
    "creativity",
    "させています",
    "変化",
    "見られます",
    "文化",
    "伝統",
    "桜",
    "季節",
    "原宿",
    "渋谷",
    "大阪",
    "京都",
    "九州",
    "古い",
    "生活",
    "tradition",
    "elements",
    "products",
    "visitors",
    "attract",
    "Young",
    "people",
    "Tokyo",
    "modern",
    "trends",
    "fusion",
    "Sakura",
    "tourism",
    "industry",
    "massive",
    "boost",
    "Local",
    "special",
    "events",
    "hidden",
    "culture",
    "business",
    "authentic",
    "style",
    // Common particles and grammar
    "の",
    "が",
    "は",
    "を",
    "に",
    "で",
    "と",
    "も",
  ]

  const result = []
  let remaining = text

  while (remaining.length > 0) {
    let matched = false

    // Try to match longer patterns first
    for (const pattern of wordPatterns.sort((a, b) => b.length - a.length)) {
      if (remaining.startsWith(pattern)) {
        result.push({ text: pattern, isWord: true })
        remaining = remaining.slice(pattern.length)
        matched = true
        break
      }
    }

    if (!matched) {
      // If no pattern matches, take one character
      result.push({ text: remaining[0], isWord: false })
      remaining = remaining.slice(1)
    }
  }

  return result
}

// Check if content should be truncated
export const shouldTruncateContent = (content) => {
  if (!content) return false
  const wordCount = content.split(/\s+/).length
  return wordCount > 100
}

// Truncate content to word limit - handles JSON from translation service
export const truncateContent = (content, wordLimit = 100) => {
  if (!content) return ""

  // Ensure content is a string
  if (typeof content !== 'string') {
    console.warn('truncateContent received non-string:', content)
    content = String(content)
  }

  // Check if content is JSON from translation service
  try {
    if (content.trim().startsWith("{") && content.includes('"wordMetadata"')) {
      const parsedData = JSON.parse(content)

      if (parsedData.text && parsedData.wordMetadata !== undefined) {
        // Ensure text is a string
        const text = String(parsedData.text)
        const words = text.split(/\s+/)

        if (words.length <= wordLimit) {
          return content // Return original JSON if under limit
        }

        // Create truncated version
        const truncatedText = words.slice(0, wordLimit).join(' ') + '...'

        // Filter metadata to only include words in the truncated text
        const truncatedMetadata = Array.isArray(parsedData.wordMetadata)
          ? parsedData.wordMetadata.filter(
              wordData => wordData && truncatedText.includes(`{{WORD:${wordData.index}}}`)
            )
          : []

        // Return new JSON with truncated content
        return JSON.stringify({
          text: truncatedText,
          wordMetadata: truncatedMetadata
        })
      }
    }
  } catch (e) {
    // Not JSON, fall through to regular truncation
    console.warn('Failed to parse JSON in truncateContent:', e)
  }

  // Regular text truncation
  const words = content.split(/\s+/)
  if (words.length <= wordLimit) return content
  return words.slice(0, wordLimit).join(' ') + '...'
}
