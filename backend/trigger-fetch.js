// Manual trigger for post fetch job
import { runPostsFetchJob } from './jobs/fetchPostsJob.js'

console.log('🚀 Manually triggering post fetch job...\n')

runPostsFetchJob()
  .then(() => {
    console.log('\n✅ Post fetch job completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Post fetch job failed:', error)
    process.exit(1)
  })
