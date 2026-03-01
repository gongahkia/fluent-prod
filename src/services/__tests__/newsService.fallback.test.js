import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchWithFallback } from '../newsServiceFallback.js'

test('uses fallback when primary feed fails', async () => {
  const result = await fetchWithFallback({
    fetchPrimary: async () => {
      throw new Error('api timeout')
    },
    fetchFallback: async () => ({ posts: [{ id: 'cache-1' }], metadata: {} }),
  })

  assert.equal(result.usedFallback, true)
  assert.equal(result.data.posts[0].id, 'cache-1')
  assert.equal(result.fallbackReason, 'api timeout')
})

test('returns primary data when primary succeeds', async () => {
  const result = await fetchWithFallback({
    fetchPrimary: async () => ({ posts: [{ id: 'api-1' }], metadata: {} }),
    fetchFallback: async () => ({ posts: [{ id: 'cache-1' }], metadata: {} }),
  })

  assert.equal(result.usedFallback, false)
  assert.equal(result.data.posts[0].id, 'api-1')
})
