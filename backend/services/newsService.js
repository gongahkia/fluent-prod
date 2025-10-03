import axios from 'axios'
import NodeCache from 'node-cache'

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
      'User-Agent': 'LivePeek/1.0'
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
        'User-Agent': 'LivePeek/1.0'
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
