// News Service (cache-only mode)
//
// News posts are read from a prebuilt NDJSON cache.
// API and hybrid fetch branches have been removed.

import { loadNdjsonCache } from "./cacheNdjsonService"

const CACHE_SOURCE_ID = "reddit-cache"

// NDJSON cache URL:
// Prefer a direct GitHub Raw URL via VITE_GITHUB_CACHE_NDJSON_URL.
// Fallbacks:
// - if VITE_GITHUB_CACHE_BASE_URL is set, use `${base}/news-cache.txt`
// - else use same-origin `/public/cache/news-cache.txt`
const CACHE_NDJSON_URL = (() => {
  const direct = import.meta.env.VITE_GITHUB_CACHE_NDJSON_URL
  if (direct) return direct

  const base = (import.meta.env.VITE_GITHUB_CACHE_BASE_URL || "/cache").replace(
    /\/$/,
    ""
  )
  return `${base}/news-cache.txt`
})()

function hasJapanese(text) {
  if (!text) return false
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text)
}

async function fetchPostsFromCache(options = {}) {
  const {
    limit = 10,
    shuffle = true,
    searchQuery = null,
    offset = 0,
    userLevel = null,
    targetLang = "ja",
  } = options

  const { rows, sha256, url } = await loadNdjsonCache(CACHE_NDJSON_URL, {
    revalidate: offset === 0,
  })

  let posts = (Array.isArray(rows) ? rows : []).map((row) => {
    const postHash = row?.postHash || row?.id

    const toRenderable = (value, fallback) => {
      if (value == null) return fallback
      if (typeof value === "string") return value
      try {
        return JSON.stringify(value)
      } catch {
        return fallback
      }
    }

    return {
      id: postHash,
      postHash,
      sourceId: row?.sourceId,
      title: toRenderable(row?.title, ""),
      content: toRenderable(row?.content, ""),
      originalTitle: toRenderable(row?.title, ""),
      originalContent: toRenderable(row?.content, ""),
      author: row?.author || "deleted",
      url: row?.url,
      source: row?.source || "reddit",
      tags: ["reddit", row?.subreddit].filter(Boolean),
      subreddit: row?.subreddit || null,
      difficulty: row?.difficulty,
      targetLang: row?.targetLang || targetLang,
      publishedAt: row?.publishedAt,
      isMixedLanguage: false,
      userLevel: row?.difficulty,
    }
  })

  if (searchQuery && searchQuery.trim().length > 0) {
    const searchLower = searchQuery.toLowerCase()
    posts = posts.filter((post) => {
      const titleMatch = post.title?.toLowerCase().includes(searchLower)
      const contentMatch = post.content?.toLowerCase().includes(searchLower)
      return titleMatch || contentMatch
    })
  }

  if (targetLang === "ja" && !(searchQuery && searchQuery.trim().length > 0)) {
    posts = posts.sort((a, b) => {
      const aHas = hasJapanese(a.title) || hasJapanese(a.content)
      const bHas = hasJapanese(b.title) || hasJapanese(b.content)
      if (aHas && !bHas) return -1
      if (!aHas && bHas) return 1
      return 0
    })
  }

  if (
    shuffle &&
    offset === 0 &&
    !(searchQuery && searchQuery.trim().length > 0) &&
    targetLang !== "ja"
  ) {
    posts = posts.sort(() => Math.random() - 0.5)
  }

  const totalCount = posts.length
  const paginated = posts.slice(offset, offset + limit)

  return {
    posts: paginated,
    metadata: {
      count: paginated.length,
      sources: [CACHE_SOURCE_ID],
      searchQuery: searchQuery || null,
      totalCount,
      hasMore: offset + paginated.length < totalCount,
      offset,
      userLevel,
      targetLang,
      cacheSha256: sha256,
      cacheUrl: url,
      mode: "cache",
    },
  }
}

/**
 * Fetch news posts from cache
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Posts and metadata
 */
export async function fetchPosts(options = {}) {
  return fetchPostsFromCache(options)
}

export function isHybridNewsMode() {
  return false
}

/**
 * Get available news sources in cache-only mode
 * @returns {Promise<Array>} Available sources
 */
export async function checkApiConfiguration() {
  return [
    {
      id: CACHE_SOURCE_ID,
      name: "Reddit Cache",
      enabled: true,
      mode: "cache",
    },
  ]
}

export async function getAvailableSources() {
  return checkApiConfiguration()
}
