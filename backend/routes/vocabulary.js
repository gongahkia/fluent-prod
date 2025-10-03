import express from 'express'
import {
  detectVocabulary,
  createVocabularyWord,
  getVocabularyStats,
  isValidVocabularyWord
} from '../services/vocabularyService.js'

const router = express.Router()

// POST /api/vocabulary/detect - Detect vocabulary words in text
router.post('/detect', async (req, res, next) => {
  try {
    const { text } = req.body

    if (!text) {
      return res.status(400).json({ error: 'Text is required' })
    }

    const result = await detectVocabulary(text)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

// POST /api/vocabulary/word - Get vocabulary info for a single word
router.post('/word', async (req, res, next) => {
  try {
    const { word, type, context } = req.body

    if (!word) {
      return res.status(400).json({ error: 'Word is required' })
    }

    const result = await createVocabularyWord(word, type, context)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

// POST /api/vocabulary/stats - Get vocabulary statistics for text
router.post('/stats', async (req, res, next) => {
  try {
    const { text } = req.body

    if (!text) {
      return res.status(400).json({ error: 'Text is required' })
    }

    const result = await getVocabularyStats(text)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

// POST /api/vocabulary/validate - Check if word is valid vocabulary
router.post('/validate', async (req, res, next) => {
  try {
    const { word } = req.body

    if (!word) {
      return res.status(400).json({ error: 'Word is required' })
    }

    const isValid = isValidVocabularyWord(word)
    res.json({ word, isValid })
  } catch (error) {
    next(error)
  }
})

export default router
