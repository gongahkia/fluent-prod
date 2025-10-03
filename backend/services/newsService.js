import axios from 'axios'
import NodeCache from 'node-cache'

// Cache for 15 minutes
const cache = new NodeCache({ stdTTL: 900 })

// API Configuration
const API_CONFIG = {
  hackernews: {
    name: 'Hacker News',
    topStories: 'https://hacker-news.firebaseio.com/v0/topstories.json',
    item: 'https://hacker-news.firebaseio.com/v0/item/',
    enabled: false,
    rateLimitDelay: 100
  },
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
  nytimes: {
    name: 'NY Times',
    baseUrl: 'https://api.nytimes.com/svc',
    apiKey: process.env.NYTIMES_API_KEY,
    enabled: !!process.env.NYTIMES_API_KEY
  },
  reddit: {
    name: 'Reddit',
    baseUrl: 'https://www.reddit.com',
    enabled: true
  },
  mediastack: {
    name: 'Mediastack',
    baseUrl: 'http://api.mediastack.com/v1',
    apiKey: process.env.MEDIASTACK_API_KEY,
    enabled: !!process.env.MEDIASTACK_API_KEY
  },
  gnews: {
    name: 'GNews',
    baseUrl: 'https://gnews.io/api/v4',
    apiKey: process.env.GNEWS_API_KEY,
    enabled: !!process.env.GNEWS_API_KEY
  }
}

// Utility functions
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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
    case 'hackernews':
      return {
        ...basePost,
        id: post.id,
        title: post.title || 'No title',
        content: post.text || post.title || '',
        url: post.url || `https://news.ycombinator.com/item?id=${post.id}`,
        author: post.by || 'Anonymous',
        publishedAt: new Date(post.time * 1000),
        tags: ['tech', 'hackernews']
      }

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

    case 'nytimes':
      return {
        ...basePost,
        id: post.uri,
        title: post.headline?.main || 'No title',
        content: post.abstract || post.snippet || '',
        url: post.web_url || '',
        author: post.byline?.original || 'NY Times',
        publishedAt: new Date(post.pub_date),
        image: post.multimedia?.[0]?.url ? `https://www.nytimes.com/${post.multimedia[0].url}` : null,
        tags: post.keywords?.map((k) => k.value) || ['news', 'nytimes']
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

    case 'mediastack':
      return {
        ...basePost,
        id: post.url,
        title: post.title || 'No title',
        content: post.description || '',
        url: post.url || '',
        author: post.author || post.source || 'Unknown',
        publishedAt: new Date(post.published_at),
        image: post.image,
        tags: post.category ? [post.category, 'mediastack'] : ['news', 'mediastack']
      }

    case 'gnews':
      return {
        ...basePost,
        id: post.url,
        title: post.title || 'No title',
        content: post.description || post.content || '',
        url: post.url || '',
        author: post.source?.name || 'Unknown',
        publishedAt: new Date(post.publishedAt),
        image: post.image,
        tags: ['news', 'gnews']
      }

    default:
      return basePost
  }
}

// Fetch from individual sources
async function fetchHackerNewsPosts(limit = 10) {
  try {
    const { data: topStories } = await axios.get(API_CONFIG.hackernews.topStories)
    const storyIds = topStories.slice(0, limit)
    const posts = []

    for (const id of storyIds) {
      await delay(API_CONFIG.hackernews.rateLimitDelay)
      const { data: story } = await axios.get(`${API_CONFIG.hackernews.item}${id}.json`)
      if (story && story.type === 'story') {
        posts.push(normalizePost(story, 'hackernews'))
      }
    }

    return posts
  } catch (error) {
    console.error('Hacker News API error:', error.message)
    return []
  }
}

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

async function fetchNYTimesPosts(query, limit = 10) {
  if (!API_CONFIG.nytimes.apiKey) return []

  try {
    const { data } = await axios.get(`${API_CONFIG.nytimes.baseUrl}/search/v2/articlesearch.json`, {
      params: {
        q: query,
        'api-key': API_CONFIG.nytimes.apiKey,
        sort: 'newest',
        page: 0
      }
    })

    const articles = (data.response?.docs || []).slice(0, limit)
    return articles.map((article) => normalizePost(article, 'nytimes'))
  } catch (error) {
    console.error('NY Times API error:', error.message)
    return []
  }
}

async function fetchRedditPosts(query = 'japan', limit = 10) {
  try {
    const subreddits = ['japan', 'japanese', 'japanlife', 'japantravel', 'learnjapanese']
    const subreddit = subreddits[Math.floor(Math.random() * subreddits.length)]

    const { data } = await axios.get(`${API_CONFIG.reddit.baseUrl}/r/${subreddit}/hot.json`, {
      params: {
        limit: limit * 2 // Get more to filter
      },
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

async function fetchMediastackPosts(query, limit = 10) {
  if (!API_CONFIG.mediastack.apiKey) return []

  try {
    const { data } = await axios.get(`${API_CONFIG.mediastack.baseUrl}/news`, {
      params: {
        access_key: API_CONFIG.mediastack.apiKey,
        keywords: query,
        limit: limit,
        languages: 'en'
      }
    })

    return (data.data || []).map((article) => normalizePost(article, 'mediastack'))
  } catch (error) {
    console.error('Mediastack API error:', error.message)
    return []
  }
}

async function fetchGNewsPosts(query, limit = 10) {
  if (!API_CONFIG.gnews.apiKey) return []

  try {
    const { data } = await axios.get(`${API_CONFIG.gnews.baseUrl}/search`, {
      params: {
        q: query,
        token: API_CONFIG.gnews.apiKey,
        max: limit,
        lang: 'en'
      }
    })

    return (data.articles || []).map((article) => normalizePost(article, 'gnews'))
  } catch (error) {
    console.error('GNews API error:', error.message)
    return []
  }
}

// Main export function
export async function fetchNews(options = {}) {
  const {
    sources = ['reddit'],
    query = 'japan',
    limit = 10,
    shuffle = true
  } = options

  const cacheKey = `news:${sources.join(',')}:${query}:${limit}`
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
      case 'hackernews':
        return fetchHackerNewsPosts(limit)
      case 'newsapi':
        return fetchNewsApiPosts(query, limit)
      case 'guardian':
        return fetchGuardianPosts(query, limit)
      case 'nytimes':
        return fetchNYTimesPosts(query, limit)
      case 'reddit':
        return fetchRedditPosts(query, limit)
      case 'mediastack':
        return fetchMediastackPosts(query, limit)
      case 'gnews':
        return fetchGNewsPosts(query, limit)
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
      sources: enabledSources
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
    configured: config.enabled && (config.apiKey || id === 'reddit' || id === 'hackernews')
  }))
}
