import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeTranslationText } from '../translationPipeline.js'

test('normalizeTranslationText unescapes quotes and unicode escapes', () => {
  const raw = '\\"こんにちは\\" \\u3042'
  const normalized = normalizeTranslationText(raw)
  assert.equal(normalized, '"こんにちは" あ')
})

test('normalizeTranslationText removes malformed surrogate code points', () => {
  const malformed = `bad${String.fromCharCode(0xD800)}text${String.fromCharCode(0xDC00)}`
  const normalized = normalizeTranslationText(malformed)
  assert.equal(normalized, 'badtext')
})
