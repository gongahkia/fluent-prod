/**
 * Prune NDJSON cache to a maximum row count, preferring to keep any rows
 * referenced by Firebase users' saved posts.
 *
 * Inputs:
 *  - CACHE_PATH (default: ../cache/news-cache.txt)
 *  - MAX_ROWS (default: 500)
 *  - FIREBASE_SERVICE_ACCOUNT_JSON (optional; if present, used to load referenced hashes)
 *
 * Expected cache format: NDJSON, one JSON per line, each containing `postHash` and `publishedAt`.
 */

import crypto from 'crypto'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

function readJson(filePath) {
  if (!existsSync(filePath)) return null
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}

function getAllowedSubreddits(configJson) {
  const subs = configJson?.queries?.japan?.subreddits
  if (!Array.isArray(subs)) return new Set()
  return new Set(subs.map((s) => String(s).trim()).filter(Boolean))
}

function sha256Hex(input) {
  return crypto.createHash('sha256').update(input).digest('hex')
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
      // ignore malformed
    }
  }
  return rows
}

function writeNdjson(filePath, rows) {
  const body = rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : '')
  writeFileSync(filePath, body, 'utf-8')
}

function sortNewestFirst(a, b) {
  const ta = Date.parse(a?.publishedAt || '') || 0
  const tb = Date.parse(b?.publishedAt || '') || 0
  return tb - ta
}

async function loadReferencedPostHashes() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!raw) return new Set()

  const admin = await import('firebase-admin')

  // Allow either JSON string or base64-encoded JSON.
  let serviceAccount
  try {
    serviceAccount = JSON.parse(raw)
  } catch {
    serviceAccount = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'))
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
  }

  const db = admin.firestore()

  // Collection group query: users/{uid}/savedPosts/{postId}
  const snap = await db.collectionGroup('savedPosts').get()

  const hashes = new Set()
  snap.forEach((doc) => {
    const data = doc.data() || {}
    const h = data.postHash || data.postId || data.id || doc.id
    if (h) hashes.add(String(h))
  })

  return hashes
}

async function run() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)

  const subredditsConfigPath = join(__dirname, '../config/subreddits.json')
  const subredditsConfig = readJson(subredditsConfigPath)
  const allowedSubreddits = getAllowedSubreddits(subredditsConfig)
  const enforceAllowlist = (process.env.ENFORCE_SUBREDDIT_ALLOWLIST || '1') !== '0'

  const defaultCachePath = join(__dirname, '../cache/news-cache.txt')
  const cachePath = process.env.CACHE_PATH || defaultCachePath
  const maxRows = Number.parseInt(process.env.MAX_ROWS || '500', 10)

  console.log(`Cache: ${cachePath}`)
  console.log(`Max rows: ${maxRows}`)

  if (enforceAllowlist) {
    console.log(`Subreddit allowlist: ${allowedSubreddits.size} subs (${subredditsConfigPath})`)
  }

  const rowsRaw = readNdjson(cachePath).filter((r) => r && typeof r === 'object')
  const rows = enforceAllowlist && allowedSubreddits.size
    ? rowsRaw.filter((r) => allowedSubreddits.has(String(r?.subreddit || '').trim()))
    : rowsRaw

  if (enforceAllowlist && allowedSubreddits.size) {
    const removed = rowsRaw.length - rows.length
    console.log(`Removed by allowlist: ${removed}`)
  }

  console.log(`Loaded rows: ${rows.length}`)

  // De-dupe by postHash if present
  const byHash = new Map()
  for (const row of rows) {
    const key = row.postHash || sha256Hex(JSON.stringify(row))
    byHash.set(String(key), row)
  }

  let merged = [...byHash.values()].sort(sortNewestFirst)
  console.log(`After dedupe: ${merged.length}`)

  if (merged.length <= maxRows) {
    console.log('No pruning needed.')
    return
  }

  const referenced = await loadReferencedPostHashes()
  console.log(`Referenced hashes from Firestore: ${referenced.size}`)

  const referencedRows = []
  const unreferencedRows = []

  for (const row of merged) {
    const key = String(row.postHash || '')
    if (key && referenced.has(key)) referencedRows.push(row)
    else unreferencedRows.push(row)
  }

  if (referencedRows.length > maxRows) {
    console.error(
      `Referenced rows (${referencedRows.length}) exceed MAX_ROWS (${maxRows}). ` +
      'Cannot prune without breaking saved-post references.'
    )
    process.exit(2)
  }

  const remainingSlots = maxRows - referencedRows.length
  const pruned = [...referencedRows, ...unreferencedRows.slice(0, remainingSlots)].sort(sortNewestFirst)

  console.log(`Keeping referenced: ${referencedRows.length}`)
  console.log(`Keeping unreferenced: ${Math.min(unreferencedRows.length, remainingSlots)}`)
  console.log(`Final rows: ${pruned.length}`)

  writeNdjson(cachePath, pruned)
  console.log('Wrote pruned cache file.')
}

run().catch((err) => {
  console.error('Prune failed:', err)
  process.exit(1)
})
