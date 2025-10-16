import express from 'express'
import { fetchNews, getAvailableSources } from '../services/newsService.js'
import { runPostsFetchJob } from '../jobs/fetchPostsJob.js'
import { listCachedPosts, getPostsMetadata } from '../services/storageService.js'

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
      offset = 0,
      userLevel = null,
      targetLang = 'ja',
      // API credentials from frontend
      instagramUsername = null,
      instagramPassword = null
    } = req.body

    const result = await fetchNews({
      sources,
      query,
      limit,
      shuffle,
      searchQuery: search,
      offset,
      userLevel,
      targetLang,
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
      instagramUsername = null,
      instagramPassword = null
    } = req.body

    const sources = getAvailableSources({
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

// POST /api/news/fetch - Manually trigger posts fetch job (for testing)
router.post('/fetch', async (req, res, next) => {
  try {
    console.log('📡 Manual fetch triggered via API')

    // Run the fetch job asynchronously
    runPostsFetchJob().catch(err => {
      console.error('❌ Manual fetch failed:', err.message)
    })

    res.json({
      message: 'Posts fetch job started. Check server logs for progress.',
      status: 'running'
    })
  } catch (error) {
    next(error)
  }
})

// GET /api/news/cache - Get information about cached posts
router.get('/cache', async (req, res, next) => {
  try {
    const cachedFiles = await listCachedPosts()

    const fileInfo = await Promise.all(
      cachedFiles.map(async (fileName) => {
        const metadata = await getPostsMetadata(fileName)
        return {
          fileName,
          ...metadata
        }
      })
    )

    res.json({
      cachedFiles: fileInfo,
      count: cachedFiles.length
    })
  } catch (error) {
    next(error)
  }
})

export default router
