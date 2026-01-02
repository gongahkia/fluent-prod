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
import { createMixedLanguageContent, containsJapanese } from './services/translationService.js'
import { stripMarkdownToPlaintext, chunkArray } from './utils/textUtils.js'
import { calculateEnglishDifficulty } from './utils/difficultyUtils.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const REPO_ROOT = join(__dirname, '..')
const CACHE_DIR = join(REPO_ROOT, 'cache')
const SUBREDDITS_CONFIG_PATH = join(REPO_ROOT, 'config', 'subreddits.json')

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
    // Default subreddits come from config/subreddits.json unless overridden.
    subreddits: []
  }
}

function loadSubredditsFromConfig(queryKey) {
  try {
    if (!existsSync(SUBREDDITS_CONFIG_PATH)) return null
    const raw = readFileSync(SUBREDDITS_CONFIG_PATH, 'utf-8')
    const cfg = JSON.parse(raw)
    const q = cfg?.queries?.[queryKey]
    const subs = Array.isArray(q?.subreddits) ? q.subreddits : null
    return subs && subs.length ? subs : null
  } catch {
    return null
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

if (TARGET_LANG !== 'ja') {
  throw new Error(`Only Japanese is supported (targetLang must be 'ja'; got ${TARGET_LANG}).`)
}

const queryKey = String(argv.query || process.env.QUERY || 'japan')

const subredditsArg = argv.subreddits || process.env.SUBREDDITS
const SUBREDDITS = subredditsArg
  ? String(subredditsArg).split(',').map((s) => s.trim()).filter(Boolean)
  : (loadSubredditsFromConfig(queryKey) || preset.subreddits)

if (!SUBREDDITS.length) {
  throw new Error(
    `No subreddits configured. Provide --subreddits a,b,c or set QUERY to a key in config/subreddits.json (got QUERY=${queryKey}).`
  )
}

const OUT_PATH = join(CACHE_DIR, OUT_FILE)

// Reddit fetching: unauthenticated requests often get 403 from CI/cloud IPs.
// If REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET are provided, use OAuth.
const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET
const REDDIT_USER_AGENT = process.env.REDDIT_USER_AGENT || 'fluent-prod-cache-bot/1.0'

let cachedRedditToken = null
let cachedRedditTokenExpiresAt = 0

async function getRedditAccessToken() {
  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) return null

  const now = Date.now()
  if (cachedRedditToken && cachedRedditTokenExpiresAt - now > 30_000) {
    return cachedRedditToken
  }

  const body = new URLSearchParams({ grant_type: 'client_credentials' })
  const { data } = await axios.post('https://www.reddit.com/api/v1/access_token', body, {
    auth: { username: REDDIT_CLIENT_ID, password: REDDIT_CLIENT_SECRET },
    headers: {
      'User-Agent': REDDIT_USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    timeout: 15_000,
  })

  const token = data?.access_token
  const expiresIn = Number(data?.expires_in) || 3600
  if (!token) return null

  cachedRedditToken = token
  cachedRedditTokenExpiresAt = now + expiresIn * 1000
  return token
}

async function fetchRedditListing(subreddit, limit) {
  const token = await getRedditAccessToken().catch(() => null)
  const url = token
    ? `https://oauth.reddit.com/r/${subreddit}/new`
    : `https://www.reddit.com/r/${subreddit}.json`

  const headers = {
    'User-Agent': REDDIT_USER_AGENT,
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9'
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const { data } = await axios.get(url, {
    params: { limit, raw_json: 1 },
    headers,
    timeout: 15_000,
  })

  return data
}

function hasTargetLanguageContent(text, targetLang) {
  if (!text) return false
  if (targetLang === 'ja') return containsJapanese(text)
  // Fallback: for unsupported target languages, don't filter.
  return true
}

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
    console.log(`  Fetching from r/${subreddit}...`)

    // Fetch more than we need, since we may filter out posts that contain
    // zero target-language content.
    const requested = Math.min(100, Math.max(limit * 5, limit * 2))
    const data = await fetchRedditListing(subreddit, requested)

    const posts = (data?.data?.children || [])
      .map((child) => child.data)
      .filter((post) => !post.stickied && (post.selftext?.length > 20 || post.title))
      .map(post => normalizeRedditPost(post))
      .filter((post) => hasTargetLanguageContent(`${post.title} ${post.content}`, TARGET_LANG))
      .slice(0, limit)

    console.log(`    Got ${posts.length} posts from r/${subreddit}`)
    return { subreddit, posts, success: true }
  } catch (error) {
    console.warn(`    Failed to fetch r/${subreddit}: ${error.message}`)
    return { subreddit, posts: [], success: false, error: error.message }
  }
}

/**
 * Process a single post with mixed language content
 */
async function processPostWithMixedLanguage(post, targetLang) {
  const assignedLevel = post.difficulty

  try {
    // Create mixed language content by translating target-language tokens -> English.
    // Learning level is intentionally ignored for cache generation.
    const titleResult = post.title
      ? await createMixedLanguageContent(post.title, assignedLevel, targetLang, 'en')
      : null

    const contentResult = post.content
      ? await createMixedLanguageContent(post.content, assignedLevel, targetLang, 'en')
      : null

    return {
      ...post,
      targetLang,
      translatedTitle: titleResult,
      translatedContent: contentResult,
      originalTitle: post.title,
      originalContent: post.content
    }
  } catch (error) {
    console.warn(`    Translation failed for post: ${error.message}`)
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
 * Process all posts with mixed language (parallel)
 */
async function processAllPosts(posts, targetLang) {
  console.log(`\nProcessing ${posts.length} posts with translations...`)
  
  const processedPosts = []
  const chunks = chunkArray(posts, CONCURRENCY_LIMIT)

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    console.log(`  Processing chunk ${i + 1}/${chunks.length} (${chunk.length} posts)...`)

    try {
      const chunkResults = await Promise.all(
        chunk.map(post => processPostWithMixedLanguage(post, targetLang))
      )
      processedPosts.push(...chunkResults)
      console.log(`    Chunk ${i + 1} completed`)
    } catch (error) {
      console.error(`    Chunk ${i + 1} failed: ${error.message}`)
      processedPosts.push(...chunk) // Add unprocessed posts
    }
  }

  console.log(`Processed ${processedPosts.length} posts`)
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
  console.log(`query: ${queryKey}`)
  console.log(`Subreddits: ${SUBREDDITS.length}`)
  console.log(`postsPerSubreddit: ${POSTS_PER_SUBREDDIT}`)
  console.log(`targetLang: ${TARGET_LANG}`)
  console.log(`out: ${OUT_PATH}`)

  const startTime = Date.now()

  console.log('\nLoading existing cache rows (if any)...')
  const existingRows = readNdjson(OUT_PATH)
  console.log(`  Found ${existingRows.length} existing rows`)

  console.log('\nFetching posts from subreddits...')
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

  console.log(`\nFetch Summary:`)
  console.log(`  Successful: ${successfulSubs}/${SUBREDDITS.length} subreddits`)
  console.log(`  Failed: ${failedSubs.length} subreddits`)
  if (failedSubs.length > 0) {
    console.log(`  Failed subreddits: ${failedSubs.map((f) => f.subreddit).join(', ')}`)
  }
  console.log(`  Total posts fetched: ${allFetched.length}`)

  if (allFetched.length === 0) {
    console.log('\nNo posts fetched. Writing cache file anyway (may be empty) so CI can commit it.')
    writeNdjson(OUT_PATH, existingRows)
    return
  }

  const limitedFetched = allFetched.slice(0, MAX_NEW_POSTS)
  console.log(`\nLimiting new posts to ${limitedFetched.length} (maxNewPosts=${MAX_NEW_POSTS})`)

  console.log('\nTranslating + generating mixed-language content...')
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

  console.log(`\nWriting cache file...`)
  writeNdjson(OUT_PATH, merged)

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  console.log(`\nDone in ${duration}s`)
  console.log(`  Existing rows: ${existingRows.length}`)
  console.log(`  New rows: ${newRows.length}`)
  console.log(`  Total rows now: ${merged.length}`)
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\nCache generation failed:', error)
    console.error(error.stack)
    process.exit(1)
  })
