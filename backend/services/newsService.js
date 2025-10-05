import axios from 'axios'
import NodeCache from 'node-cache'
import { TwitterApi } from 'twitter-api-v2'
import { IgApiClient } from 'instagram-private-api'

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
    tags: []
  }

  switch (source) {
    case 'reddit':
      return {
        ...basePost,
        id: post.id,
        title: post.title || 'No title',
        content: post.selftext || '',
        url: post.url || `https://reddit.com${post.permalink}`,
        author: post.author || 'deleted',
        publishedAt: new Date(post.created_utc * 1000),
        image: post.thumbnail && post.thumbnail.startsWith('http') ? post.thumbnail : null,
        tags: ['reddit', post.subreddit]
      }

    case 'twitter':
      return {
        ...basePost,
        id: post.id || 'unknown',
        title: post.text ? post.text.substring(0, 100) : 'No title',
        content: post.text || '',
        url: `https://twitter.com/i/status/${post.id}`,
        author: 'Twitter User',
        publishedAt: new Date(post.timestamp ? post.timestamp * 1000 : Date.now()),
        image: null,
        tags: ['twitter']
      }

    case 'instagram':
      return {
        ...basePost,
        id: post.id || post.pk,
        title: post.caption?.text ? post.caption.text.substring(0, 100) : 'Instagram Post',
        content: post.caption?.text || '',
        url: `https://www.instagram.com/p/${post.code}/`,
        author: post.user?.username || 'Unknown',
        publishedAt: new Date((post.taken_at || post.device_timestamp) * 1000),
        image: post.image_versions2?.candidates?.[0]?.url || post.thumbnail_url || null,
        tags: ['instagram', ...(post.caption?.hashtags || [])]
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
        subreddits = ['korea', 'korean', 'southkorea', 'seoul', 'hanguk'];
        break;
      case 'japan':
        subreddits = ['japan', 'japanese', 'japanlife', 'japantravel', 'learnjapanese'];
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
