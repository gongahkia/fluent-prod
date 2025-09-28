// API Configuration
const API_CONFIG = {
  hackernews: {
    name: 'Hacker News',
    topStories: 'https://hacker-news.firebaseio.com/v0/topstories.json',
    item: 'https://hacker-news.firebaseio.com/v0/item/',
    enabled: true,
    rateLimitDelay: 100
  },
  newsapi: {
    name: 'NewsAPI.org',
    baseUrl: 'https://newsapi.org/v2',
    // API key should be set via environment variable or config
    apiKey: process.env.REACT_APP_NEWSAPI_KEY || '',
    enabled: false // Enable when API key is available
  },
  guardian: {
    name: 'The Guardian',
    baseUrl: 'https://content.guardianapis.com',
    // API key should be set via environment variable or config
    apiKey: process.env.REACT_APP_GUARDIAN_API_KEY || '',
    enabled: false // Enable when API key is available
  },
  nytimes: {
    name: 'NY Times',
    baseUrl: 'https://api.nytimes.com/svc',
    // API key should be set via environment variable or config
    apiKey: process.env.REACT_APP_NYTIMES_API_KEY || '',
    enabled: false // Enable when API key is available
  },
  reddit: {
    name: 'Reddit',
    baseUrl: 'https://www.reddit.com',
    enabled: true // No API key needed for public posts
  },
  mediastack: {
    name: 'Mediastack',
    baseUrl: 'http://api.mediastack.com/v1',
    // API key should be set via environment variable or config
    apiKey: process.env.REACT_APP_MEDIASTACK_API_KEY || '',
    enabled: false // Enable when API key is available
  },
  gnews: {
    name: 'GNews',
    baseUrl: 'https://gnews.io/api/v4',
    // API key should be set via environment variable or config
    apiKey: process.env.REACT_APP_GNEWS_API_KEY || '',
    enabled: false // Enable when API key is available
  }
};

// Utility function to add delay for rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Utility function to normalize post data from different APIs
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
  };

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
      };

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
      };

    case 'guardian':
      return {
        ...basePost,
        id: post.id,
        title: post.webTitle || 'No title',
        content: post.fields?.trailText || post.webTitle || '',
        url: post.webUrl || '',
        author: post.fields?.byline || 'Guardian Staff',
        publishedAt: new Date(post.webPublicationDate),
        image: post.fields?.thumbnail,
        tags: ['news', 'guardian', ...(post.tags?.map(tag => tag.webTitle) || [])]
      };

    case 'nytimes':
      return {
        ...basePost,
        id: post.uri || post.url,
        title: post.title || post.headline?.main || 'No title',
        content: post.abstract || post.snippet || post.lead_paragraph || '',
        url: post.url || post.web_url || '',
        author: post.byline?.original || post.source || 'NY Times',
        publishedAt: new Date(post.published_date || post.pub_date),
        image: post.multimedia?.[0]?.url ? `https://www.nytimes.com/${post.multimedia[0].url}` : null,
        tags: ['news', 'nytimes', ...(post.keywords?.map(k => k.value) || [])]
      };

    case 'reddit':
      return {
        ...basePost,
        id: post.id,
        title: post.title || 'No title',
        content: post.selftext || post.title || '',
        url: post.url || `https://reddit.com${post.permalink}`,
        author: post.author || 'Anonymous',
        publishedAt: new Date(post.created_utc * 1000),
        image: post.preview?.images?.[0]?.source?.url?.replace(/&amp;/g, '&'),
        tags: ['reddit', post.subreddit || 'unknown']
      };

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
        tags: ['news', 'mediastack', ...(post.categories || [])]
      };

    case 'gnews':
      return {
        ...basePost,
        id: post.url,
        title: post.title || 'No title',
        content: post.description || '',
        url: post.url || '',
        author: post.source?.name || 'Unknown',
        publishedAt: new Date(post.publishedAt),
        image: post.image,
        tags: ['news', 'gnews']
      };

    default:
      return basePost;
  }
};

// Hacker News API functions
export async function fetchHackerNewsPosts(limit = 10) {
  const config = API_CONFIG.hackernews;
  if (!config.enabled) return [];

  try {
    const response = await fetch(config.topStories);
    const storyIds = await response.json();
    const topIds = storyIds.slice(0, limit);

    const posts = [];
    for (const id of topIds) {
      try {
        await delay(config.rateLimitDelay);
        const res = await fetch(`${config.item}${id}.json`);
        const post = await res.json();
        if (post && post.title) {
          posts.push(normalizePost(post, 'hackernews'));
        }
      } catch (error) {
        console.warn(`Failed to fetch HN story ${id}:`, error);
      }
    }

    return posts;
  } catch (error) {
    console.error('Error fetching Hacker News posts:', error);
    return [];
  }
}

// NewsAPI.org functions
export async function fetchNewsApiPosts(query = 'technology', limit = 10) {
  const config = API_CONFIG.newsapi;
  if (!config.enabled || !config.apiKey) return [];

  try {
    const url = `${config.baseUrl}/everything?q=${encodeURIComponent(query)}&pageSize=${limit}&apiKey=${config.apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'ok' && data.articles) {
      return data.articles.map(post => normalizePost(post, 'newsapi'));
    }
    return [];
  } catch (error) {
    console.error('Error fetching NewsAPI posts:', error);
    return [];
  }
}

// The Guardian API functions
export async function fetchGuardianPosts(query = 'technology', limit = 10) {
  const config = API_CONFIG.guardian;
  if (!config.enabled || !config.apiKey) return [];

  try {
    const url = `${config.baseUrl}/search?q=${encodeURIComponent(query)}&page-size=${limit}&show-fields=trailText,thumbnail,byline&api-key=${config.apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.response && data.response.results) {
      return data.response.results.map(post => normalizePost(post, 'guardian'));
    }
    return [];
  } catch (error) {
    console.error('Error fetching Guardian posts:', error);
    return [];
  }
}

// NY Times API functions
export async function fetchNYTimesPosts(section = 'technology', limit = 10) {
  const config = API_CONFIG.nytimes;
  if (!config.enabled || !config.apiKey) return [];

  try {
    const url = `${config.baseUrl}/topstories/v2/${section}.json?api-key=${config.apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results) {
      return data.results.slice(0, limit).map(post => normalizePost(post, 'nytimes'));
    }
    return [];
  } catch (error) {
    console.error('Error fetching NY Times posts:', error);
    return [];
  }
}

// Reddit API functions
export async function fetchRedditPosts(subreddit = 'technology', limit = 10) {
  const config = API_CONFIG.reddit;
  if (!config.enabled) return [];

  try {
    const url = `${config.baseUrl}/r/${subreddit}/hot.json?limit=${limit}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.data && data.data.children) {
      return data.data.children.map(item => normalizePost(item.data, 'reddit'));
    }
    return [];
  } catch (error) {
    console.error('Error fetching Reddit posts:', error);
    return [];
  }
}

// Mediastack API functions
export async function fetchMediastackPosts(query = 'technology', limit = 10) {
  const config = API_CONFIG.mediastack;
  if (!config.enabled || !config.apiKey) return [];

  try {
    const url = `${config.baseUrl}/news?access_key=${config.apiKey}&keywords=${encodeURIComponent(query)}&limit=${limit}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.data) {
      return data.data.map(post => normalizePost(post, 'mediastack'));
    }
    return [];
  } catch (error) {
    console.error('Error fetching Mediastack posts:', error);
    return [];
  }
}

// GNews API functions
export async function fetchGNewsPosts(query = 'technology', limit = 10) {
  const config = API_CONFIG.gnews;
  if (!config.enabled || !config.apiKey) return [];

  try {
    const url = `${config.baseUrl}/search?q=${encodeURIComponent(query)}&max=${limit}&apikey=${config.apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.articles) {
      return data.articles.map(post => normalizePost(post, 'gnews'));
    }
    return [];
  } catch (error) {
    console.error('Error fetching GNews posts:', error);
    return [];
  }
}

// Main function that aggregates posts from all available sources
export async function fetchPosts(options = {}) {
  const {
    sources = ['hackernews'], // Default to just Hacker News for now
    query = 'technology',
    limit = 10,
    shuffle = true
  } = options;

  const allPosts = [];
  const postsPerSource = Math.ceil(limit / sources.length);

  // Fetch from each enabled source
  const fetchPromises = sources.map(async (source) => {
    try {
      switch (source) {
        case 'hackernews':
          return await fetchHackerNewsPosts(postsPerSource);
        case 'newsapi':
          return await fetchNewsApiPosts(query, postsPerSource);
        case 'guardian':
          return await fetchGuardianPosts(query, postsPerSource);
        case 'nytimes':
          return await fetchNYTimesPosts(query, postsPerSource);
        case 'reddit':
          return await fetchRedditPosts(query, postsPerSource);
        case 'mediastack':
          return await fetchMediastackPosts(query, postsPerSource);
        case 'gnews':
          return await fetchGNewsPosts(query, postsPerSource);
        default:
          return [];
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${source}:`, error);
      return [];
    }
  });

  const results = await Promise.allSettled(fetchPromises);

  // Combine all successful results
  results.forEach((result) => {
    if (result.status === 'fulfilled' && Array.isArray(result.value)) {
      allPosts.push(...result.value);
    }
  });

  // Remove duplicates based on URL
  const uniquePosts = allPosts.filter((post, index, self) =>
    index === self.findIndex(p => p.url === post.url)
  );

  // Sort by publish date (newest first)
  uniquePosts.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  // Shuffle if requested
  if (shuffle) {
    for (let i = uniquePosts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [uniquePosts[i], uniquePosts[j]] = [uniquePosts[j], uniquePosts[i]];
    }
  }

  return uniquePosts.slice(0, limit);
}

// Helper function to get available sources
export function getAvailableSources() {
  return Object.entries(API_CONFIG)
    .filter(([key, config]) => config.enabled)
    .map(([key, config]) => ({
      id: key,
      name: config.name,
      enabled: config.enabled
    }));
}

// Helper function to check API configuration
export function checkApiConfiguration() {
  const status = {};
  Object.entries(API_CONFIG).forEach(([key, config]) => {
    status[key] = {
      name: config.name,
      enabled: config.enabled,
      hasApiKey: !!config.apiKey || key === 'hackernews' || key === 'reddit'
    };
  });
  return status;
}
