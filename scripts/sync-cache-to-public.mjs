#!/usr/bin/env node

import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const repoRoot = path.resolve(__dirname, '..')
const sourceDir = path.join(repoRoot, 'cache')
const destDir = path.join(repoRoot, 'public', 'cache')

async function main() {
  await fs.mkdir(destDir, { recursive: true })

  let entries = []
  try {
    entries = await fs.readdir(sourceDir, { withFileTypes: true })
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      console.log('No cache/ directory found; skipping sync.')
      return
    }
    throw err
  }

  const cacheFiles = entries
    .filter((e) => e.isFile() && (e.name.endsWith('.json') || e.name.endsWith('.txt') || e.name.endsWith('.ndjson')))
    .map((e) => e.name)

  for (const name of cacheFiles) {
    const src = path.join(sourceDir, name)
    const dst = path.join(destDir, name)
    await fs.copyFile(src, dst)
  }

  console.log(`Synced ${cacheFiles.length} cache files -> public/cache/`)
}

main().catch((err) => {
  console.error('Cache sync failed:', err)
  process.exitCode = 1
})
