import axios from 'axios'
import NodeCache from 'node-cache'
// Twitter and Instagram imports removed - Reddit only policy
// import { TwitterApi } from 'twitter-api-v2'
// import { IgApiClient } from 'instagram-private-api'
import { syllable } from 'syllable'
import { downloadPostsFromStorage } from './storageService.js'

// Cache for 15 minutes (now mainly used for search results)
const cache = new NodeCache({ stdTTL: 900 })

// API Configuration - REDDIT ONLY
// Twitter and Instagram are disabled to ensure only Reddit posts are cached
const API_CONFIG = {
  reddit: {
    name: 'Reddit',
    baseUrl: 'https://www.reddit.com',
    enabled: true
  }
  // Twitter and Instagram removed - Reddit only policy
}

// Difficulty Calculation for English Text
function calculateEnglishDifficulty(text) {
  if (!text || text.trim().length === 0) {
    return 1 // Default to easiest for empty text
  }

  // Basic text cleaning
  const cleanText = text.replace(/[^\w\s.!?]/g, ' ').trim()

  // Split into sentences (simple approach)
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const sentenceCount = sentences.length || 1

  // Split into words
  const words = cleanText.split(/\s+/).filter(w => w.length > 0)
  const wordCount = words.length

  if (wordCount === 0) {
    return 1
  }

  // Calculate metrics
  const avgSentenceLength = wordCount / sentenceCount

  // Calculate syllable count
  let totalSyllables = 0
  try {
    totalSyllables = syllable(cleanText)
  } catch (error) {
    // Fallback: estimate syllables as word count * 1.5
    totalSyllables = Math.round(wordCount * 1.5)
  }

  const avgSyllablesPerWord = totalSyllables / wordCount

  // Flesch Reading Ease Score
  // Formula: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
  const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)

  // Additional metrics
  const avgWordLength = cleanText.replace(/\s/g, '').length / wordCount

  // Calculate difficulty level (1-5) based on Flesch score
  // Flesch: 90-100 = Very Easy, 60-70 = Standard, 30-50 = Difficult, 0-30 = Very Difficult
  let difficulty
  if (fleschScore >= 80) {
    difficulty = 1 // Beginner: Very easy to read
  } else if (fleschScore >= 60) {
    difficulty = 2 // Elementary: Easy to read
  } else if (fleschScore >= 50) {
    difficulty = 3 // Intermediate: Fairly easy to read
  } else if (fleschScore >= 30) {
    difficulty = 4 // Advanced: Difficult to read
  } else {
    difficulty = 5 // Expert: Very difficult to read
  }

  // Adjust for very short texts (less than 30 words)
  if (wordCount < 30) {
    difficulty = Math.max(1, difficulty - 1)
  }

  // Adjust for very long texts (more than 300 words)
  if (wordCount > 300) {
    difficulty = Math.min(5, difficulty + 1)
  }

  return difficulty
}

// Utility functions - REDDIT ONLY
const normalizePost = (post, source) => {
  // Only accept Reddit posts
  if (source !== 'reddit') {
    console.warn(`⚠️  Attempted to normalize non-Reddit post from source: ${source}. Rejected.`)
    return null
  }

  const redditContent = post.selftext || post.title || ''
  // Use subreddit + post id for unique key
  const uniqueRedditId = `reddit_${post.subreddit}_${post.id}`
  
  return {
    id: uniqueRedditId,
    title: post.title || 'No title',
    content: post.selftext || '',
    url: post.url || `https://reddit.com${post.permalink}`,
    author: post.author || 'deleted',
    publishedAt: new Date(post.created_utc * 1000),
    source: 'reddit',
    image: post.thumbnail && post.thumbnail.startsWith('http') ? post.thumbnail : null,
    tags: ['reddit', post.subreddit],
    difficulty: calculateEnglishDifficulty(redditContent)
  }
}

// Fetch posts from Firebase Storage (pre-cached)
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

    // Download posts from Firebase Storage
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
    console.error('Firebase Storage read error:', {
      message: error.message,
      query,
      searchQuery
    })
    return { posts: [], totalCount: 0, hasMore: false }
  }
}

// TWITTER AND INSTAGRAM DISABLED - REDDIT ONLY POLICY
// These functions are kept for reference but are not used
// The codebase only supports Reddit to ensure consistent post quality and caching

/*
async function fetchTwitterPosts(query = 'japan', limit = 10, searchQuery = null, bearerToken = null) {
  // DISABLED - Reddit only
  console.warn('Twitter posts are disabled. Only Reddit is supported.')
  return []
}

async function fetchInstagramPosts(query = 'japan', limit = 10, searchQuery = null, username = null, password = null) {
  // DISABLED - Reddit only
  console.warn('Instagram posts are disabled. Only Reddit is supported.')
  return []
}
*/

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
    targetLang = 'ja',
    // API credentials from sessionStorage
    twitterBearerToken = null,
    instagramUsername = null,
    instagramPassword = null
  } = options

  const cacheKey = `news:${sources.join(',')}:${query}:${limit}:${offset}:${userLevel || 'none'}:${targetLang}:${searchQuery || 'default'}`
  const cached = cache.get(cacheKey)
  if (cached) {
    console.log('Returning cached news')
    return cached
  }

  // REDDIT ONLY - Filter out any non-Reddit sources
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

  // For other sources (Twitter, Instagram), get just the posts
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
  return result
}

export function getAvailableSources(credentials = {}) {
  // REDDIT ONLY - Ignore any credentials for other sources
  return Object.entries(API_CONFIG).map(([id, config]) => ({
    id,
    name: config.name,
    enabled: id === 'reddit', // Only Reddit is enabled
    configured: id === 'reddit', // Only Reddit is configured
    hasApiKey: id === 'reddit' // Reddit doesn't need API key
  }))
}
