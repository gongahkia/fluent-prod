// News Service - Backend API Client
// In dev mode (VITE_USE_LOCAL_API=true), use localhost. Otherwise use production URL.
const API_BASE_URL = import.meta.env.VITE_USE_LOCAL_API === 'true'
  ? 'http://localhost:3001'
  : (import.meta.env.VITE_API_URL || 'http://localhost:3001')

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
