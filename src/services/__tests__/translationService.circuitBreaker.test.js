import assert from "node:assert/strict"
import test from "node:test"
import {
  createProviderCircuitState,
  ensureProviderCircuitState,
  isCircuitOpen,
  normalizeCircuitProviderId,
  recordCircuitFailure,
  recordCircuitSuccess,
} from "../translationCircuitBreaker.js"

test("circuit breaker normalizes provider ids consistently", () => {
  assert.equal(normalizeCircuitProviderId(" LingVa "), "lingva")
  assert.equal(normalizeCircuitProviderId("MYMEMORY"), "mymemory")
  assert.equal(normalizeCircuitProviderId(""), "")
})

test("circuit opens after fail threshold and closes after cooldown", () => {
  let state = createProviderCircuitState("lingva", {
    failThreshold: 2,
    cooldownMs: 5000,
    now: 100,
  })

  state = recordCircuitFailure(state, 200)
  assert.equal(state.failureCount, 1)
  assert.equal(state.openUntil, 0)
  assert.equal(isCircuitOpen(state, 300), false)

  state = recordCircuitFailure(state, 250)
  assert.equal(state.failureCount, 2)
  assert.equal(state.openUntil, 5250)
  assert.equal(state.cooldownEndsAt, 5250)
  assert.equal(isCircuitOpen(state, 300), true)
  assert.equal(isCircuitOpen(state, 5300), false)
})

test("circuit success resets failure and open state", () => {
  let state = createProviderCircuitState("mymemory", {
    failThreshold: 1,
    cooldownMs: 3000,
    now: 50,
  })
  state = recordCircuitFailure(state, 100)
  assert.equal(isCircuitOpen(state, 200), true)

  const recovered = recordCircuitSuccess(state, 220)
  assert.equal(recovered.failureCount, 0)
  assert.equal(recovered.openUntil, 0)
  assert.equal(recovered.cooldownEndsAt, 0)
  assert.equal(recovered.lastSuccessAt, 220)
  assert.equal(isCircuitOpen(recovered, 230), false)
})

test("ensureProviderCircuitState creates and reuses map entries", () => {
  const map = new Map()
  const first = ensureProviderCircuitState(map, "LibreTranslate", {
    failThreshold: 4,
    cooldownMs: 1000,
  })
  assert.equal(first.provider, "libretranslate")
  assert.equal(first.failThreshold, 4)
  assert.equal(first.cooldownMs, 1000)

  const second = ensureProviderCircuitState(map, "libretranslate", {
    failThreshold: 1,
    cooldownMs: 1,
  })
  assert.equal(second, first)
  assert.equal(map.size, 1)
})
