/**
 * One-time Showcase Post Seeding Script
 * Fetches 3-5 posts from 47 different subreddits to populate the database
 * with a diverse selection of content for demo purposes.
 * 
 * Run with: node backend/seed-showcase-posts.js
 */

import axios from 'axios'
import { uploadPostsToStorage, downloadPostsFromStorage } from './services/storageService.js'
import { createMixedLanguageContent, translateText, containsJapanese } from './services/translationService.js'
import { stripMarkdownToPlaintext, chunkArray } from './utils/textUtils.js'
import { calculateEnglishDifficulty } from './utils/difficultyUtils.js'

// Configuration
const POSTS_PER_SUBREDDIT = 4 // Fetch 4 posts from each subreddit
const CONCURRENCY_LIMIT = 5 // Process 5 posts in parallel
const TARGET_LANG = 'ja' // Target language: Japanese
const CACHE_FILE = 'posts-japan.json' // Store in posts-japan cache

// 47 Subreddits to scrape (Japanese + General interest)
const SHOWCASE_SUBREDDITS = [
  // Japanese-focused subreddits
  'newsokur',
  'lowlevelaware',
  'JapanNews',
  'japanpics',
  'JapanArt',
  'JapanPlaces',
  'RideItJapan',
  'japanparents',
  'BakaNewsJP',
  'Anime',
  'JDorama',
  'JapaneseMusic',
  'JPop',
  'Otaku',
  'JapanLife',
  'JapanResidents',
  'MovingToJapan',
  'JapanFinance',
  'TeachingInJapan',
  'ALTinginJapan',
  'JETProgramme',
  'JapanTravel',
  'OsakaTravel',
  'KyotoTravel',
  
  // General interest subreddits
  'movies',
  'Music',
  'television',
  'anime',
  'manga',
  'NetflixBestOf',
  'mlb',
  'hockey',
  'mma',
  'formula1',
  'Boxing',
  'running',
  'cricket',
  'malefashionadvice',
  'streetwear',
  'femalefashionadvice',
  'frugalmalefashion',
  'Sneakers',
  'womensstreetwear',
  'Cooking',
  'AskCulinary',
  'FoodPorn',
  'KitchenConfidential',
  'EatCheapAndHealthy',
  'Sushi',
  'JapaneseFood'
]

/**
 * Normalize Reddit post to standard format
 */
function normalizeRedditPost(post) {
  const rawTitle = post.title || 'No title'
  const rawContent = post.selftext || ''

  const plaintextTitle = stripMarkdownToPlaintext(rawTitle)
  const plaintextContent = stripMarkdownToPlaintext(rawContent)

  const combinedPlaintext = `${plaintextTitle} ${plaintextContent}`.trim()
  const difficulty = calculateEnglishDifficulty(combinedPlaintext)

  const uniqueRedditId = `reddit_${post.subreddit}_${post.id}`

  return {
    id: uniqueRedditId,
    title: plaintextTitle,
    content: plaintextContent,
    url: `https://www.reddit.com${post.permalink}`,
    author: post.author || 'deleted',
    publishedAt: new Date(post.created_utc * 1000),
    image: null,
    tags: ['reddit', post.subreddit],
    source: 'reddit',
    difficulty: difficulty
  }
}

/**
 * Fetch posts from a single subreddit
 */
async function fetchFromSubreddit(subreddit, limit = POSTS_PER_SUBREDDIT) {
  try {
    console.log(`  🔍 Fetching from r/${subreddit}...`)
    
    const url = `https://www.reddit.com/r/${subreddit}.json`
    const { data } = await axios.get(url, {
      params: { limit: limit * 2 }, // Fetch extra in case some are filtered
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      timeout: 15000
    })

    const posts = (data?.data?.children || [])
      .map((child) => child.data)
      .filter((post) => !post.stickied && (post.selftext?.length > 20 || post.title))
      .slice(0, limit)
      .map(post => normalizeRedditPost(post))

    console.log(`    ✅ Got ${posts.length} posts from r/${subreddit}`)
    return { subreddit, posts, success: true }
  } catch (error) {
    console.warn(`    ⚠️  Failed to fetch r/${subreddit}: ${error.message}`)
    return { subreddit, posts: [], success: false, error: error.message }
  }
}

/**
 * Inject Japanese content into a post if it doesn't have any
 * Randomly translates either the longest sentence or 5-10 random words
 */
async function injectJapaneseIfNeeded(post) {
  const combinedText = `${post.title} ${post.content}`
  
  // Check if post already has Japanese content
  if (containsJapanese(combinedText)) {
    return post // Already has Japanese, no need to inject
  }

  console.log(`    🔧 Injecting Japanese into post without Japanese content...`)

  // Helper: Extract sentences from text
  const extractSentences = (text) => {
    if (!text) return []
    return text.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()).filter(s => s.length > 10) || []
  }

  // Helper: Extract words from text (alphanumeric words only)
  const extractWords = (text) => {
    if (!text) return []
    return text.match(/\b[a-zA-Z]{3,}\b/g) || []
  }

  // Randomly choose: 0 = translate sentence, 1 = translate words
  const translateType = Math.random() < 0.5 ? 'sentence' : 'words'
  
  let modifiedPost = { ...post }

  if (translateType === 'sentence') {
    // Translate the longest sentence
    const sentences = extractSentences(post.content || post.title)
    if (sentences.length > 0) {
      // Find longest sentence
      const longestSentence = sentences.reduce((a, b) => a.length > b.length ? a : b)
      
      try {
        const result = await translateText(longestSentence, 'en', 'ja')
        if (result.translation && result.translation !== longestSentence) {
          // Replace the longest sentence with its Japanese translation
          if (post.content && post.content.includes(longestSentence)) {
            modifiedPost.content = post.content.replace(longestSentence, result.translation)
            console.log(`      ✓ Replaced sentence with Japanese translation`)
          } else if (post.title && post.title.includes(longestSentence)) {
            modifiedPost.title = post.title.replace(longestSentence, result.translation)
            console.log(`      ✓ Replaced title sentence with Japanese translation`)
          }
        }
      } catch (error) {
        console.warn(`      ⚠️  Sentence translation failed: ${error.message}`)
      }
    }
  } else {
    // Translate 5-10 random words
    const words = extractWords(post.content || post.title)
    if (words.length > 0) {
      // Pick 5-10 unique random words
      const numWords = Math.min(words.length, Math.floor(Math.random() * 6) + 5) // 5-10
      const shuffled = [...new Set(words)].sort(() => Math.random() - 0.5)
      const selectedWords = shuffled.slice(0, numWords)
      
      try {
        // Translate each word
        const translations = await Promise.all(
          selectedWords.map(async word => {
            const result = await translateText(word, 'en', 'ja')
            return { original: word, translated: result.translation }
          })
        )
        
        // Replace words in content/title
        let contentModified = post.content
        let titleModified = post.title
        
        translations.forEach(({ original, translated }) => {
          if (translated && translated !== original) {
            // Use word boundary regex to replace whole words only
            const regex = new RegExp(`\\b${original}\\b`, 'gi')
            if (contentModified) {
              contentModified = contentModified.replace(regex, translated)
            }
            if (titleModified) {
              titleModified = titleModified.replace(regex, translated)
            }
          }
        })
        
        modifiedPost.content = contentModified
        modifiedPost.title = titleModified
        console.log(`      ✓ Replaced ${translations.length} words with Japanese translations`)
      } catch (error) {
        console.warn(`      ⚠️  Word translation failed: ${error.message}`)
      }
    }
  }

  return modifiedPost
}

/**
 * Process a single post with mixed language content
 */
async function processPostWithMixedLanguage(post, targetLang) {
  const assignedLevel = post.difficulty

  // STEP 1: Inject Japanese content if post doesn't have any
  const postWithJapanese = await injectJapaneseIfNeeded(post)

  try {
    // STEP 2: Create mixed language content with the post (now potentially with Japanese)
    const titleResult = postWithJapanese.title
      ? await createMixedLanguageContent(postWithJapanese.title, assignedLevel, targetLang, 'en')
      : null

    const contentResult = postWithJapanese.content
      ? await createMixedLanguageContent(postWithJapanese.content, assignedLevel, targetLang, 'en')
      : null

    return {
      ...postWithJapanese,
      targetLang,
      translatedTitle: titleResult,
      translatedContent: contentResult,
      originalTitle: post.title,
      originalContent: post.content
    }
  } catch (error) {
    console.warn(`    ⚠️  Translation failed for post: ${error.message}`)
    return {
      ...postWithJapanese,
      targetLang,
      translatedTitle: null,
      translatedContent: null,
      originalTitle: post.title,
      originalContent: post.content
    }
  }
}

/**
 * Process all posts with mixed language (parallel)
 */
async function processAllPosts(posts, targetLang) {
  console.log(`\n🔄 Processing ${posts.length} posts with translations...`)
  
  const processedPosts = []
  const chunks = chunkArray(posts, CONCURRENCY_LIMIT)

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    console.log(`  📦 Processing chunk ${i + 1}/${chunks.length} (${chunk.length} posts)...`)

    try {
      const chunkResults = await Promise.all(
        chunk.map(post => processPostWithMixedLanguage(post, targetLang))
      )
      processedPosts.push(...chunkResults)
      console.log(`    ✓ Chunk ${i + 1} completed`)
    } catch (error) {
      console.error(`    ❌ Chunk ${i + 1} failed: ${error.message}`)
      processedPosts.push(...chunk) // Add unprocessed posts
    }
  }

  console.log(`✅ Processed ${processedPosts.length} posts`)
  return processedPosts
}

/**
 * Main seeding function
 */
async function seedShowcasePosts() {
  console.log('🚀 Starting showcase post seeding...\n')
  console.log(`📋 Target: ${SHOWCASE_SUBREDDITS.length} subreddits × ${POSTS_PER_SUBREDDIT} posts = ~${SHOWCASE_SUBREDDITS.length * POSTS_PER_SUBREDDIT} posts\n`)

  const startTime = Date.now()

  // Step 1: Download existing posts
  console.log('📥 Step 1: Loading existing posts from Supabase...')
  const existingPosts = await downloadPostsFromStorage(CACHE_FILE)
  console.log(`  ✅ Found ${existingPosts.length} existing posts\n`)

  // Step 2: Fetch from all subreddits
  console.log('🔍 Step 2: Fetching posts from subreddits...')
  const results = []
  
  for (let i = 0; i < SHOWCASE_SUBREDDITS.length; i++) {
    const subreddit = SHOWCASE_SUBREDDITS[i]
    const progress = `[${i + 1}/${SHOWCASE_SUBREDDITS.length}]`
    console.log(`${progress} Fetching r/${subreddit}`)
    
    const result = await fetchFromSubreddit(subreddit)
    results.push(result)
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  // Collect all fetched posts
  const allNewPosts = results.flatMap(r => r.posts)
  const successfulSubs = results.filter(r => r.success).length
  const failedSubs = results.filter(r => !r.success)

  console.log(`\n📊 Fetch Summary:`)
  console.log(`  ✅ Successful: ${successfulSubs}/${SHOWCASE_SUBREDDITS.length} subreddits`)
  console.log(`  ❌ Failed: ${failedSubs.length} subreddits`)
  if (failedSubs.length > 0) {
    console.log(`  Failed subreddits: ${failedSubs.map(f => f.subreddit).join(', ')}`)
  }
  console.log(`  📄 Total new posts fetched: ${allNewPosts.length}`)

  if (allNewPosts.length === 0) {
    console.log('\n❌ No posts fetched. Exiting.')
    return
  }

  // Step 3: Process posts with translations
  const processedPosts = await processAllPosts(allNewPosts, TARGET_LANG)

  // Step 4: Replace all existing posts with new ones
  console.log('\n🔄 Step 3: Replacing existing posts with new posts...')
  console.log(`  ℹ️  Old posts: ${existingPosts.length}`)
  console.log(`  ✅ New posts: ${processedPosts.length}`)

  // Step 5: Upload to Supabase (replacing old data)
  console.log(`\n📤 Step 4: Uploading ${processedPosts.length} posts to Supabase (replacing existing)...`)
  const uploadSuccess = await uploadPostsToStorage(CACHE_FILE, processedPosts)

  if (uploadSuccess) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log(`\n✅ SUCCESS! Seeding completed in ${duration}s`)
    console.log(`\n📊 Final Summary:`)
    console.log(`  📄 Posts before: ${existingPosts.length}`)
    console.log(`  🔄 Posts replaced with: ${processedPosts.length}`)
    console.log(`  📄 Total posts now: ${processedPosts.length}`)
  } else {
    console.log('\n❌ Failed to upload posts to Supabase')
    process.exit(1)
  }
}

// Run the seeding
console.log('═'.repeat(60))
console.log('   SHOWCASE POST SEEDING - ONE TIME POPULATION')
console.log('═'.repeat(60))
console.log('')

seedShowcasePosts()
  .then(() => {
    console.log('\n✅ All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error)
    console.error(error.stack)
    process.exit(1)
  })
