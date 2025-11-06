import { savePostsToCache } from './prismaService.js'

/**
 * Upload posts to Supabase via Prisma
 * @param {string} fileName - Cache key (e.g., 'posts-japan.json')
 * @param {Array} posts - Array of post objects
 * @returns {Promise<boolean>} - Success status
 */
export async function uploadPostsToStorage(fileName, posts) {
  try {
    // Remove .json extension for cache key
    const cacheKey = fileName.replace('.json', '')

    const result = await savePostsToCache(cacheKey, posts)

    if (result.success) {
      console.log(`✅ Uploaded ${posts.length} posts to Supabase (${cacheKey})`)
      return true
    } else {
      console.error(`❌ Failed to upload posts to Supabase (${cacheKey}):`, result.error)
      return false
    }
  } catch (error) {
    console.error(`❌ Failed to upload posts to Supabase (${fileName}):`, error.message)
    return false
  }
}

/**
 * Download posts from Supabase via Prisma
 * @param {string} fileName - Name of the cache (e.g., 'posts-japan.json')
 * @returns {Promise<Array>} - Array of post objects
 */
export async function downloadPostsFromStorage(fileName) {
  try {
    const { getPostsFromCache } = await import('./prismaService.js')

    // Remove .json extension for cache key
    const cacheKey = fileName.replace('.json', '')

    const result = await getPostsFromCache(cacheKey)

    if (!result.success) {
      console.warn(`⚠️  Failed to get cached posts from Supabase (${cacheKey})`)
      return []
    }

    const posts = result.data || []

    console.log(`✅ Downloaded ${posts.length} posts from Supabase (${cacheKey})`)

    return posts
  } catch (error) {
    console.error(`❌ Failed to download posts from Supabase (${fileName}):`, error.message)
    return []
  }
}

/**
 * Get metadata about cached posts
 * @param {string} fileName - Name of the cache
 * @returns {Promise<object|null>} - Metadata object or null
 */
export async function getPostsMetadata(fileName) {
  try {
    const { getPostsFromCache } = await import('./prismaService.js')
    const cacheKey = fileName.replace('.json', '')

    const result = await getPostsFromCache(cacheKey)

    if (!result.success || !result.data || result.data.length === 0) {
      return null
    }

    // Get the first post to extract metadata
    const firstPost = result.data[0]

    return {
      lastUpdated: firstPost.lastUpdated || firstPost.fetchedAt,
      count: result.data.length,
      version: firstPost.version || '1.0'
    }
  } catch (error) {
    console.error(`❌ Failed to get metadata for ${fileName}:`, error.message)
    return null
  }
}

/**
 * List all cached post documents
 * @returns {Promise<Array>} - Array of cache keys
 */
export async function listCachedPosts() {
  try {
    const { prisma } = await import('./prismaService.js')

    const cacheKeys = await prisma.newsCache.findMany({
      select: { cacheKey: true },
      distinct: ['cacheKey']
    })

    const cacheKeysList = cacheKeys.map(item => `${item.cacheKey}.json`)
    console.log(`📋 Found ${cacheKeysList.length} cached post documents:`, cacheKeysList)

    return cacheKeysList
  } catch (error) {
    console.error('❌ Failed to list cached posts:', error.message)
    return []
  }
}

export default {
  uploadPostsToStorage,
  downloadPostsFromStorage,
  getPostsMetadata,
  listCachedPosts
}
