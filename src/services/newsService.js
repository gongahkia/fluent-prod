// News Service - Backend API Client
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

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

  const params = {
    sources: sources.join(','),
    query,
    limit: limit.toString(),
    shuffle: shuffle.toString()
  }

  // Add search parameter if provided
  if (searchQuery && searchQuery.trim().length > 0) {
    params.search = searchQuery.trim()
  }

  const queryString = new URLSearchParams(params)

  try {
    const response = await fetch(`${API_BASE_URL}/api/news?${queryString}`)

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
    const response = await fetch(`${API_BASE_URL}/api/news/sources`)

    if (!response.ok) {
      throw new Error(`Failed to check API configuration: ${response.statusText}`)
    }

    const data = await response.json()
    return data.sources || []
  } catch (error) {
    console.error('API configuration check error:', error)
    // Return default configuration if backend is unavailable
    return [
      {
        id: 'reddit',
        name: 'Reddit',
        enabled: true,
        configured: true
      }
    ]
  }
}

/**
 * Get available news sources
 * @returns {Promise<Array>} List of available sources
 */
export async function getAvailableSources() {
  return checkApiConfiguration()
}
