import { readFileSync } from 'node:fs'

const cachePath = process.argv[2] || 'cache/news-cache.txt'
const raw = readFileSync(cachePath, 'utf-8')
const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)

if (lines.length === 0) {
  throw new Error(`No NDJSON rows found in ${cachePath}`)
}

const requiredStringFields = ['schemaVersion', 'postHash', 'sourceId', 'title', 'content']
let invalidCount = 0

for (let i = 0; i < lines.length; i += 1) {
  const line = lines[i]
  let row
  try {
    row = JSON.parse(line)
  } catch {
    invalidCount += 1
    console.error(`Row ${i + 1}: invalid JSON`)
    continue
  }

  for (const key of requiredStringFields) {
    if (key === 'schemaVersion') {
      if (typeof row[key] !== 'number') {
        invalidCount += 1
        console.error(`Row ${i + 1}: missing/invalid schemaVersion`)
      }
      continue
    }

    if (typeof row[key] !== 'string') {
      invalidCount += 1
      console.error(`Row ${i + 1}: missing/invalid ${key}`)
    }
  }
}

if (invalidCount > 0) {
  throw new Error(`NDJSON schema validation failed with ${invalidCount} issues`)
}

console.log(`NDJSON schema validation passed for ${lines.length} rows in ${cachePath}`)
