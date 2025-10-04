import express from 'express'
import { generateCommentSuggestions } from '../services/aiService.js'

const router = express.Router()

// POST /api/ai/comment-suggestions - Generate comment suggestions
router.post('/comment-suggestions', async (req, res, next) => {
  try {
    const {
      postContent,
      postTitle,
      numberOfSuggestions = 3
    } = req.body

    if (!postContent) {
      return res.status(400).json({ error: 'Post content is required' })
    }

    const result = await generateCommentSuggestions(
      postContent,
      postTitle,
      Math.min(numberOfSuggestions, 5) // Max 5 suggestions
    )

    res.json(result)
  } catch (error) {
    next(error)
  }
})

export default router
