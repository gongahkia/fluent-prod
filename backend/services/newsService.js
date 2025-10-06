import axios from 'axios'
import NodeCache from 'node-cache'
import { TwitterApi } from 'twitter-api-v2'
import { IgApiClient } from 'instagram-private-api'
import { syllable } from 'syllable'

// Cache for 15 minutes
const cache = new NodeCache({ stdTTL: 900 })

// API Configuration
const API_CONFIG = {
  reddit: {
    name: 'Reddit',
    baseUrl: 'https://www.reddit.com',
    enabled: true
  },
  twitter: {
    name: 'Twitter',
    enabled: false // Will be enabled when credentials provided
  },
  instagram: {
    name: 'Instagram',
    enabled: false // Will be enabled when credentials provided
  }
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

// Utility functions
const normalizePost = (post, source) => {
  const basePost = {
    id: null,
    title: '',
    content: '',
    url: '',
    author: '',
    publishedAt: new Date(),
    source: source,
    image: null,
    tags: [],
    difficulty: 3 // Default difficulty
  }

  switch (source) {
    case 'reddit':
      const redditContent = post.selftext || post.title || ''
      return {
        ...basePost,
        id: `reddit_${post.id}`,
        title: post.title || 'No title',
        content: post.selftext || '',
        url: post.url || `https://reddit.com${post.permalink}`,
        author: post.author || 'deleted',
        publishedAt: new Date(post.created_utc * 1000),
        image: post.thumbnail && post.thumbnail.startsWith('http') ? post.thumbnail : null,
        tags: ['reddit', post.subreddit],
        difficulty: calculateEnglishDifficulty(redditContent)
      }

    case 'twitter':
      const twitterContent = post.text || ''
      return {
        ...basePost,
        id: `twitter_${post.id || 'unknown'}`,
        title: post.text ? post.text.substring(0, 100) : 'No title',
        content: post.text || '',
        url: `https://twitter.com/i/status/${post.id}`,
        author: 'Twitter User',
        publishedAt: new Date(post.timestamp ? post.timestamp * 1000 : Date.now()),
        image: null,
        tags: ['twitter'],
        difficulty: calculateEnglishDifficulty(twitterContent)
      }

    case 'instagram':
      const instagramContent = post.caption?.text || ''
      return {
        ...basePost,
        id: `instagram_${post.id || post.pk}`,
        title: post.caption?.text ? post.caption.text.substring(0, 100) : 'Instagram Post',
        content: post.caption?.text || '',
        url: `https://www.instagram.com/p/${post.code}/`,
        author: post.user?.username || 'Unknown',
        publishedAt: new Date((post.taken_at || post.device_timestamp) * 1000),
        image: post.image_versions2?.candidates?.[0]?.url || post.thumbnail_url || null,
        tags: ['instagram', ...(post.caption?.hashtags || [])],
        difficulty: calculateEnglishDifficulty(instagramContent)
      }

    default:
      return basePost
  }
}

// Fetch from individual sources
async function fetchRedditPosts(query = 'japan', limit = 10, searchQuery = null) {
  try {
    // Determine subreddits based on query
    let subreddits;
    switch (query.toLowerCase()) {
      case 'korea':
        subreddits = ['korea', 'korean', 'southkorea', 'seoul', 'hanguk', 'kpop', 'koreanews', 'koreamemes'];
        break;
      case 'japan':
        subreddits = ['japan', 'japanese', 'japanlife', 'anime', 'manga', 'jpop', 'japannews', 'japanmemes'];
        break;
      default:
        // Default to japan for now
        subreddits = ['japan', 'japanese', 'japanlife', 'japantravel', 'learnjapanese'];
        break;
    }
    const subreddit = subreddits[Math.floor(Math.random() * subreddits.length)]

    let url
    const params = {
      limit: limit * 2, // Get more to filter
      'User-Agent': 'Influent/1.0'
    }

    // If search query provided, use Reddit search endpoint
    if (searchQuery && searchQuery.trim().length > 0) {
      url = `${API_CONFIG.reddit.baseUrl}/r/${subreddit}/search.json`
      params.q = searchQuery
      params.restrict_sr = 'true' // Restrict search to subreddit
      params.sort = 'relevance'
    } else {
      // No search query - show hot/trending posts
      url = `${API_CONFIG.reddit.baseUrl}/r/${subreddit}/hot.json`
    }

    const { data } = await axios.get(url, {
      params,
      headers: {
        'User-Agent': 'Influent/1.0'
      }
    })

    const posts = (data?.data?.children || [])
      .map((child) => child.data)
      .filter((post) => !post.stickied && post.selftext && post.selftext.length > 50)
      .slice(0, limit)

    return posts.map((post) => normalizePost(post, 'reddit'))
  } catch (error) {
    console.error('Reddit API error:', error.message)
    return []
  }
}

async function fetchTwitterPosts(query = 'japan', limit = 10, searchQuery = null, bearerToken = null) {
  if (!bearerToken) {
    console.log('Twitter API credentials not provided')
    return []
  }

  try {
    const searchTerm = searchQuery || query
    const client = new TwitterApi(bearerToken)

    // Search for recent tweets
    const tweets = await client.v2.search(searchTerm, {
      max_results: Math.min(limit, 100), // Twitter API v2 allows max 100
      'tweet.fields': ['created_at', 'author_id', 'public_metrics', 'entities'],
      'user.fields': ['username', 'name']
    })

    const results = []
    for (const tweet of tweets.data?.data || []) {
      results.push({
        id: tweet.id,
        text: tweet.text,
        timestamp: new Date(tweet.created_at).getTime() / 1000,
        author_id: tweet.author_id,
        entities: tweet.entities
      })
    }

    return results
      .filter((tweet) => tweet.text && tweet.text.length > 20)
      .slice(0, limit)
      .map((tweet) => normalizePost(tweet, 'twitter'))
  } catch (error) {
    console.error('Twitter API error:', error.message)
    return []
  }
}

async function fetchInstagramPosts(query = 'japan', limit = 10, searchQuery = null, username = null, password = null) {
  if (!username || !password) {
    console.log('Instagram credentials not provided')
    return []
  }

  try {
    const ig = new IgApiClient()
    ig.state.generateDevice(username)

    // Login to Instagram
    await ig.account.login(username, password)

    const searchTerm = searchQuery || query
    const posts = []

    // Search for hashtag posts
    const hashtagFeed = ig.feed.tags(searchTerm, 'recent')
    const hashtagItems = await hashtagFeed.items()

    posts.push(...hashtagItems.slice(0, limit))

    return posts
      .filter((post) => post.caption?.text && post.caption.text.length > 20)
      .map((post) => normalizePost(post, 'instagram'))
  } catch (error) {
    console.error('Instagram scraping error:', error.message)
    return []
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
    // API credentials from sessionStorage
    twitterBearerToken = null,
    instagramUsername = null,
    instagramPassword = null
  } = options

  const cacheKey = `news:${sources.join(',')}:${query}:${limit}:${searchQuery || 'default'}`
  const cached = cache.get(cacheKey)
  if (cached) {
    console.log('Returning cached news')
    return cached
  }

  // Determine which sources are available based on credentials
  const availableSources = sources.filter((source) => {
    if (source === 'reddit') return true
    if (source === 'twitter') return !!twitterBearerToken
    if (source === 'instagram') return !!(instagramUsername && instagramPassword)
    return false
  })

  if (availableSources.length === 0) {
    throw new Error('No enabled news sources found')
  }

  const fetchPromises = availableSources.map((source) => {
    switch (source) {
      case 'reddit':
        return fetchRedditPosts(query, limit, searchQuery)
      case 'twitter':
        return fetchTwitterPosts(query, limit, searchQuery, twitterBearerToken)
      case 'instagram':
        return fetchInstagramPosts(query, limit, searchQuery, instagramUsername, instagramPassword)
      default:
        return Promise.resolve([])
    }
  })

  const results = await Promise.all(fetchPromises)
  let allPosts = results.flat()

  if (shuffle) {
    allPosts = allPosts.sort(() => Math.random() - 0.5)
  }

  allPosts = allPosts.slice(0, limit)

  const result = {
    posts: allPosts,
    metadata: {
      count: allPosts.length,
      sources: availableSources,
      searchQuery: searchQuery || null
    }
  }

  cache.set(cacheKey, result)
  return result
}

export function getAvailableSources(credentials = {}) {
  const { twitterBearerToken, instagramUsername, instagramPassword } = credentials

  return Object.entries(API_CONFIG).map(([id, config]) => ({
    id,
    name: config.name,
    enabled: id === 'reddit'
      ? true
      : id === 'twitter'
        ? !!twitterBearerToken
        : id === 'instagram'
          ? !!(instagramUsername && instagramPassword)
          : false,
    configured: id === 'reddit'
      ? true
      : id === 'twitter'
        ? !!twitterBearerToken
        : id === 'instagram'
          ? !!(instagramUsername && instagramPassword)
          : false
  }))
}
