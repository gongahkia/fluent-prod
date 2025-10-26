import { GoogleGenerativeAI } from '@google/generative-ai'
import NodeCache from 'node-cache'

// Cache for 30 minutes
const cache = new NodeCache({ stdTTL: 1800 })

// Function to truncate post content if too long
function truncateContent(content, maxLength = 1000) {
  if (content.length <= maxLength) {
    return content
  }
  return content.substring(0, maxLength) + '...'
}

export async function generateCommentSuggestions(postContent, postTitle = '', numberOfSuggestions = 3, apiKey = null, targetLanguage = 'Japanese') {
  // Use provided API key or fallback to environment variable
  const geminiApiKey = apiKey || process.env.GEMINI_API_KEY

  if (!geminiApiKey) {
    console.log('Gemini API key not configured')
    return {
      suggestions: [],
      error: 'AI suggestions unavailable - API key not configured'
    }
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey)

  try {
    const cacheKey = `comment:${targetLanguage}:${postContent.substring(0, 100)}`
    const cached = cache.get(cacheKey)

    if (cached) {
      console.log('Returning cached AI suggestions')
      return cached
    }

    // Use Gemini 2.0 Flash (free tier model)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    const truncatedContent = truncateContent(postContent)

    // Language-specific examples
    const languageExamples = {
      Japanese: {
        example1: 'This looks incredible! 行ってみたいです！ (I want to go there!)',
        example2: 'Beautiful photos! 日本の文化は本当に素晴らしいですね。',
        mixExample: 'This is amazing! どこですか？'
      },
      Korean: {
        example1: 'This looks incredible! 가보고 싶어요! (I want to go there!)',
        example2: 'Beautiful photos! 한국 문화는 정말 멋지네요.',
        mixExample: 'This is amazing! 어디예요?'
      }
    }

    const examples = languageExamples[targetLanguage] || languageExamples.Japanese

    const prompt = `You are helping language learners practice writing comments in a mix of English and ${targetLanguage}.

Post Title: ${postTitle || 'N/A'}
Post Content: ${truncatedContent}

Generate ${numberOfSuggestions} thoughtful comment suggestions that:
1. Are relevant to the post content
2. Mix English and ${targetLanguage} naturally (like "${examples.mixExample}")
3. Are friendly and conversational
4. Encourage language learning
5. Are culturally appropriate
6. Use ONLY ${targetLanguage} for the non-English parts (not Japanese if learning Korean, not Korean if learning Japanese)

Format each suggestion as:
[Suggestion number]. [Mixed language comment]

Example format:
1. ${examples.example1}
2. ${examples.example2}

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

// Grammar checking function
export async function checkGrammar(commentText, targetLanguage = 'Japanese', apiKey = null) {
  const geminiApiKey = apiKey || process.env.GEMINI_API_KEY

  if (!geminiApiKey) {
    console.log('Gemini API key not configured')
    return {
      isCorrect: true,
      error: 'Grammar checking unavailable - API key not configured'
    }
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey)

  try {
    const cacheKey = `grammar:${targetLanguage}:${commentText.substring(0, 100)}`
    const cached = cache.get(cacheKey)

    if (cached) {
      console.log('Returning cached grammar check')
      return cached
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    // Detect if the comment contains the target language
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(commentText)
    const hasKorean = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(commentText)

    let languageDetected = false
    if (targetLanguage === 'Japanese' && hasJapanese) languageDetected = true
    if (targetLanguage === 'Korean' && hasKorean) languageDetected = true

    // If no target language detected, skip grammar checking
    if (!languageDetected) {
      return {
        isCorrect: true,
        message: 'No grammar checking needed - comment is in English only',
        languageDetected: false
      }
    }

    const prompt = `You are a ${targetLanguage} language teacher checking grammar for a language learner.

Student's comment: "${commentText}"

Analyze the ${targetLanguage} grammar in this comment. Check for:
1. Particle usage (は、が、を、に、で, etc. for Japanese / 은/는, 이/가, 을/를, etc. for Korean)
2. Verb conjugation
3. Politeness levels (適切な敬語 for Japanese / 존댓말 for Korean)
4. Word order
5. Natural phrasing

If there are grammar errors or unnatural expressions:
- Respond with: ERROR
- Then on the next line: [Corrected version of the comment]
- Then explain what was wrong

If the grammar is correct or has only minor style issues:
- Respond with: CORRECT
- Then optionally suggest a more natural alternative if you have one

Be encouraging and constructive. Only mark as ERROR if there are actual grammatical mistakes.

Your response:`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text().trim()

    // Parse the response
    const isCorrect = text.startsWith('CORRECT')
    const lines = text.split('\n').map(l => l.trim()).filter(l => l)

    let correctedText = null
    let explanation = null

    if (!isCorrect) {
      // Format: ERROR\n[corrected text]\n[explanation]
      if (lines.length > 1) {
        correctedText = lines[1]
        explanation = lines.slice(2).join(' ')
      }
    } else {
      // Check if there's a suggestion after CORRECT
      if (lines.length > 1) {
        explanation = lines.slice(1).join(' ')
      }
    }

    const result_data = {
      isCorrect,
      correctedText,
      explanation,
      originalText: commentText,
      languageDetected: true,
      model: 'Gemini 2.0 Flash (Free)',
      cached: false
    }

    cache.set(cacheKey, result_data)
    return result_data

  } catch (error) {
    console.error('Gemini API error (grammar check):', error.message)

    // On error, allow posting without blocking
    return {
      isCorrect: true,
      error: error.message,
      message: 'Grammar checking unavailable, but you can still post',
      cached: false
    }
  }
}
