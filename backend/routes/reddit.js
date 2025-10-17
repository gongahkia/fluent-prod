import express from 'express'
import {
  generateAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getUserIdentity,
  getUserSubscriptions,
  revokeToken,
  isRedditOAuthConfigured
} from '../services/redditOAuthService.js'
import { encryptData, decryptData } from '../services/encryptionService.js'
import { getFirestore } from '../config/firebase.js'

const router = express.Router()

// Helper to get Firestore instance safely
const getDb = () => {
  try {
    return getFirestore()
  } catch (error) {
    throw new Error('Firebase is not initialized. Please check your configuration.')
  }
}

/**
 * GET /api/reddit/auth/url
 * Generate Reddit OAuth authorization URL
 */
router.get('/auth/url', (req, res) => {
  try {
    if (!isRedditOAuthConfigured()) {
      return res.status(503).json({
        error: 'Reddit OAuth not configured',
        message: 'Please set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, and REDDIT_REDIRECT_URI in environment variables'
      })
    }

    const { url, state } = generateAuthUrl()

    res.json({
      authUrl: url,
      state: state,
      message: 'Redirect user to this URL to authorize Reddit access'
    })
  } catch (error) {
    console.error('Error generating Reddit auth URL:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/reddit/auth/callback
 * Handle OAuth callback and exchange code for tokens
 * Body: { code, state, userId }
 */
router.post('/auth/callback', async (req, res) => {
  try {
    const { code, state, userId } = req.body

    if (!code || !userId) {
      return res.status(400).json({ error: 'Missing code or userId' })
    }

    // Exchange code for tokens
    console.log('Exchanging Reddit authorization code for tokens...')
    const { accessToken, refreshToken, expiresIn, scope } = await exchangeCodeForTokens(code)

    // Calculate expiration timestamp
    const expiresAt = Date.now() + (expiresIn * 1000)

    // Get user identity
    console.log('Fetching Reddit user identity...')
    const { username, id } = await getUserIdentity(accessToken)

    // Encrypt tokens before storing
    console.log('Encrypting Reddit tokens...')
    const encryptedTokens = encryptData({
      accessToken,
      refreshToken,
      expiresAt,
      scope
    })

    // Store in Firestore under users/{userId}/credentials
    const db = getDb()
    const userRef = db.collection('users').doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Update user profile with Reddit metadata
    const updates = {
      reddit: {
        connected: true,
        username: username,
        redditId: id,
        syncedSubreddits: [], // Will be populated on first sync
        lastSynced: null
      },
      updatedAt: new Date()
    }

    // Store encrypted credentials
    const credentialsUpdate = {
      credentials: {
        ...(userDoc.data().credentials || {}),
        reddit: encryptedTokens
      }
    }

    await userRef.update({ ...updates, ...credentialsUpdate })

    console.log(`✅ Reddit OAuth completed for user ${userId} (@${username})`)

    res.json({
      success: true,
      username: username,
      message: 'Reddit account connected successfully'
    })
  } catch (error) {
    console.error('Error handling Reddit OAuth callback:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/reddit/sync-subreddits
 * Fetch and sync user's subscribed subreddits
 * Body: { userId }
 */
router.post('/sync-subreddits', async (req, res) => {
  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' })
    }

    // Get user from Firestore
    const db = getDb()
    const userRef = db.collection('users').doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' })
    }

    const userData = userDoc.data()

    // Check if Reddit is connected
    if (!userData.reddit?.connected || !userData.credentials?.reddit) {
      return res.status(400).json({ error: 'Reddit account not connected' })
    }

    // Decrypt tokens
    let tokens
    try {
      tokens = decryptData(userData.credentials.reddit)
    } catch (error) {
      console.error('Error decrypting Reddit tokens:', error)
      return res.status(500).json({ error: 'Failed to decrypt Reddit credentials' })
    }

    let accessToken = tokens.accessToken
    const refreshToken = tokens.refreshToken
    const expiresAt = tokens.expiresAt

    // Check if token is expired and refresh if needed
    if (Date.now() >= expiresAt) {
      console.log('Reddit access token expired, refreshing...')
      try {
        const refreshed = await refreshAccessToken(refreshToken)
        accessToken = refreshed.accessToken

        // Update stored tokens
        const newExpiresAt = Date.now() + (refreshed.expiresIn * 1000)
        const updatedTokens = {
          ...tokens,
          accessToken: refreshed.accessToken,
          expiresAt: newExpiresAt
        }

        await userRef.update({
          'credentials.reddit': encryptData(updatedTokens)
        })

        console.log('✅ Reddit access token refreshed successfully')
      } catch (error) {
        console.error('Error refreshing Reddit token:', error)
        return res.status(401).json({
          error: 'Failed to refresh Reddit token',
          message: 'Please reconnect your Reddit account'
        })
      }
    }

    // Fetch subscribed subreddits
    console.log('Fetching Reddit subscriptions...')
    let subreddits
    try {
      subreddits = await getUserSubscriptions(accessToken)
    } catch (error) {
      if (error.message === 'REDDIT_TOKEN_EXPIRED') {
        // Token expired during request, try refreshing once
        console.log('Token expired during request, attempting refresh...')
        try {
          const refreshed = await refreshAccessToken(refreshToken)
          accessToken = refreshed.accessToken

          // Update stored tokens
          const newExpiresAt = Date.now() + (refreshed.expiresIn * 1000)
          const updatedTokens = {
            ...tokens,
            accessToken: refreshed.accessToken,
            expiresAt: newExpiresAt
          }

          await userRef.update({
            'credentials.reddit': encryptData(updatedTokens)
          })

          // Retry fetching subscriptions
          subreddits = await getUserSubscriptions(accessToken)
        } catch (retryError) {
          console.error('Error refreshing token on retry:', retryError)
          return res.status(401).json({
            error: 'Failed to refresh Reddit token',
            message: 'Please reconnect your Reddit account'
          })
        }
      } else {
        throw error
      }
    }

    // Update user profile with synced subreddits
    await userRef.update({
      'reddit.syncedSubreddits': subreddits,
      'reddit.lastSynced': new Date()
    })

    console.log(`✅ Synced ${subreddits.length} subreddits for user ${userId}`)

    res.json({
      success: true,
      subreddits: subreddits,
      count: subreddits.length,
      lastSynced: new Date()
    })
  } catch (error) {
    console.error('Error syncing Reddit subreddits:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/reddit/disconnect
 * Disconnect Reddit account and revoke tokens
 * Body: { userId }
 */
router.post('/disconnect', async (req, res) => {
  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' })
    }

    // Get user from Firestore
    const db = getDb()
    const userRef = db.collection('users').doc(userId)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' })
    }

    const userData = userDoc.data()

    // Revoke tokens if they exist
    if (userData.credentials?.reddit) {
      try {
        const tokens = decryptData(userData.credentials.reddit)
        await revokeToken(tokens.accessToken)
      } catch (error) {
        console.warn('Failed to revoke Reddit token (non-critical):', error.message)
      }
    }

    // Remove Reddit data from user profile
    const updates = {
      reddit: {
        connected: false,
        username: null,
        redditId: null,
        syncedSubreddits: [],
        lastSynced: null
      }
    }

    // Remove encrypted credentials
    const credentials = userData.credentials || {}
    delete credentials.reddit

    await userRef.update({
      ...updates,
      credentials: credentials,
      updatedAt: new Date()
    })

    console.log(`✅ Reddit account disconnected for user ${userId}`)

    res.json({
      success: true,
      message: 'Reddit account disconnected successfully'
    })
  } catch (error) {
    console.error('Error disconnecting Reddit account:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/reddit/status
 * Check if Reddit OAuth is configured on the server
 */
router.get('/status', (req, res) => {
  res.json({
    configured: isRedditOAuthConfigured(),
    message: isRedditOAuthConfigured()
      ? 'Reddit OAuth is configured'
      : 'Reddit OAuth is not configured. Please set environment variables.'
  })
})

export default router
