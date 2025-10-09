#!/usr/bin/env node
/**
 * Manual trigger script for fetching and processing posts
 * Usage: node trigger-fetch.js
 */

import { runPostsFetchJob } from './jobs/fetchPostsJob.js'

console.log('🚀 Starting manual posts fetch job...\n')

runPostsFetchJob()
  .then(() => {
    console.log('\n✅ Manual fetch completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Manual fetch failed:', error.message)
    process.exit(1)
  })

