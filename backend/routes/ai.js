import express from 'express'
import { generateCommentSuggestions, checkGrammar } from '../services/aiService.js'

const router = express.Router()

// POST /api/ai/comment-suggestions - Generate comment suggestions
router.post('/comment-suggestions', async (req, res, next) => {
  try {
    const {
      postContent,
      postTitle,
      numberOfSuggestions = 3,
      geminiApiKey = null,
      targetLanguage = 'Japanese'
    } = req.body

    if (!postContent) {
      return res.status(400).json({ error: 'Post content is required' })
    }

    const result = await generateCommentSuggestions(
      postContent,
      postTitle,
      Math.min(numberOfSuggestions, 5), // Max 5 suggestions
      geminiApiKey,
      targetLanguage
    )

    res.json(result)
  } catch (error) {
    next(error)
  }
})

// POST /api/ai/check-grammar - Check grammar before posting
router.post('/check-grammar', async (req, res, next) => {
  try {
    const {
      commentText,
      targetLanguage = 'Japanese',
      geminiApiKey = null
    } = req.body

    if (!commentText) {
      return res.status(400).json({ error: 'Comment text is required' })
    }

    const result = await checkGrammar(
      commentText,
      targetLanguage,
      geminiApiKey
    )

    res.json(result)
  } catch (error) {
    next(error)
  }
})

export default router
