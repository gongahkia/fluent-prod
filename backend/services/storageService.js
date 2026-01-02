import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Repo-root cache directory (committed to git)
const CACHE_DIR = path.resolve(__dirname, '../../cache')

async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true })
}

function sanitizeFileName(fileName) {
  // Prevent path traversal; allow only basename
  const base = path.basename(fileName)
  if (!base.endsWith('.json')) {
    throw new Error('Cache file must be a .json file')
  }
  return base
}

function getCachePath(fileName) {
  const safeName = sanitizeFileName(fileName)
  return path.join(CACHE_DIR, safeName)
}

/**
 * Upload posts to Supabase via Prisma
 * @param {string} fileName - Cache key (e.g., 'posts-japan.json')
 * @param {Array} posts - Array of post objects
 * @returns {Promise<boolean>} - Success status
 */
export async function uploadPostsToStorage(fileName, posts) {
  try {
    await ensureCacheDir()
    const targetPath = getCachePath(fileName)

    // Store as pretty JSON for easy diffing/review in git
    const payload = JSON.stringify(posts ?? [], null, 2)
    await fs.writeFile(targetPath, payload, 'utf-8')

    console.log(`✅ Wrote ${Array.isArray(posts) ? posts.length : 0} posts to cache (${path.relative(process.cwd(), targetPath)})`)
    return true
  } catch (error) {
    console.error(`❌ Failed to write posts to cache (${fileName}):`, error.message)
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
    await ensureCacheDir()
    const targetPath = getCachePath(fileName)

    const raw = await fs.readFile(targetPath, 'utf-8').catch((err) => {
      if (err && err.code === 'ENOENT') return null
      throw err
    })

    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    const posts = Array.isArray(parsed) ? parsed : []
    console.log(`✅ Read ${posts.length} posts from cache (${path.relative(process.cwd(), targetPath)})`)
    return posts
  } catch (error) {
    console.error(`❌ Failed to read posts from cache (${fileName}):`, error.message)
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
    await ensureCacheDir()
    const targetPath = getCachePath(fileName)

    const [raw, stat] = await Promise.all([
      fs.readFile(targetPath, 'utf-8').catch((err) => {
        if (err && err.code === 'ENOENT') return null
        throw err
      }),
      fs.stat(targetPath).catch((err) => {
        if (err && err.code === 'ENOENT') return null
        throw err
      })
    ])

    if (!raw || !stat) return null

    const parsed = JSON.parse(raw)
    const posts = Array.isArray(parsed) ? parsed : []
    if (posts.length === 0) return null

    const firstPost = posts[0]
    return {
      lastUpdated: firstPost.lastUpdated || firstPost.fetchedAt || stat.mtime.toISOString(),
      count: posts.length,
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
    await ensureCacheDir()
    const entries = await fs.readdir(CACHE_DIR, { withFileTypes: true })
    const jsonFiles = entries
      .filter((e) => e.isFile() && e.name.endsWith('.json'))
      .map((e) => e.name)
      .sort()

    console.log(`📋 Found ${jsonFiles.length} cached post files in cache/:`, jsonFiles)
    return jsonFiles
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
