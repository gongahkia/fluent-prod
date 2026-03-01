// NDJSON cache loader with in-memory + hash tracking
//
// Loads a newline-delimited JSON file (one object per line) from a URL.
// Computes a SHA-256 hash of the file contents for change detection.

const HASH_STORAGE_KEY = 'fluent.cache.ndjson.sha256.v1'

let inMemory = {
  url: null,
  sha256: null,
  rows: null,
  loadedAt: null,
}

let ndjsonTelemetry = {
  totalLines: 0,
  parsedRows: 0,
  rejectedRows: 0,
  invalidJsonRows: 0,
  invalidSchemaRows: 0,
}

async function sha256Hex(text) {
  // Browser crypto
  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(text)
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  }

  // Extremely rare fallback (shouldn't happen in modern browsers)
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0
  }
  return `fallback-${hash}`
}

function isValidCacheRow(row) {
  if (!row || typeof row !== 'object') return false
  if (!row.postHash || typeof row.postHash !== 'string') return false
  if (!row.sourceId || typeof row.sourceId !== 'string') return false
  if (typeof row.title !== 'string') return false
  if (typeof row.content !== 'string') return false
  if (typeof row.schemaVersion !== 'number') return false
  return true
}

function parseNdjson(text) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const rows = []

  ndjsonTelemetry = {
    totalLines: lines.length,
    parsedRows: 0,
    rejectedRows: 0,
    invalidJsonRows: 0,
    invalidSchemaRows: 0,
  }

  for (const line of lines) {
    let parsed = null
    try {
      parsed = JSON.parse(line)
    } catch {
      ndjsonTelemetry.invalidJsonRows += 1
      ndjsonTelemetry.rejectedRows += 1
      continue
    }

    if (!isValidCacheRow(parsed)) {
      ndjsonTelemetry.invalidSchemaRows += 1
      ndjsonTelemetry.rejectedRows += 1
      continue
    }

    rows.push(parsed)
    ndjsonTelemetry.parsedRows += 1
  }
  return rows
}

export function getNdjsonTelemetry() {
  return { ...ndjsonTelemetry }
}

export async function loadNdjsonCache(url, { revalidate = true } = {}) {
  if (!url) throw new Error('Missing cache URL')

  const isDev = Boolean(globalThis?.location?.hostname === 'localhost' || globalThis?.location?.hostname === '127.0.0.1')
  if (isDev) {
    console.log('[NDJSON] load start', { url, revalidate })
  }

  // If we already loaded this URL and caller doesn't want revalidation, return in-memory.
  if (!revalidate && inMemory.url === url && Array.isArray(inMemory.rows)) {
    return { url, sha256: inMemory.sha256, rows: inMemory.rows, changed: false }
  }

  // Always fetch to compute the current hash (GitHub raw can change).
  const response = await fetch(url, { method: 'GET' })
  if (!response.ok) {
    if (isDev) {
      console.log('[NDJSON] fetch failed', { url, status: response.status, statusText: response.statusText })
    }
    throw new Error(`Failed to fetch cache: ${response.status} ${response.statusText}`)
  }

  const text = await response.text()
  const sha256 = await sha256Hex(text)

  // Fast path: unchanged vs in-memory
  if (inMemory.url === url && inMemory.sha256 === sha256 && Array.isArray(inMemory.rows)) {
    return { url, sha256, rows: inMemory.rows, changed: false }
  }

  const previousSha = (() => {
    try {
      return localStorage.getItem(HASH_STORAGE_KEY)
    } catch {
      return null
    }
  })()

  const rows = parseNdjson(text)

  if (isDev) {
    console.log('[NDJSON] load ok', {
      url,
      bytes: text.length,
      rows: rows.length,
      sha256,
      telemetry: ndjsonTelemetry,
    })
  }

  inMemory = {
    url,
    sha256,
    rows,
    loadedAt: Date.now(),
  }

  try {
    localStorage.setItem(HASH_STORAGE_KEY, sha256)
  } catch {
    // ignore
  }

  return { url, sha256, rows, changed: previousSha ? previousSha !== sha256 : true }
}
