import axios from 'axios'
import NodeCache from 'node-cache'
import { TwitterApi } from 'twitter-api-v2'
import { IgApiClient } from 'instagram-private-api'

// Cache for 15 minutes
const cache = new NodeCache({ stdTTL: 900 })

// API Configuration
const API_CONFIG = {
  newsapi: {
    name: 'NewsAPI.org',
    baseUrl: 'https://newsapi.org/v2',
    apiKey: process.env.NEWSAPI_KEY,
    enabled: !!process.env.NEWSAPI_KEY
  },
  guardian: {
    name: 'The Guardian',
    baseUrl: 'https://content.guardianapis.com',
    apiKey: process.env.GUARDIAN_API_KEY,
    enabled: !!process.env.GUARDIAN_API_KEY
  },
  reddit: {
    name: 'Reddit',
    baseUrl: 'https://www.reddit.com',
    enabled: true
  },
  twitter: {
    name: 'Twitter',
    bearerToken: process.env.TWITTER_BEARER_TOKEN,
    enabled: !!process.env.TWITTER_BEARER_TOKEN
  },
  instagram: {
    name: 'Instagram',
    username: process.env.INSTAGRAM_USERNAME,
    password: process.env.INSTAGRAM_PASSWORD,
    enabled: !!(process.env.INSTAGRAM_USERNAME && process.env.INSTAGRAM_PASSWORD)
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
    case 'newsapi':
      return {
        ...basePost,
        id: post.url,
        title: post.title || 'No title',
        content: post.description || post.content || '',
        url: post.url || '',
        author: post.author || post.source?.name || 'Unknown',
        publishedAt: new Date(post.publishedAt),
        image: post.urlToImage,
        tags: ['news', 'newsapi']
      }

    case 'guardian':
      return {
        ...basePost,
        id: post.id,
        title: post.webTitle || 'No title',
        content: post.fields?.bodyText || post.fields?.trailText || '',
        url: post.webUrl || '',
        author: post.fields?.byline || 'Guardian Staff',
        publishedAt: new Date(post.webPublicationDate),
        image: post.fields?.thumbnail,
        tags: post.tags?.map((t) => t.webTitle) || ['news', 'guardian']
      }

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
async function fetchNewsApiPosts(query, limit = 10) {
  if (!API_CONFIG.newsapi.apiKey) return []

  try {
    const { data } = await axios.get(`${API_CONFIG.newsapi.baseUrl}/everything`, {
      params: {
        q: query,
        apiKey: API_CONFIG.newsapi.apiKey,
        pageSize: limit,
        sortBy: 'publishedAt',
        language: 'en'
      }
    })

    return (data.articles || []).map((article) => normalizePost(article, 'newsapi'))
  } catch (error) {
    console.error('NewsAPI error:', error.message)
    return []
  }
}

async function fetchGuardianPosts(query, limit = 10) {
  if (!API_CONFIG.guardian.apiKey) return []

  try {
    const { data } = await axios.get(`${API_CONFIG.guardian.baseUrl}/search`, {
      params: {
        q: query,
        'api-key': API_CONFIG.guardian.apiKey,
        'page-size': limit,
        'show-fields': 'all'
      }
    })

    return (data.response?.results || []).map((article) => normalizePost(article, 'guardian'))
  } catch (error) {
    console.error('Guardian API error:', error.message)
    return []
  }
}

async function fetchRedditPosts(query = 'japan', limit = 10, searchQuery = null) {
  try {
    const subreddits = ['japan', 'japanese', 'japanlife', 'japantravel', 'learnjapanese']
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

async function fetchTwitterPosts(query = 'japan', limit = 10, searchQuery = null) {
  if (!API_CONFIG.twitter.bearerToken) {
    console.log('Twitter API credentials not configured')
    return []
  }

  try {
    const searchTerm = searchQuery || query
    const client = new TwitterApi(API_CONFIG.twitter.bearerToken)

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

async function fetchInstagramPosts(query = 'japan', limit = 10, searchQuery = null) {
  if (!API_CONFIG.instagram.username || !API_CONFIG.instagram.password) {
    console.log('Instagram credentials not configured')
    return []
  }

  try {
    const ig = new IgApiClient()
    ig.state.generateDevice(API_CONFIG.instagram.username)

    // Login to Instagram
    await ig.account.login(API_CONFIG.instagram.username, API_CONFIG.instagram.password)

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
    searchQuery = null
  } = options

  const cacheKey = `news:${sources.join(',')}:${query}:${limit}:${searchQuery || 'default'}`
  const cached = cache.get(cacheKey)
  if (cached) {
    console.log('Returning cached news')
    return cached
  }

  const enabledSources = sources.filter((source) => API_CONFIG[source]?.enabled)

  if (enabledSources.length === 0) {
    throw new Error('No enabled news sources found')
  }

  const fetchPromises = enabledSources.map((source) => {
    switch (source) {
      case 'newsapi':
        return fetchNewsApiPosts(query, limit)
      case 'guardian':
        return fetchGuardianPosts(query, limit)
      case 'reddit':
        return fetchRedditPosts(query, limit, searchQuery)
      case 'twitter':
        return fetchTwitterPosts(query, limit, searchQuery)
      case 'instagram':
        return fetchInstagramPosts(query, limit, searchQuery)
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
      sources: enabledSources,
      searchQuery: searchQuery || null
    }
  }

  cache.set(cacheKey, result)
  return result
}

export function getAvailableSources() {
  return Object.entries(API_CONFIG).map(([id, config]) => ({
    id,
    name: config.name,
    enabled: config.enabled,
    configured: config.enabled && (config.apiKey || id === 'reddit')
  }))
}
