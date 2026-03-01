import test from 'node:test'
import assert from 'node:assert/strict'
import { runFallbackProviders } from '../translationPipeline.js'

test('runFallbackProviders executes providers in declared order until success', async () => {
  const called = []

  const result = await runFallbackProviders({
    providers: ['lingva', 'mymemory', 'libretranslate'],
    runProvider: async (provider) => {
      called.push(provider)
      if (provider === 'mymemory') return 'こんにちは'
      return null
    },
  })

  assert.equal(result, 'こんにちは')
  assert.deepEqual(called, ['lingva', 'mymemory'])
})

test('runFallbackProviders returns null when all providers fail', async () => {
  const called = []

  const result = await runFallbackProviders({
    providers: ['lingva', 'mymemory'],
    runProvider: async (provider) => {
      called.push(provider)
      return null
    },
  })

  assert.equal(result, null)
  assert.deepEqual(called, ['lingva', 'mymemory'])
})
