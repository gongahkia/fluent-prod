// News Service
// Supports two modes:
// - API mode: calls backend (/api/news)
// - Cache mode: reads prebuilt NDJSON from GitHub raw (or /public/cache)

import { loadNdjsonCache } from './cacheNdjsonService'

const NEWS_MODE = import.meta.env.VITE_NEWS_MODE || 'api' // 'api' | 'cache'

// In dev mode (VITE_USE_LOCAL_API=true), use localhost. Otherwise use production URL.
const API_BASE_URL = import.meta.env.VITE_USE_LOCAL_API === 'true'
  ? 'http://localhost:3001'
  : (import.meta.env.VITE_API_URL || 'http://localhost:3001')

// NDJSON cache URL:
// Prefer a direct GitHub Raw URL via VITE_GITHUB_CACHE_NDJSON_URL.
// Fallbacks:
// - if VITE_GITHUB_CACHE_BASE_URL is set, use `${base}/news-cache.txt`
// - else use same-origin `/cache/news-cache.txt` (served from public/cache)
const CACHE_NDJSON_URL = (() => {
  const direct = import.meta.env.VITE_GITHUB_CACHE_NDJSON_URL
  if (direct) return direct

  const base = (import.meta.env.VITE_GITHUB_CACHE_BASE_URL || '/cache').replace(/\/$/, '')
  return `${base}/news-cache.txt`
})()

function hasJapanese(text) {
  if (!text) return false
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text)
}

async function fetchPostsFromCache(options = {}) {
  const {
    limit = 10,
    shuffle = true,
    searchQuery = null,
    offset = 0,
    userLevel = null,
    targetLang = 'ja'
  } = options

  const { rows, sha256, url } = await loadNdjsonCache(CACHE_NDJSON_URL, { revalidate: offset === 0 })

  // Map rows → posts with stable ids
  let posts = (Array.isArray(rows) ? rows : []).map((row) => {
    const postHash = row?.postHash || row?.id
    const translatedTitle = row?.translatedTitle
    const translatedContent = row?.translatedContent

    // Ensure title/content are strings for the renderer.
    // The app expects JSON-as-string for mixed-language rendering.
    const toRenderable = (value, fallback) => {
      if (value == null) return fallback
      if (typeof value === 'string') return value
      try {
        return JSON.stringify(value)
      } catch {
        return fallback
      }
    }

    return {
      id: postHash,
      postHash,
      sourceId: row?.sourceId,
      title: toRenderable(translatedTitle, row?.title || ''),
      content: toRenderable(translatedContent, row?.content || ''),
      originalTitle: row?.title || '',
      originalContent: row?.content || '',
      author: row?.author || 'deleted',
      url: row?.url,
      source: row?.source || 'reddit',
      tags: ['reddit', row?.subreddit].filter(Boolean),
      subreddit: row?.subreddit || null,
      difficulty: row?.difficulty,
      targetLang: row?.targetLang || targetLang,
      publishedAt: row?.publishedAt,
      isMixedLanguage: Boolean(translatedTitle || translatedContent),
      userLevel: row?.difficulty,
    }
  })

  // Search filtering
  if (searchQuery && searchQuery.trim().length > 0) {
    const searchLower = searchQuery.toLowerCase()
    posts = posts.filter((post) => {
      const titleMatch = post.title?.toLowerCase().includes(searchLower)
      const contentMatch = post.content?.toLowerCase().includes(searchLower)
      return titleMatch || contentMatch
    })
  }

  // Prioritize Japanese content when target is Japanese (unless searching)
  if (targetLang === 'ja' && !(searchQuery && searchQuery.trim().length > 0)) {
    posts = posts.sort((a, b) => {
      const aHas = hasJapanese(a.title) || hasJapanese(a.content)
      const bHas = hasJapanese(b.title) || hasJapanese(b.content)
      if (aHas && !bHas) return -1
      if (!aHas && bHas) return 1
      return 0
    })
  }

  // Shuffle for variety (only first page, and only if not searching)
  if (shuffle && offset === 0 && !(searchQuery && searchQuery.trim().length > 0) && targetLang !== 'ja') {
    posts = posts.sort(() => Math.random() - 0.5)
  }

  const totalCount = posts.length
  const paginated = posts.slice(offset, offset + limit)

  return {
    posts: paginated,
    metadata: {
      count: paginated.length,
      sources: ['reddit'],
      searchQuery: searchQuery || null,
      totalCount,
      hasMore: offset + paginated.length < totalCount,
      offset,
      userLevel,
      targetLang,
      cacheSha256: sha256,
      cacheUrl: url
    }
  }
}

/**
 * Fetch news posts from backend API
 * @param {Object} options - Fetch options
 * @param {Array<string>} options.sources - News sources to fetch from
 * @param {string} options.query - Search query
 * @param {number} options.limit - Maximum number of posts
 * @param {boolean} options.shuffle - Whether to shuffle results
 * @param {number} options.offset - Offset for pagination (default: 0)
 * @param {number} options.userLevel - User's learning level (1-5)
 * @param {string} options.targetLang - Target language code ('ja' or 'ko')
 * @returns {Promise<Object>} Posts and metadata
 */
export async function fetchPosts(options = {}) {
  if (NEWS_MODE === 'cache') {
    return fetchPostsFromCache(options)
  }

  const {
    sources = ['reddit'],
    query = 'japan',
    limit = 10,
    shuffle = true,
    searchQuery = null,
    offset = 0,
    userLevel = null,
    targetLang = 'ja'
  } = options

  const body = {
    sources,
    query,
    limit,
    shuffle,
    search: searchQuery && searchQuery.trim().length > 0 ? searchQuery.trim() : null,
    offset,
    userLevel,
    targetLang
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/news`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      posts: data.posts || [],
      metadata: data.metadata || {}
    }
  } catch (error) {
    console.error('News fetch error:', error)
    throw error
  }
}

/**
 * Check which news sources are available and configured
 * @returns {Promise<Array>} Available news sources
 */
export async function checkApiConfiguration() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/news/sources`, {
      method: 'GET'
    })

    if (!response.ok) {
      throw new Error(`Failed to check API configuration: ${response.statusText}`)
    }

    const data = await response.json()
    return data.sources || []
  } catch (error) {
    console.error('API configuration check error:', error)
    // Don't return fallback - let the app handle the error
    throw error
  }
}

/**
 * Get available news sources
 * @returns {Promise<Array>} List of available sources
 */
export async function getAvailableSources() {
  return checkApiConfiguration()
}
