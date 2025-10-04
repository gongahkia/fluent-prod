import { GoogleGenerativeAI } from '@google/generative-ai'
import NodeCache from 'node-cache'

// Cache for 30 minutes
const cache = new NodeCache({ stdTTL: 1800 })

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

// Function to truncate post content if too long
function truncateContent(content, maxLength = 1000) {
  if (content.length <= maxLength) {
    return content
  }
  return content.substring(0, maxLength) + '...'
}

export async function generateCommentSuggestions(postContent, postTitle = '', numberOfSuggestions = 3) {
  if (!genAI) {
    console.log('Gemini API key not configured')
    return {
      suggestions: [],
      error: 'AI suggestions unavailable - API key not configured'
    }
  }

  try {
    const cacheKey = `comment:${postContent.substring(0, 100)}`
    const cached = cache.get(cacheKey)

    if (cached) {
      console.log('Returning cached AI suggestions')
      return cached
    }

    // Use Gemini 2.0 Flash (free tier model)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    const truncatedContent = truncateContent(postContent)

    const prompt = `You are helping language learners practice writing comments in a mix of English and Japanese.

Post Title: ${postTitle || 'N/A'}
Post Content: ${truncatedContent}

Generate ${numberOfSuggestions} thoughtful comment suggestions that:
1. Are relevant to the post content
2. Mix English and Japanese naturally (like "This is amazing! どこですか？")
3. Are friendly and conversational
4. Encourage language learning
5. Are culturally appropriate

Format each suggestion as:
[Suggestion number]. [Mixed language comment]

Example format:
1. This looks incredible! 行ってみたいです！ (I want to go there!)
2. Beautiful photos! 日本の文化は本当に素晴らしいですね。

Provide exactly ${numberOfSuggestions} suggestions.`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()

    // Parse suggestions from the response
    const suggestions = text
      .split('\n')
      .filter(line => line.match(/^\d+\./))
      .map(line => {
        // Remove the number prefix
        const cleanedLine = line.replace(/^\d+\.\s*/, '').trim()

        // Try to extract the English translation if provided in parentheses
        const match = cleanedLine.match(/^(.+?)\s*\(([^)]+)\)\s*$/)
        if (match) {
          return {
            text: match[1].trim(),
            translation: match[2].trim()
          }
        }

        return {
          text: cleanedLine,
          translation: null
        }
      })
      .slice(0, numberOfSuggestions)

    const result_data = {
      suggestions,
      model: 'Gemini 2.0 Flash (Free)',
      cached: false
    }

    cache.set(cacheKey, result_data)
    return result_data

  } catch (error) {
    console.error('Gemini API error:', error.message)

    // Return fallback suggestions if API fails
    return {
      suggestions: [
        {
          text: 'This is interesting! もっと知りたいです。',
          translation: 'I want to know more.'
        },
        {
          text: 'Great post! 日本語の勉強になります。',
          translation: 'This helps with studying Japanese.'
        },
        {
          text: 'Thanks for sharing! 素晴らしい内容ですね。',
          translation: 'This is wonderful content.'
        }
      ],
      model: 'Gemini 2.0 Flash (Free)',
      error: error.message,
      cached: false
    }
  }
}
