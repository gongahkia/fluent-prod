import axios from 'axios'
import NodeCache from 'node-cache'
import { downloadPostsFromStorage } from './storageService.js'
import { stripMarkdownToPlaintext } from '../utils/textUtils.js'
import { calculateEnglishDifficulty } from '../utils/difficultyUtils.js'
import { CacheMetrics } from '../utils/performanceMonitor.js'

// Cache for 15 minutes (now mainly used for search results)
const cache = new NodeCache({ stdTTL: 900 })

// Performance monitoring
const cacheMetrics = new CacheMetrics()

// Log cache stats every hour
setInterval(() => {
  cacheMetrics.logStats('News Cache')
}, 3600000)

// API Configuration - Reddit only
const API_CONFIG = {
  reddit: {
    name: 'Reddit',
    baseUrl: 'https://www.reddit.com',
    enabled: true
  }
}

// Note: stripMarkdownToPlaintext and calculateEnglishDifficulty are now imported from utils

// Utility functions
const normalizePost = (post, source) => {
  // Only accept Reddit posts
  if (source !== 'reddit') {
    console.warn(`⚠️  Attempted to normalize non-Reddit post from source: ${source}. Rejected.`)
    return null
  }

  // Step 1: Extract raw title and content
  const rawTitle = post.title || 'No title'
  const rawContent = post.selftext || ''

  // Step 2: Strip markdown and reduce to plaintext BEFORE difficulty calculation
  const plaintextTitle = stripMarkdownToPlaintext(rawTitle)
  const plaintextContent = stripMarkdownToPlaintext(rawContent)

  // Step 3: Combine for difficulty calculation (plaintext only)
  const combinedPlaintext = `${plaintextTitle} ${plaintextContent}`.trim()

  // Step 4: Calculate difficulty on PLAINTEXT (no markdown, no images)
  const difficulty = calculateEnglishDifficulty(combinedPlaintext)

  // Step 5: Generate unique Reddit ID
  const uniqueRedditId = `reddit_${post.subreddit}_${post.id}`

  // Step 6: Return normalized post with Reddit-only URL and NO images
  return {
    id: uniqueRedditId,
    title: plaintextTitle,
    content: plaintextContent,
    url: `https://www.reddit.com${post.permalink}`, // ALWAYS Reddit URL, never external
    author: post.author || 'deleted',
    publishedAt: new Date(post.created_utc * 1000),
    source: 'reddit',
    image: null, // ALWAYS null - no images allowed
    tags: ['reddit', post.subreddit],
    difficulty: difficulty
  }
}

// Fetch posts from Supabase (pre-cached)
async function fetchRedditPosts(query = 'japan', limit = 10, searchQuery = null, offset = 0, userLevel = null, targetLang = 'ja') {
  try {
    // Determine which cached file to use based on query
    let fileName
    switch (query.toLowerCase()) {
      case 'korea':
        fileName = 'posts-korea.json'
        break
      case 'japan':
        fileName = 'posts-japan.json'
        break
      default:
        // Default to japan
        fileName = 'posts-japan.json'
        break
    }

    console.log(`📥 Reading cached posts from ${fileName} (offset: ${offset}, limit: ${limit}, level: ${userLevel}, lang: ${targetLang})`)

    // Download posts from Supabase
    let posts = await downloadPostsFromStorage(fileName)

    if (!posts || posts.length === 0) {
      console.warn(`⚠️  No cached posts found for ${query}. Run the scheduled job to fetch posts.`)
      return { posts: [], totalCount: 0 }
    }

    const totalCount = posts.length

    // NEW: Filter posts by difficulty level (userLevel ± 1)
    if (userLevel && userLevel >= 1 && userLevel <= 5) {
      console.log(`🎯 Filtering posts for user level ${userLevel}...`)

      // Determine which levels to show
      let allowedLevels = []
      if (userLevel === 1) {
        allowedLevels = [1, 2] // Level 1: show 1 and 2
      } else if (userLevel === 5) {
        allowedLevels = [4, 5] // Level 5: show 4 and 5
      } else {
        allowedLevels = [userLevel - 1, userLevel, userLevel + 1] // Middle: show ±1
      }

      console.log(`  📋 Showing levels: ${allowedLevels.join(', ')}`)

      // Filter posts by allowed levels
      posts = posts.filter(post => allowedLevels.includes(post.difficulty))

      console.log(`  ✓ Filtered to ${posts.length} posts`)

      // Process posts with flat structure
      posts = posts.map(post => {
        const translatedTitle = post.translatedTitle
        const translatedContent = post.translatedContent

        if (translatedTitle) {
          // Stringify the translated content so frontend can parse it
          let processedTitle = post.originalTitle || post.title
          let processedContent = post.originalContent || post.content

          try {
            processedTitle = typeof translatedTitle === 'object'
              ? JSON.stringify(translatedTitle)
              : String(translatedTitle)
          } catch (e) {
            console.error('Failed to stringify title for post:', post.id, e)
            processedTitle = post.originalTitle || post.title
          }

          try {
            processedContent = translatedContent
              ? (typeof translatedContent === 'object'
                  ? JSON.stringify(translatedContent)
                  : String(translatedContent))
              : post.originalContent || post.content
          } catch (e) {
            console.error('Failed to stringify content for post:', post.id, e)
            processedContent = post.originalContent || post.content
          }

          return {
            ...post,
            title: processedTitle,
            content: processedContent,
            isMixedLanguage: true,
            userLevel: post.difficulty // Use post's actual difficulty
          }
        }

        // Fallback to original if no translation
        return post
      })
    }

    // If search query provided, filter posts by search term
    if (searchQuery && searchQuery.trim().length > 0) {
      const searchLower = searchQuery.toLowerCase()
      posts = posts.filter(post => {
        const titleMatch = post.title?.toLowerCase().includes(searchLower)
        const contentMatch = post.content?.toLowerCase().includes(searchLower)
        return titleMatch || contentMatch
      })
      console.log(`🔍 Filtered to ${posts.length} posts matching "${searchQuery}"`)
    }

    // Shuffle posts for variety (unless searching) - only on first load (offset = 0)
    if (!searchQuery && offset === 0) {
      posts = posts.sort(() => Math.random() - 0.5)
    }

    // Apply offset and limit for pagination
    const paginatedPosts = posts.slice(offset, offset + limit)

    console.log(`✅ Returning ${paginatedPosts.length} posts for ${query} (${offset}-${offset + paginatedPosts.length} of ${posts.length} total)`)

    return {
      posts: paginatedPosts,
      totalCount: posts.length,
      hasMore: (offset + paginatedPosts.length) < posts.length
    }
  } catch (error) {
    console.error('Supabase read error:', {
      message: error.message,
      query,
      searchQuery
    })
    return { posts: [], totalCount: 0, hasMore: false }
  }
}

// Main export function
export async function fetchNews(options = {}) {
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

  const cacheKey = `news:${sources.join(',')}:${query}:${limit}:${offset}:${userLevel || 'none'}:${targetLang}:${searchQuery || 'default'}`
  const cached = cache.get(cacheKey)
  if (cached) {
    cacheMetrics.recordHit()
    console.log('📊 Returning cached news')
    return cached
  }

  cacheMetrics.recordMiss()

  // Filter out any non-Reddit sources
  const availableSources = sources.filter((source) => {
    if (source === 'reddit') return true
    // Reject all other sources
    console.warn(`⚠️  Source "${source}" is not allowed. Only Reddit is supported.`)
    return false
  })

  if (availableSources.length === 0) {
    throw new Error('No enabled news sources found. Only Reddit is supported.')
  }

  // Only fetch from Reddit - no other sources allowed
  const fetchPromises = availableSources.map((source) => {
    if (source === 'reddit') {
      return fetchRedditPosts(query, limit, searchQuery, offset, userLevel, targetLang)
    }
    // Reject any other source
    return Promise.resolve({ posts: [], totalCount: 0, hasMore: false })
  })

  const results = await Promise.all(fetchPromises)

  // For Reddit (main source), use the pagination data
  const redditResult = results.find(r => r.posts !== undefined) || { posts: [], totalCount: 0, hasMore: false }

  // Get any other posts (currently none)
  const otherPosts = results
    .filter(r => Array.isArray(r))
    .flat()

  let allPosts = [...redditResult.posts, ...otherPosts]

  if (shuffle && offset === 0) {
    allPosts = allPosts.sort(() => Math.random() - 0.5)
  }

  allPosts = allPosts.slice(0, limit)

  const result = {
    posts: allPosts,
    metadata: {
      count: allPosts.length,
      sources: availableSources,
      searchQuery: searchQuery || null,
      totalCount: redditResult.totalCount,
      hasMore: redditResult.hasMore,
      offset,
      userLevel,
      targetLang
    }
  }

  cache.set(cacheKey, result)
  cacheMetrics.recordSet()
  return result
}

export function getAvailableSources() {
  return Object.entries(API_CONFIG).map(([id, config]) => ({
    id,
    name: config.name,
    enabled: id === 'reddit', // Only Reddit is enabled
    configured: id === 'reddit', // Only Reddit is configured
    hasApiKey: id === 'reddit' // Reddit doesn't need API key
  }))
}
