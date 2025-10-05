import express from 'express'
import { fetchNews, getAvailableSources } from '../services/newsService.js'

const router = express.Router()

// POST /api/news - Fetch news from multiple sources with credentials
router.post('/', async (req, res, next) => {
  try {
    const {
      sources = ['reddit'],
      query = 'japan',
      limit = 10,
      shuffle = true,
      search = null,
      // API credentials from frontend
      twitterBearerToken = null,
      instagramUsername = null,
      instagramPassword = null
    } = req.body

    const result = await fetchNews({
      sources,
      query,
      limit,
      shuffle,
      searchQuery: search,
      twitterBearerToken,
      instagramUsername,
      instagramPassword
    })

    res.json(result)
  } catch (error) {
    next(error)
  }
})

// GET /api/news - Backwards compatible GET endpoint (Reddit only)
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

// POST /api/news/sources - Get available news sources with credentials
router.post('/sources', async (req, res, next) => {
  try {
    const {
      twitterBearerToken = null,
      instagramUsername = null,
      instagramPassword = null
    } = req.body

    const sources = getAvailableSources({
      twitterBearerToken,
      instagramUsername,
      instagramPassword
    })
    res.json({ sources })
  } catch (error) {
    next(error)
  }
})

// GET /api/news/sources - Get available news sources (no credentials)
router.get('/sources', async (req, res, next) => {
  try {
    const sources = getAvailableSources()
    res.json({ sources })
  } catch (error) {
    next(error)
  }
})

export default router
