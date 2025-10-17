/**
 * Reddit Service - Frontend Client
 * Handles Reddit OAuth flow and subreddit syncing
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

/**
 * Check if Reddit OAuth is configured on the backend
 * @returns {Promise<Object>} - { configured, message }
 */
export async function checkRedditStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/reddit/status`)

    if (!response.ok) {
      throw new Error('Failed to check Reddit status')
    }

    return await response.json()
  } catch (error) {
    console.error('Error checking Reddit status:', error)
    return { configured: false, message: 'Failed to check Reddit configuration' }
  }
}

/**
 * Get Reddit OAuth authorization URL
 * @returns {Promise<Object>} - { authUrl, state }
 */
export async function getRedditAuthUrl() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/reddit/auth/url`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to generate auth URL')
    }

    const data = await response.json()
    return {
      authUrl: data.authUrl,
      state: data.state
    }
  } catch (error) {
    console.error('Error getting Reddit auth URL:', error)
    throw error
  }
}

/**
 * Handle Reddit OAuth callback
 * @param {string} code - Authorization code from Reddit
 * @param {string} state - CSRF state token
 * @param {string} userId - Current user's Firebase UID
 * @returns {Promise<Object>} - { success, username }
 */
export async function handleRedditCallback(code, state, userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/reddit/auth/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code, state, userId })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to connect Reddit account')
    }

    return await response.json()
  } catch (error) {
    console.error('Error handling Reddit callback:', error)
    throw error
  }
}

/**
 * Sync user's Reddit subscriptions
 * @param {string} userId - Current user's Firebase UID
 * @returns {Promise<Object>} - { success, subreddits, count, lastSynced }
 */
export async function syncRedditSubreddits(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/reddit/sync-subreddits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to sync subreddits')
    }

    return await response.json()
  } catch (error) {
    console.error('Error syncing Reddit subreddits:', error)
    throw error
  }
}

/**
 * Disconnect Reddit account
 * @param {string} userId - Current user's Firebase UID
 * @returns {Promise<Object>} - { success, message }
 */
export async function disconnectReddit(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/reddit/disconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to disconnect Reddit account')
    }

    return await response.json()
  } catch (error) {
    console.error('Error disconnecting Reddit:', error)
    throw error
  }
}

/**
 * Start Reddit OAuth flow
 * Opens authorization window and returns when complete
 * @returns {Promise<Object>} - { success, code, state } or error
 */
export async function startRedditOAuth() {
  try {
    // Get auth URL
    const { authUrl, state } = await getRedditAuthUrl()

    // Store state in sessionStorage for verification
    sessionStorage.setItem('reddit_oauth_state', state)

    // Open Reddit authorization in current window
    window.location.href = authUrl

    // Note: User will be redirected to callback page
    // Callback page will handle the rest
  } catch (error) {
    console.error('Error starting Reddit OAuth:', error)
    throw error
  }
}

export default {
  checkRedditStatus,
  getRedditAuthUrl,
  handleRedditCallback,
  syncRedditSubreddits,
  disconnectReddit,
  startRedditOAuth
}
