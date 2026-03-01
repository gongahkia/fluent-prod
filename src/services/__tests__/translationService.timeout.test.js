import test from 'node:test'
import assert from 'node:assert/strict'
import { withTimeout } from '../translationPipeline.js'

test('withTimeout aborts the signal after deadline', async () => {
  const { signal } = withTimeout(20)
  assert.equal(signal.aborted, false)

  await new Promise((resolve) => setTimeout(resolve, 40))
  assert.equal(signal.aborted, true)
})

test('withTimeout cancel prevents abort', async () => {
  const { signal, cancel } = withTimeout(30)
  cancel()

  await new Promise((resolve) => setTimeout(resolve, 50))
  assert.equal(signal.aborted, false)
})
