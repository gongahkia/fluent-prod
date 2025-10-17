import cron from 'node-cron'
import axios from 'axios'
import { uploadPostsToStorage } from '../services/storageService.js'
import { createMixedLanguageContent } from '../services/translationService.js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { stripMarkdownToPlaintext, chunkArray } from '../utils/textUtils.js'
import { calculateEnglishDifficulty } from '../utils/difficultyUtils.js'
import { startTimer, startBatchTimer, logPerformance } from '../utils/performanceMonitor.js'

// Load subreddit configuration
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const subredditConfig = JSON.parse(
  readFileSync(join(__dirname, '../../config/subreddits.json'), 'utf-8')
)

// Configuration for parallel processing
const CONCURRENCY_LIMIT = 5 // Process 5 posts in parallel

// Note: stripMarkdownToPlaintext and calculateEnglishDifficulty are now imported from utils

/**
 * Normalize Reddit post to standard format
 * IMPORTANT: Content is stripped to PLAINTEXT ONLY before difficulty calculation
 * All images are removed, URLs always point to Reddit
 */
function normalizeRedditPost(post) {
  // Step 1: Extract raw title and content
  const rawTitle = post.title || 'No title'
  const rawContent = post.selftext || ''

  // Step 2: Strip markdown and reduce to plaintext BEFORE difficulty calculation
  const plaintextTitle = stripMarkdownToPlaintext(rawTitle)
  const plaintextContent = stripMarkdownToPlaintext(rawContent)

  // Step 3: Combine for difficulty calculation (plaintext only)
  const combinedPlaintext = `${plaintextTitle} ${plaintextContent}`.trim()

  // Step 4: Calculate difficulty on PLAINTEXT (no markdown, no images)
  const difficulty = calculateEnglishDifficulty(combinedPlaintext)

  // Step 5: Generate unique Reddit ID
  const uniqueRedditId = `reddit_${post.subreddit}_${post.id}`

  // Step 6: Return normalized post with Reddit-only URL and NO images
  return {
    id: uniqueRedditId,
    title: plaintextTitle,
    content: plaintextContent,
    url: `https://www.reddit.com${post.permalink}`, // ALWAYS Reddit URL, never external
    author: post.author || 'deleted',
    publishedAt: new Date(post.created_utc * 1000),
    image: null, // ALWAYS null - no images allowed
    tags: ['reddit', post.subreddit],
    source: 'reddit',
    difficulty: difficulty
  }
}

/**
 * Fetch posts from Reddit for a specific query
 * @param {string} query - Query topic (e.g., 'japan', 'korea')
 * @param {number} limit - Number of posts to fetch
 * @returns {Promise<Array>} - Array of normalized posts
 */
async function fetchRedditPostsForQuery(query, limit = 30) {
  try {
    console.log(`🔍 Fetching ${limit} posts for query: ${query}`)

    // Get subreddits from configuration
    const queryKey = query.toLowerCase()
    const queryConfig = subredditConfig.queries[queryKey] || subredditConfig.queries.default
    const subreddits = queryConfig.subreddits
    
    console.log(`📋 Using ${subreddits.length} subreddits for ${queryKey}:`, subreddits.join(', '))

    // Fetch from multiple subreddits to get variety
    const maxSubreddits = subredditConfig.settings.maxSubredditsPerQuery || 4
    const fetchPromises = subreddits.slice(0, maxSubreddits).map(async (subreddit) => {
      try {
        const url = `https://www.reddit.com/r/${subreddit}.json`
        const { data } = await axios.get(url, {
          params: { limit: Math.ceil(limit / maxSubreddits) },
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive'
          },
          timeout: 15000
        })

        const posts = (data?.data?.children || [])
          .map((child) => child.data)
          .filter((post) => !post.stickied && (post.selftext?.length > 20 || post.title))

        return posts
      } catch (error) {
        console.warn(`⚠️  Failed to fetch from r/${subreddit}:`, error.message)
        return []
      }
    })

    const results = await Promise.all(fetchPromises)
    const allPosts = results.flat()

    // Shuffle and limit
    const shuffled = allPosts.sort(() => Math.random() - 0.5)
    const limitedPosts = shuffled.slice(0, limit)

    // Normalize posts
    const normalizedPosts = limitedPosts.map(post => normalizeRedditPost(post))

    console.log(`✅ Successfully fetched ${normalizedPosts.length} posts for ${query}`)
    return normalizedPosts
  } catch (error) {
    console.error(`❌ Failed to fetch posts for ${query}:`, error.message)
    return []
  }
}

/**
 * NEW: Process a single post ONCE at its assigned difficulty level
 * @param {Object} post - The post to process (already has difficulty assigned)
 * @param {string} targetLang - Target language code ('ja' or 'ko')
 * @returns {Promise<Object>} - Post with single translation at its difficulty
 */
async function processPostWithMixedLanguage(post, targetLang) {
  const assignedLevel = post.difficulty // Use the post's assigned difficulty

  try {
    console.log(`  🔄 Processing post at level ${assignedLevel}: ${post.title.substring(0, 50)}...`)

    const titleResult = post.title
      ? await createMixedLanguageContent(post.title, assignedLevel, targetLang, 'en')
      : null

    const contentResult = post.content
      ? await createMixedLanguageContent(post.content, assignedLevel, targetLang, 'en')
      : null

    console.log(`  ✓ Completed level ${assignedLevel} for post`)

    // NEW FLAT STRUCTURE: Store directly on post
    return {
      ...post,
      targetLang,
      translatedTitle: titleResult,
      translatedContent: contentResult,
      // Keep original text for reference
      originalTitle: post.title,
      originalContent: post.content
    }
  } catch (error) {
    console.warn(`  ⚠️  Failed to process post at level ${assignedLevel}:`, error.message)

    // Return post without translation on failure
    return {
      ...post,
      targetLang,
      translatedTitle: null,
      translatedContent: null,
      originalTitle: post.title,
      originalContent: post.content
    }
  }
}

/**
 * NEW: Balance post distribution across difficulty levels (aim for 6 per level)
 * @param {Array} posts - Array of posts with difficulty levels
 * @param {number} targetPerLevel - Target number of posts per level (default: 6)
 * @returns {Array} - Balanced array of posts
 */
function balancePostDistribution(posts, targetPerLevel = 6) {
  console.log(`\n⚖️  Balancing post distribution (target: ${targetPerLevel} per level)...`)

  // Group posts by difficulty level
  const postsByLevel = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: []
  }

  posts.forEach(post => {
    const level = post.difficulty
    if (level >= 1 && level <= 5) {
      postsByLevel[level].push(post)
    }
  })

  // Log current distribution
  console.log('📊 Current distribution:')
  for (let level = 1; level <= 5; level++) {
    console.log(`  Level ${level}: ${postsByLevel[level].length} posts`)
  }

  // Balance: Take up to targetPerLevel from each level
  const balancedPosts = []
  for (let level = 1; level <= 5; level++) {
    const levelPosts = postsByLevel[level]

    // Shuffle to get variety
    const shuffled = levelPosts.sort(() => Math.random() - 0.5)

    // Take up to targetPerLevel posts
    const selected = shuffled.slice(0, targetPerLevel)
    balancedPosts.push(...selected)

    console.log(`  ✓ Selected ${selected.length} posts for level ${level}`)
  }

  console.log(`✅ Balanced distribution: ${balancedPosts.length} total posts`)
  return balancedPosts
}

/**
 * Process all posts with mixed language content (PARALLEL VERSION)
 * @param {Array} posts - Array of posts to process
 * @param {string} targetLang - Target language code ('ja' or 'ko')
 * @returns {Promise<Array>} - Array of processed posts
 */
async function processAllPostsWithMixedLanguage(posts, targetLang) {
  console.log(`\n🔄 Processing ${posts.length} posts with mixed language content for ${targetLang}...`)

  // Start performance timer
  const timer = startBatchTimer(`Process ${targetLang} posts`, posts.length)

  // NEW: Balance distribution BEFORE processing
  const balancedPosts = balancePostDistribution(posts, 6)

  const processedPosts = []

  // OPTIMIZATION: Process posts in parallel with concurrency limit
  console.log(`⚡ Using parallel processing (concurrency: ${CONCURRENCY_LIMIT})`)
  const chunks = chunkArray(balancedPosts, CONCURRENCY_LIMIT)

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const chunkNum = i + 1
    const totalChunks = chunks.length

    console.log(`  📦 Processing chunk ${chunkNum}/${totalChunks} (${chunk.length} posts)...`)

    try {
      // Process chunk in parallel
      const chunkResults = await Promise.all(
        chunk.map(async (post) => {
          try {
            return await processPostWithMixedLanguage(post, targetLang)
          } catch (error) {
            console.error(`  ⚠️  Failed to process post "${post.title.substring(0, 50)}...":`, error.message)
            // Return original post without processed versions on failure
            return post
          }
        })
      )

      processedPosts.push(...chunkResults)
      console.log(`  ✓ Chunk ${chunkNum}/${totalChunks} completed`)
    } catch (error) {
      console.error(`  ❌ Chunk ${chunkNum}/${totalChunks} failed:`, error.message)
      // Add original posts from failed chunk
      processedPosts.push(...chunk)
    }
  }

  // Log performance
  const metrics = timer.stop()
  logPerformance(metrics, 'success')

  console.log(`✅ Completed processing ${processedPosts.length} posts`)
  return processedPosts
}

/**
 * Main job function - fetches posts for all queries and uploads to Firebase Storage
 */
export async function runPostsFetchJob() {
  console.log('🚀 Starting scheduled posts fetch job...')
  const jobTimer = startTimer('Complete job execution')

  const queries = [
    { name: 'japan', fileName: 'posts-japan.json', targetLang: 'ja' },
    { name: 'korea', fileName: 'posts-korea.json', targetLang: 'ko' }
  ]

  for (const { name, fileName, targetLang } of queries) {
    const queryTimer = startTimer(`Processing ${name}`)

    try {
      console.log(`\n📰 Fetching posts for: ${name}`)

      const posts = await fetchRedditPostsForQuery(name, 30)

      if (posts.length > 0) {
        // Process posts with mixed language content
        const processedPosts = await processAllPostsWithMixedLanguage(posts, targetLang)

        const uploadSuccess = await uploadPostsToStorage(fileName, processedPosts)

        if (uploadSuccess) {
          console.log(`✅ Successfully cached ${processedPosts.length} posts for ${name}`)
        } else {
          console.error(`❌ Failed to upload posts for ${name}`)
        }
      } else {
        console.warn(`⚠️  No posts fetched for ${name}, skipping upload`)
      }

      // Log query performance
      const queryMetrics = queryTimer.stop()
      logPerformance(queryMetrics, 'success')
    } catch (error) {
      console.error(`❌ Error processing ${name}:`, error.message)
      const queryMetrics = queryTimer.stop()
      logPerformance(queryMetrics, 'warning')
    }
  }

  // Log total job performance
  const jobMetrics = jobTimer.stop()
  console.log('\n✅ Posts fetch job completed!')
  logPerformance(jobMetrics, 'success')
  console.log('')
}

/**
 * Initialize the scheduled job
 * Runs daily at 3 AM (server time)
 */
export function initializeScheduledJob() {
  console.log('⏰ Initializing daily posts fetch job...')

  // Run every day at 3:00 AM
  // Cron format: minute hour day month weekday
  cron.schedule('0 3 * * *', async () => {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`⏰ Scheduled job triggered at ${new Date().toISOString()}`)
    console.log('='.repeat(60))

    await runPostsFetchJob()
  })

  console.log('✅ Daily job scheduled: Runs every day at 3:00 AM')
  console.log('💡 Tip: Call runPostsFetchJob() manually to fetch posts immediately\n')
}

export default { initializeScheduledJob, runPostsFetchJob }
