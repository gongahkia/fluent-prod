import axios from 'axios'
import crypto from 'crypto'

/**
 * Reddit OAuth2 Service
 * Handles Reddit OAuth flow, token management, and subreddit syncing
 *
 * IMPORTANT: Before using this service:
 * 1. Create a Reddit app at https://www.reddit.com/prefs/apps
 * 2. Set "redirect uri" to http://localhost:5173/auth/reddit/callback (dev)
 * 3. Add environment variables to .env:
 *    - REDDIT_CLIENT_ID=<your_client_id>
 *    - REDDIT_CLIENT_SECRET=<your_client_secret>
 *    - REDDIT_REDIRECT_URI=http://localhost:5173/auth/reddit/callback
 *
 * Production: Update REDDIT_REDIRECT_URI to your production domain
 */

// Reddit OAuth endpoints
const REDDIT_AUTH_URL = 'https://www.reddit.com/api/v1/authorize'
const REDDIT_TOKEN_URL = 'https://www.reddit.com/api/v1/access_token'
const REDDIT_API_BASE = 'https://oauth.reddit.com'

// OAuth configuration
const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID || ''
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET || ''
const REDDIT_REDIRECT_URI = process.env.REDDIT_REDIRECT_URI || 'http://localhost:5173/auth/reddit/callback'

// User agent for Reddit API (required by Reddit API guidelines)
const USER_AGENT = 'Fluent Language Learning App/1.0.0 (by /u/fluent_app)'

/**
 * Generate Reddit OAuth authorization URL
 * @param {string} state - CSRF protection token (should be verified on callback)
 * @returns {Object} - { url, state }
 */
export function generateAuthUrl(state = null) {
  // Generate random state if not provided
  const csrfState = state || crypto.randomBytes(32).toString('hex')

  const params = new URLSearchParams({
    client_id: REDDIT_CLIENT_ID,
    response_type: 'code',
    state: csrfState,
    redirect_uri: REDDIT_REDIRECT_URI,
    duration: 'permanent', // Request refresh token
    scope: 'mysubreddits identity' // Request both scopes
  })

  const authUrl = `${REDDIT_AUTH_URL}?${params.toString()}`

  return {
    url: authUrl,
    state: csrfState
  }
}

/**
 * Exchange authorization code for access and refresh tokens
 * @param {string} code - Authorization code from Reddit callback
 * @returns {Promise<Object>} - { accessToken, refreshToken, expiresIn, scope }
 */
export async function exchangeCodeForTokens(code) {
  try {
    // Reddit requires Basic Auth with client_id:client_secret
    const auth = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64')

    const response = await axios.post(
      REDDIT_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDDIT_REDIRECT_URI
      }).toString(),
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT
        }
      }
    )

    const { access_token, refresh_token, expires_in, scope } = response.data

    if (!access_token || !refresh_token) {
      throw new Error('Missing tokens in Reddit OAuth response')
    }

    return {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresIn: expires_in, // Usually 3600 (1 hour)
      scope: scope
    }
  } catch (error) {
    console.error('Error exchanging Reddit code for tokens:', error.response?.data || error.message)
    throw new Error(`Failed to exchange code for tokens: ${error.response?.data?.error || error.message}`)
  }
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Stored refresh token
 * @returns {Promise<Object>} - { accessToken, expiresIn }
 */
export async function refreshAccessToken(refreshToken) {
  try {
    const auth = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64')

    const response = await axios.post(
      REDDIT_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      }).toString(),
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT
        }
      }
    )

    const { access_token, expires_in } = response.data

    if (!access_token) {
      throw new Error('Missing access token in refresh response')
    }

    return {
      accessToken: access_token,
      expiresIn: expires_in
    }
  } catch (error) {
    console.error('Error refreshing Reddit access token:', error.response?.data || error.message)
    throw new Error(`Failed to refresh token: ${error.response?.data?.error || error.message}`)
  }
}

/**
 * Get Reddit user identity (username)
 * @param {string} accessToken - Valid access token
 * @returns {Promise<Object>} - { username, id }
 */
export async function getUserIdentity(accessToken) {
  try {
    const response = await axios.get(`${REDDIT_API_BASE}/api/v1/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'User-Agent': USER_AGENT
      }
    })

    const { name, id } = response.data

    return {
      username: name,
      id: id
    }
  } catch (error) {
    console.error('Error fetching Reddit user identity:', error.response?.data || error.message)

    // Check if token expired (401)
    if (error.response?.status === 401) {
      throw new Error('REDDIT_TOKEN_EXPIRED')
    }

    throw new Error(`Failed to fetch user identity: ${error.response?.data?.error || error.message}`)
  }
}

/**
 * Get all subreddits the user is subscribed to
 * Handles pagination automatically
 * @param {string} accessToken - Valid access token
 * @returns {Promise<string[]>} - Array of subreddit names (e.g., ["japan", "tokyo"])
 */
export async function getUserSubscriptions(accessToken) {
  try {
    const subreddits = []
    let after = null
    let hasMore = true

    // Reddit paginates with "after" cursor
    while (hasMore) {
      const params = new URLSearchParams({
        limit: 100 // Max limit per request
      })

      if (after) {
        params.append('after', after)
      }

      const response = await axios.get(
        `${REDDIT_API_BASE}/subreddits/mine/subscriber?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': USER_AGENT
          }
        }
      )

      const { data } = response.data

      // Extract subreddit names
      const batch = data.children.map(child => child.data.display_name)
      subreddits.push(...batch)

      // Check for more pages
      after = data.after
      hasMore = after !== null

      console.log(`Fetched ${batch.length} subreddits (total: ${subreddits.length})`)
    }

    console.log(`✅ Successfully fetched ${subreddits.length} subscribed subreddits`)
    return subreddits
  } catch (error) {
    console.error('Error fetching Reddit subscriptions:', error.response?.data || error.message)

    // Check if token expired (401)
    if (error.response?.status === 401) {
      throw new Error('REDDIT_TOKEN_EXPIRED')
    }

    throw new Error(`Failed to fetch subscriptions: ${error.response?.data?.error || error.message}`)
  }
}

/**
 * Revoke Reddit access token (logout)
 * @param {string} accessToken - Token to revoke
 * @returns {Promise<void>}
 */
export async function revokeToken(accessToken) {
  try {
    const auth = Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64')

    await axios.post(
      'https://www.reddit.com/api/v1/revoke_token',
      new URLSearchParams({
        token: accessToken,
        token_type_hint: 'access_token'
      }).toString(),
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': USER_AGENT
        }
      }
    )

    console.log('✅ Reddit token revoked successfully')
  } catch (error) {
    console.error('Error revoking Reddit token:', error.response?.data || error.message)
    // Don't throw - revocation is best-effort
  }
}

/**
 * Check if Reddit OAuth is configured
 * @returns {boolean}
 */
export function isRedditOAuthConfigured() {
  return !!(REDDIT_CLIENT_ID && REDDIT_CLIENT_SECRET && REDDIT_REDIRECT_URI)
}

export default {
  generateAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getUserIdentity,
  getUserSubscriptions,
  revokeToken,
  isRedditOAuthConfigured
}
