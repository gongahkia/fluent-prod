import cron from 'node-cron'
import axios from 'axios'
import { uploadPostsToStorage } from '../services/storageService.js'
import { syllable } from 'syllable'
import { createMixedLanguageContent } from '../services/translationService.js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load subreddit configuration
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const subredditConfig = JSON.parse(
  readFileSync(join(__dirname, '../config/subreddits.json'), 'utf-8')
)

/**
 * Difficulty Calculation for English Text
 * (Copied from newsService.js for standalone use)
 */
function calculateEnglishDifficulty(text) {
  if (!text || text.trim().length === 0) {
    return 1
  }

  const cleanText = text.replace(/[^\w\s.!?]/g, ' ').trim()
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const sentenceCount = sentences.length || 1
  const words = cleanText.split(/\s+/).filter(w => w.length > 0)
  const wordCount = words.length

  if (wordCount === 0) {
    return 1
  }

  const avgSentenceLength = wordCount / sentenceCount

  let totalSyllables = 0
  try {
    totalSyllables = syllable(cleanText)
  } catch (error) {
    totalSyllables = Math.round(wordCount * 1.5)
  }

  const avgSyllablesPerWord = totalSyllables / wordCount
  const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)

  let difficulty
  if (fleschScore >= 80) {
    difficulty = 1
  } else if (fleschScore >= 60) {
    difficulty = 2
  } else if (fleschScore >= 50) {
    difficulty = 3
  } else if (fleschScore >= 30) {
    difficulty = 4
  } else {
    difficulty = 5
  }

  if (wordCount < 30) {
    difficulty = Math.max(1, difficulty - 1)
  }

  if (wordCount > 300) {
    difficulty = Math.min(5, difficulty + 1)
  }

  return difficulty
}

/**
 * Normalize Reddit post to standard format
 */
function normalizeRedditPost(post) {
  const redditContent = post.selftext || post.title || ''
  const uniqueRedditId = `reddit_${post.subreddit}_${post.id}`

  return {
    id: uniqueRedditId,
    title: post.title || 'No title',
    content: post.selftext || '',
    url: post.url || `https://reddit.com${post.permalink}`,
    author: post.author || 'deleted',
    publishedAt: new Date(post.created_utc * 1000),
    image: post.thumbnail && post.thumbnail.startsWith('http') ? post.thumbnail : null,
    tags: ['reddit', post.subreddit],
    source: 'reddit',
    difficulty: calculateEnglishDifficulty(redditContent)
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
 * Process a single post with mixed language content for all levels
 * @param {Object} post - The post to process
 * @param {string} targetLang - Target language code ('ja' or 'ko')
 * @returns {Promise<Object>} - Post with processed versions
 */
async function processPostWithMixedLanguage(post, targetLang) {
  const processedVersions = {}

  // Process for each learning level (1-5)
  for (let level = 1; level <= 5; level++) {
    try {
      const titleResult = post.title
        ? await createMixedLanguageContent(post.title, level, targetLang, 'en')
        : null

      const contentResult = post.content
        ? await createMixedLanguageContent(post.content, level, targetLang, 'en')
        : null

      processedVersions[level] = {
        title: titleResult,
        content: contentResult
      }

      console.log(`  ✓ Processed level ${level} for post: ${post.title.substring(0, 50)}...`)
    } catch (error) {
      console.warn(`  ⚠️  Failed to process level ${level}:`, error.message)
      processedVersions[level] = {
        title: null,
        content: null
      }
    }
  }

  return {
    ...post,
    processedVersions: {
      [targetLang]: processedVersions
    }
  }
}

/**
 * Process all posts with mixed language content
 * @param {Array} posts - Array of posts to process
 * @param {string} targetLang - Target language code ('ja' or 'ko')
 * @returns {Promise<Array>} - Array of processed posts
 */
async function processAllPostsWithMixedLanguage(posts, targetLang) {
  console.log(`\n🔄 Processing ${posts.length} posts with mixed language content for ${targetLang}...`)

  const processedPosts = []

  for (const post of posts) {
    try {
      const processedPost = await processPostWithMixedLanguage(post, targetLang)
      processedPosts.push(processedPost)
    } catch (error) {
      console.error(`❌ Failed to process post "${post.title}":`, error.message)
      // Keep original post without processed versions
      processedPosts.push(post)
    }
  }

  console.log(`✅ Completed processing ${processedPosts.length} posts`)
  return processedPosts
}

/**
 * Main job function - fetches posts for all queries and uploads to Firebase Storage
 */
export async function runPostsFetchJob() {
  console.log('🚀 Starting scheduled posts fetch job...')

  const queries = [
    { name: 'japan', fileName: 'posts-japan.json', targetLang: 'ja' },
    { name: 'korea', fileName: 'posts-korea.json', targetLang: 'ko' }
  ]

  for (const { name, fileName, targetLang } of queries) {
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
    } catch (error) {
      console.error(`❌ Error processing ${name}:`, error.message)
    }
  }

  console.log('\n✅ Posts fetch job completed!\n')
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
