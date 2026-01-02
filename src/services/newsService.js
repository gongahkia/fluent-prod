// News Service
// Supports two modes:
// - API mode: calls backend (/api/news)
// - Cache mode: reads prebuilt JSON from /public/cache (or GitHub raw)

const NEWS_MODE = import.meta.env.VITE_NEWS_MODE || 'api' // 'api' | 'cache'

// In dev mode (VITE_USE_LOCAL_API=true), use localhost. Otherwise use production URL.
const API_BASE_URL = import.meta.env.VITE_USE_LOCAL_API === 'true'
  ? 'http://localhost:3001'
  : (import.meta.env.VITE_API_URL || 'http://localhost:3001')

// Cache base URL:
// - If VITE_GITHUB_CACHE_BASE_URL is set, fetch directly from GitHub raw
// - Otherwise use same-origin /cache (served from public/cache)
const CACHE_BASE_URL = (import.meta.env.VITE_GITHUB_CACHE_BASE_URL || '/cache').replace(/\/$/, '')

function getCacheFileName(query) {
  switch ((query || 'japan').toLowerCase()) {
    case 'korea':
      return 'posts-korea.json'
    case 'japan':
    default:
      return 'posts-japan.json'
  }
}

function hasJapanese(text) {
  if (!text) return false
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text)
}

async function fetchPostsFromCache(options = {}) {
  const {
    query = 'japan',
    limit = 10,
    shuffle = true,
    searchQuery = null,
    offset = 0,
    userLevel = null,
    targetLang = 'ja'
  } = options

  const fileName = getCacheFileName(query)
  const url = `${CACHE_BASE_URL}/${fileName}`

  const response = await fetch(url, { method: 'GET' })
  if (!response.ok) {
    throw new Error(`Failed to fetch cache file: ${response.status} ${response.statusText}`)
  }

  const raw = await response.json()
  let posts = Array.isArray(raw) ? raw : []

  // Filter by difficulty level (userLevel ± 1)
  if (userLevel && userLevel >= 1 && userLevel <= 5) {
    let allowedLevels = []
    if (userLevel === 1) allowedLevels = [1, 2]
    else if (userLevel === 5) allowedLevels = [4, 5]
    else allowedLevels = [userLevel - 1, userLevel, userLevel + 1]

    posts = posts.filter((p) => allowedLevels.includes(p.difficulty))

    // If translated fields exist, ensure title/content are strings
    posts = posts.map((post) => {
      const translatedTitle = post.translatedTitle
      const translatedContent = post.translatedContent

      if (translatedTitle) {
        let processedTitle = post.originalTitle || post.title
        let processedContent = post.originalContent || post.content

        try {
          processedTitle = typeof translatedTitle === 'object'
            ? JSON.stringify(translatedTitle)
            : String(translatedTitle)
        } catch {
          processedTitle = post.originalTitle || post.title
        }

        try {
          processedContent = translatedContent
            ? (typeof translatedContent === 'object'
                ? JSON.stringify(translatedContent)
                : String(translatedContent))
            : post.originalContent || post.content
        } catch {
          processedContent = post.originalContent || post.content
        }

        return {
          ...post,
          title: processedTitle,
          content: processedContent,
          isMixedLanguage: true,
          userLevel: post.difficulty
        }
      }

      return post
    })
  }

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
      cacheFile: fileName,
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
