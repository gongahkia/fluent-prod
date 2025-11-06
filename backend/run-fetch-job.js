#!/usr/bin/env node
/**
 * Manual script to run the posts fetch job
 * Usage: node run-fetch-job.js
 */

import dotenv from 'dotenv'
import { runPostsFetchJob } from './jobs/fetchPostsJob.js'

// Load environment variables
dotenv.config()

console.log('🚀 Starting manual posts fetch job...\n')

// Run the job
runPostsFetchJob()
  .then(() => {
    console.log('\n✅ Job completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Job failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  })
