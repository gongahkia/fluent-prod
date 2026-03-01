import assert from "node:assert/strict"
import test from "node:test"
import {
  deserializeTranslationCache,
  serializeTranslationCache,
} from "../translationCacheStorage.js"

const SCHEMA_VERSION = 1
const MAPPINGS_VERSION = "2026-03-01"

test("deserializeTranslationCache requests purge on schema mismatch", () => {
  const raw = JSON.stringify({
    version: 999,
    mappingsVersion: MAPPINGS_VERSION,
    entries: {
      "en|ja|hello": {
        value: "こんにちは",
        expiresAt: 10_000,
        lastAccessAt: 100,
      },
    },
  })

  const hydrated = deserializeTranslationCache(raw, {
    schemaVersion: SCHEMA_VERSION,
    mappingsVersion: MAPPINGS_VERSION,
    now: 500,
  })
  assert.equal(hydrated.shouldClear, true)
  assert.equal(hydrated.entries.size, 0)
})

test("deserializeTranslationCache requests purge on mappings version mismatch", () => {
  const raw = JSON.stringify({
    version: SCHEMA_VERSION,
    mappingsVersion: "legacy-mappings",
    entries: {
      "en|ja|goodbye": {
        value: "さようなら",
        expiresAt: 20_000,
        lastAccessAt: 100,
      },
    },
  })

  const hydrated = deserializeTranslationCache(raw, {
    schemaVersion: SCHEMA_VERSION,
    mappingsVersion: MAPPINGS_VERSION,
    now: 500,
  })
  assert.equal(hydrated.shouldClear, true)
  assert.equal(hydrated.entries.size, 0)
})

test("deserializeTranslationCache keeps only valid non-expired entries", () => {
  const raw = JSON.stringify({
    version: SCHEMA_VERSION,
    mappingsVersion: MAPPINGS_VERSION,
    entries: {
      "en|ja|valid": {
        value: "有効",
        expiresAt: 10_000,
        lastAccessAt: 100,
      },
      "en|ja|expired": {
        value: "期限切れ",
        expiresAt: 100,
        lastAccessAt: 100,
      },
      "en|ja|empty": {
        value: "",
        expiresAt: 10_000,
        lastAccessAt: 100,
      },
    },
  })

  const hydrated = deserializeTranslationCache(raw, {
    schemaVersion: SCHEMA_VERSION,
    mappingsVersion: MAPPINGS_VERSION,
    now: 500,
  })
  assert.equal(hydrated.shouldClear, false)
  assert.equal(hydrated.entries.size, 1)
  assert.deepEqual(hydrated.entries.get("en|ja|valid"), {
    value: "有効",
    expiresAt: 10_000,
    lastAccessAt: 100,
  })
})

test("serializeTranslationCache round-trips through deserializeTranslationCache", () => {
  const entries = new Map([
    [
      "en|ja|cache-hit",
      { value: "キャッシュ", expiresAt: 50_000, lastAccessAt: 200 },
    ],
  ])

  const raw = serializeTranslationCache(entries, {
    schemaVersion: SCHEMA_VERSION,
    mappingsVersion: MAPPINGS_VERSION,
    now: 300,
  })

  const hydrated = deserializeTranslationCache(raw, {
    schemaVersion: SCHEMA_VERSION,
    mappingsVersion: MAPPINGS_VERSION,
    now: 400,
  })

  assert.equal(hydrated.shouldClear, false)
  assert.equal(hydrated.entries.size, 1)
  assert.deepEqual(hydrated.entries.get("en|ja|cache-hit"), {
    value: "キャッシュ",
    expiresAt: 50_000,
    lastAccessAt: 200,
  })
})
