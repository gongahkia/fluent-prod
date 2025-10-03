import express from 'express'
import { fetchNews, getAvailableSources } from '../services/newsService.js'

const router = express.Router()

// GET /api/news - Fetch news from multiple sources
router.get('/', async (req, res, next) => {
  try {
    const {
      sources = 'reddit',
      query = 'japan',
      limit = '10',
      shuffle = 'true',
      search = null
    } = req.query

    const sourcesArray = sources.split(',').map(s => s.trim())
    const limitNum = parseInt(limit, 10)
    const shuffleBool = shuffle === 'true'

    const result = await fetchNews({
      sources: sourcesArray,
      query,
      limit: limitNum,
      shuffle: shuffleBool,
      searchQuery: search
    })

    res.json(result)
  } catch (error) {
    next(error)
  }
})

// GET /api/news/sources - Get available news sources
router.get('/sources', async (req, res, next) => {
  try {
    const sources = getAvailableSources()
    res.json({ sources })
  } catch (error) {
    next(error)
  }
})

export default router
