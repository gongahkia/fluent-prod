// News Service - Backend API Client
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

/**
 * Get API credentials from sessionStorage
 * @returns {Object} API credentials
 */
function getApiCredentials() {
  return {
    twitterBearerToken: sessionStorage.getItem('twitterBearerToken') || null,
    instagramUsername: sessionStorage.getItem('instagramUsername') || null,
    instagramPassword: sessionStorage.getItem('instagramPassword') || null
  }
}

/**
 * Fetch news posts from backend API
 * @param {Object} options - Fetch options
 * @param {Array<string>} options.sources - News sources to fetch from
 * @param {string} options.query - Search query
 * @param {number} options.limit - Maximum number of posts
 * @param {boolean} options.shuffle - Whether to shuffle results
 * @returns {Promise<Object>} Posts and metadata
 */
export async function fetchPosts(options = {}) {
  const {
    sources = ['reddit'],
    query = 'japan',
    limit = 10,
    shuffle = true,
    searchQuery = null
  } = options

  // Get credentials from sessionStorage
  const credentials = getApiCredentials()

  const body = {
    sources,
    query,
    limit,
    shuffle,
    search: searchQuery && searchQuery.trim().length > 0 ? searchQuery.trim() : null,
    ...credentials
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
    return data.posts || []
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
    // Get credentials from sessionStorage
    const credentials = getApiCredentials()

    const response = await fetch(`${API_BASE_URL}/api/news/sources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
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
