import express from 'express'
import {
  translateText,
  translateBatch,
  createMixedLanguageContent
} from '../services/translationService.js'

const router = express.Router()

// POST /api/translate - Translate text
router.post('/', async (req, res, next) => {
  try {
    const { text, fromLang = 'en', toLang = 'ja' } = req.body

    if (!text) {
      return res.status(400).json({ error: 'Text is required' })
    }

    const result = await translateText(text, fromLang, toLang)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

// POST /api/translate/batch - Translate multiple texts
router.post('/batch', async (req, res, next) => {
  try {
    const { texts, fromLang = 'en', toLang = 'ja' } = req.body

    if (!texts || !Array.isArray(texts)) {
      return res.status(400).json({ error: 'Texts array is required' })
    }

    const result = await translateBatch(texts, fromLang, toLang)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

// POST /api/translate/mixed-content - Create mixed language content
router.post('/mixed-content', async (req, res, next) => {
  try {
    const { text, userLevel = 5, targetLang = 'ja', sourceLang = 'en' } = req.body

    if (!text) {
      return res.status(400).json({ error: 'Text is required' })
    }

    const result = await createMixedLanguageContent(text, userLevel, targetLang, sourceLang)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

export default router
