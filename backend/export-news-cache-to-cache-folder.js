/**
 * One-time export: Prisma news_cache table -> repo-root cache/*.json
 *
 * Usage:
 *   cd backend
 *   node export-news-cache-to-cache-folder.js
 *
 * Requires DATABASE_URL to be set (same as normal Prisma usage).
 */

import { PrismaClient } from './generated/prisma/index.js'
import { uploadPostsToStorage } from './services/storageService.js'

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

async function main() {
  console.log('📤 Exporting news_cache -> cache/*.json')

  const cacheKeys = await prisma.newsCache.findMany({
    select: { cacheKey: true },
    distinct: ['cacheKey'],
  })

  if (cacheKeys.length === 0) {
    console.log('ℹ️  No news_cache rows found; nothing to export.')
    return
  }

  for (const { cacheKey } of cacheKeys) {
    const rows = await prisma.newsCache.findMany({
      where: { cacheKey },
      orderBy: { fetchedAt: 'desc' },
    })

    // Convert Prisma rows to the flat post structure used by the app.
    // Keep fields as-is; Date values stringify to ISO strings.
    const posts = rows.map((r) => ({
      id: r.postId,
      postId: r.postId,
      title: r.title,
      content: r.content,
      url: r.url,
      author: r.author,
      publishedAt: r.publishedAt,
      source: r.source,
      tags: r.tags,
      difficulty: r.difficulty,
      targetLang: r.targetLang,
      translatedTitle: r.translatedTitle,
      translatedContent: r.translatedContent,
      originalTitle: r.originalTitle,
      originalContent: r.originalContent,
      fetchedAt: r.fetchedAt,
      lastUpdated: r.lastUpdated,
      version: r.version,
    }))

    const fileName = `${cacheKey}.json`
    const ok = await uploadPostsToStorage(fileName, posts)
    if (!ok) {
      throw new Error(`Failed to export ${cacheKey}`)
    }

    console.log(`✅ Exported ${posts.length} posts -> cache/${fileName}`)
  }
}

main()
  .catch((err) => {
    console.error('❌ Export failed:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => {})
  })
