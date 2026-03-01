export function normalizeCircuitProviderId(providerId) {
  return String(providerId || "").trim().toLowerCase()
}

export function createProviderCircuitState(
  providerId,
  {
    failThreshold = 3,
    cooldownMs = 30_000,
    now = Date.now(),
  } = {}
) {
  const key = normalizeCircuitProviderId(providerId)
  return {
    provider: key,
    failureCount: 0,
    openUntil: 0,
    cooldownEndsAt: 0,
    lastFailureAt: 0,
    lastSuccessAt: 0,
    failThreshold,
    cooldownMs,
    updatedAt: now,
  }
}

export function ensureProviderCircuitState(
  stateMap,
  providerId,
  config = {}
) {
  const key = normalizeCircuitProviderId(providerId)
  if (!stateMap.has(key)) {
    stateMap.set(key, createProviderCircuitState(key, config))
  }
  return stateMap.get(key)
}

export function isCircuitOpen(state, now = Date.now()) {
  return now < Number(state?.openUntil || 0)
}

export function recordCircuitFailure(state, now = Date.now()) {
  const nextState = {
    ...state,
    failureCount: Number(state?.failureCount || 0) + 1,
    lastFailureAt: now,
    updatedAt: now,
  }

  if (nextState.failureCount >= Number(nextState.failThreshold || 0)) {
    nextState.cooldownEndsAt = now + Number(nextState.cooldownMs || 0)
    nextState.openUntil = nextState.cooldownEndsAt
  }

  return nextState
}

export function recordCircuitSuccess(state, now = Date.now()) {
  return {
    ...state,
    failureCount: 0,
    openUntil: 0,
    cooldownEndsAt: 0,
    lastSuccessAt: now,
    updatedAt: now,
  }
}
