import { getFirestore } from '../config/firebase.js'

/**
 * Upload posts to Firestore
 * @param {string} cacheKey - Cache key (e.g., 'posts-japan')
 * @param {Array} posts - Array of post objects
 * @returns {Promise<boolean>} - Success status
 */
export async function uploadPostsToStorage(fileName, posts) {
  try {
    const db = getFirestore()
    // Remove .json extension for document ID
    const cacheKey = fileName.replace('.json', '')

    const docData = {
      posts,
      metadata: {
        fetchedAt: new Date().toISOString(),
        count: posts.length,
        version: '1.0',
        lastUpdated: new Date().toISOString()
      }
    }

    // Store in 'news-cache' collection
    await db.collection('news-cache').doc(cacheKey).set(docData)

    console.log(`✅ Uploaded ${posts.length} posts to Firestore (${cacheKey})`)
    return true
  } catch (error) {
    console.error(`❌ Failed to upload posts to Firestore (${fileName}):`, error.message)
    return false
  }
}

/**
 * Download posts from Firestore
 * @param {string} fileName - Name of the cache (e.g., 'posts-japan.json')
 * @returns {Promise<Array>} - Array of post objects
 */
export async function downloadPostsFromStorage(fileName) {
  try {
    const db = getFirestore()
    // Remove .json extension for document ID
    const cacheKey = fileName.replace('.json', '')

    const doc = await db.collection('news-cache').doc(cacheKey).get()

    if (!doc.exists) {
      console.warn(`⚠️  No cached posts found in Firestore (${cacheKey})`)
      return []
    }

    const data = doc.data()
    console.log(`✅ Downloaded ${data.posts?.length || 0} posts from Firestore (${cacheKey})`)

    return data.posts || []
  } catch (error) {
    console.error(`❌ Failed to download posts from Firestore (${fileName}):`, error.message)
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
    const db = getFirestore()
    const cacheKey = fileName.replace('.json', '')

    const doc = await db.collection('news-cache').doc(cacheKey).get()

    if (!doc.exists) {
      return null
    }

    const data = doc.data()

    return {
      lastUpdated: data.metadata?.lastUpdated,
      count: data.metadata?.count,
      version: data.metadata?.version
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
    const db = getFirestore()
    const snapshot = await db.collection('news-cache').get()

    const cacheKeys = snapshot.docs.map(doc => `${doc.id}.json`)
    console.log(`📋 Found ${cacheKeys.length} cached post documents:`, cacheKeys)

    return cacheKeys
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
