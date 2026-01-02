/**
 * Reddit Scrape + Translate Cache Script
 *
 * Produces a single newline-delimited JSON (NDJSON) text file under repo `cache/`.
 * Each line is one "row" (post) and includes a stable `postHash` for referencing.
 *
 * This script is designed to be run locally or via GitHub Actions.
 *
 * Run examples:
 *   node backend/seed-showcase-posts.js
 *   node backend/seed-showcase-posts.js --preset showcase --targetLang ja --maxNewPosts 200
 *   node backend/seed-showcase-posts.js --subreddits movies,Music --postsPerSubreddit 5
 */

import axios from 'axios'
import crypto from 'crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createMixedLanguageContent, translateText, containsJapanese } from './services/translationService.js'
import { stripMarkdownToPlaintext, chunkArray } from './utils/textUtils.js'
import { calculateEnglishDifficulty } from './utils/difficultyUtils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const REPO_ROOT = join(__dirname, '..')
const CACHE_DIR = join(REPO_ROOT, 'cache')

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i++) {
    const raw = argv[i]
    if (!raw.startsWith('--')) continue
    const key = raw.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith('--')) {
      args[key] = true
    } else {
      args[key] = next
      i++
    }
  }
  return args
}

function toInt(value, fallback) {
  const n = Number.parseInt(String(value), 10)
  return Number.isFinite(n) ? n : fallback
}

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

function stablePostHash(sourceId) {
  // Stable reference hash: derived from immutable source id.
  return sha256Hex(String(sourceId))
}

function rowIntegrityHash(row) {
  const copy = { ...row }
  delete copy.rowHash
  return sha256Hex(JSON.stringify(copy))
}

function readNdjson(filePath) {
  if (!existsSync(filePath)) return []
  const raw = readFileSync(filePath, 'utf-8')
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const rows = []
  for (const line of lines) {
    try {
      rows.push(JSON.parse(line))
    } catch {
      // Ignore malformed lines
    }
  }
  return rows
}

function writeNdjson(filePath, rows) {
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true })
  const body = rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : '')
  writeFileSync(filePath, body, 'utf-8')
}

// Presets
const PRESETS = {
  showcase: {
    postsPerSubreddit: 4,
    concurrencyLimit: 5,
    targetLang: 'ja',
    outFile: 'news-cache.txt',
    subreddits: [
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
  }
}

// Config (swappable via args/env)
const argv = parseArgs(process.argv.slice(2))
const presetName = String(argv.preset || process.env.CACHE_PRESET || 'showcase')
const preset = PRESETS[presetName] || PRESETS.showcase

const POSTS_PER_SUBREDDIT = toInt(argv.postsPerSubreddit || process.env.POSTS_PER_SUBREDDIT, preset.postsPerSubreddit)
const CONCURRENCY_LIMIT = toInt(argv.concurrencyLimit || process.env.CONCURRENCY_LIMIT, preset.concurrencyLimit)
const TARGET_LANG = String(argv.targetLang || process.env.TARGET_LANG || preset.targetLang)
const OUT_FILE = String(argv.outFile || process.env.OUT_FILE || preset.outFile)
const MAX_NEW_POSTS = toInt(argv.maxNewPosts || process.env.MAX_NEW_POSTS, 200)

const subredditsArg = argv.subreddits || process.env.SUBREDDITS
const SUBREDDITS = subredditsArg
  ? String(subredditsArg).split(',').map((s) => s.trim()).filter(Boolean)
  : preset.subreddits

const OUT_PATH = join(CACHE_DIR, OUT_FILE)

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
    subreddit: post.subreddit,
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

function toRow(post) {
  const sourceId = post.id
  const postHash = stablePostHash(sourceId)
  const row = {
    schemaVersion: 1,
    postHash,
    sourceId,
    source: post.source || 'reddit',
    subreddit: post.subreddit || null,
    url: post.url,
    author: post.author,
    publishedAt: post.publishedAt instanceof Date ? post.publishedAt.toISOString() : String(post.publishedAt),
    difficulty: post.difficulty,
    targetLang: post.targetLang,
    title: post.title,
    content: post.content,
    translatedTitle: post.translatedTitle,
    translatedContent: post.translatedContent,
    createdAt: new Date().toISOString(),
  }
  row.rowHash = rowIntegrityHash(row)
  return row
}

function sortNewestFirst(a, b) {
  const ta = Date.parse(a?.publishedAt || '') || 0
  const tb = Date.parse(b?.publishedAt || '') || 0
  return tb - ta
}

async function run() {
  console.log('═'.repeat(60))
  console.log('   REDDIT SCRAPE + TRANSLATE → CACHE (NDJSON)')
  console.log('═'.repeat(60))
  console.log('')

  console.log(`Preset: ${presetName}`)
  console.log(`Subreddits: ${SUBREDDITS.length}`)
  console.log(`postsPerSubreddit: ${POSTS_PER_SUBREDDIT}`)
  console.log(`targetLang: ${TARGET_LANG}`)
  console.log(`out: ${OUT_PATH}`)

  const startTime = Date.now()

  console.log('\n📥 Loading existing cache rows (if any)...')
  const existingRows = readNdjson(OUT_PATH)
  console.log(`  ✅ Found ${existingRows.length} existing rows`)

  console.log('\n🔍 Fetching posts from subreddits...')
  const results = []
  for (let i = 0; i < SUBREDDITS.length; i++) {
    const subreddit = SUBREDDITS[i]
    const progress = `[${i + 1}/${SUBREDDITS.length}]`
    console.log(`${progress} Fetching r/${subreddit}`)

    const result = await fetchFromSubreddit(subreddit)
    results.push(result)

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const allFetched = results.flatMap((r) => r.posts)
  const successfulSubs = results.filter((r) => r.success).length
  const failedSubs = results.filter((r) => !r.success)

  console.log(`\n📊 Fetch Summary:`)
  console.log(`  ✅ Successful: ${successfulSubs}/${SUBREDDITS.length} subreddits`)
  console.log(`  ❌ Failed: ${failedSubs.length} subreddits`)
  if (failedSubs.length > 0) {
    console.log(`  Failed subreddits: ${failedSubs.map((f) => f.subreddit).join(', ')}`)
  }
  console.log(`  📄 Total posts fetched: ${allFetched.length}`)

  if (allFetched.length === 0) {
    console.log('\n❌ No posts fetched. Exiting.')
    return
  }

  const limitedFetched = allFetched.slice(0, MAX_NEW_POSTS)
  console.log(`\n✂️  Limiting new posts to ${limitedFetched.length} (maxNewPosts=${MAX_NEW_POSTS})`)

  console.log('\n🔄 Translating + generating mixed-language content...')
  const processedPosts = await processAllPosts(limitedFetched, TARGET_LANG)
  const newRows = processedPosts.map(toRow)

  // Merge + de-dupe by stable postHash
  const byHash = new Map()
  for (const row of existingRows) {
    const key = row?.postHash
    if (key) byHash.set(key, row)
  }
  for (const row of newRows) {
    byHash.set(row.postHash, row)
  }

  const merged = [...byHash.values()].sort(sortNewestFirst)

  console.log(`\n💾 Writing cache file...`)
  writeNdjson(OUT_PATH, merged)

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log(`\n✅ Done in ${duration}s`)
  console.log(`  Existing rows: ${existingRows.length}`)
  console.log(`  New rows: ${newRows.length}`)
  console.log(`  Total rows now: ${merged.length}`)
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Cache generation failed:', error)
    console.error(error.stack)
    process.exit(1)
  })
