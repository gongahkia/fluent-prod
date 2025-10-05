import React from 'react'

// Utility to decode HTML entities and clean text
export const decodeHTMLEntities = (text) => {
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

  // Check if content is JSON from translation service
  try {
    if (content.startsWith("{") && content.includes('"wordMetadata"')) {
      const parsedData = JSON.parse(content)

      if (parsedData.text && parsedData.wordMetadata) {
        // Truncate the actual text content, not the JSON structure
        const words = parsedData.text.split(/\s+/)

        if (words.length <= wordLimit) {
          return content // Return original JSON if under limit
        }

        // Create truncated version
        const truncatedText = words.slice(0, wordLimit).join(' ') + '...'

        // Filter metadata to only include words in the truncated text
        const truncatedMetadata = parsedData.wordMetadata.filter(
          wordData => truncatedText.includes(`{{WORD:${wordData.index}}}`)
        )

        // Return new JSON with truncated content
        return JSON.stringify({
          text: truncatedText,
          wordMetadata: truncatedMetadata
        })
      }
    }
  } catch (e) {
    // Not JSON, fall through to regular truncation
  }

  // Regular text truncation
  const words = content.split(/\s+/)
  if (words.length <= wordLimit) return content
  return words.slice(0, wordLimit).join(' ') + '...'
}
