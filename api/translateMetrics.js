const metrics = {
  requestCount: 0,
  fallbackCount: 0,
  providerStatus: {
    lingva: { ok: 0, fail: 0, lastCode: null, lastUpdatedAt: null },
    mymemory: { ok: 0, fail: 0, lastCode: null, lastUpdatedAt: null },
    libretranslate: { ok: 0, fail: 0, lastCode: null, lastUpdatedAt: null },
  },
}

function nowIso() {
  return new Date().toISOString()
}

export function recordRequest() {
  metrics.requestCount += 1
}

export function recordProviderSuccess(provider) {
  const target = metrics.providerStatus[provider]
  if (!target) return
  target.ok += 1
  target.lastCode = 'OK'
  target.lastUpdatedAt = nowIso()
}

export function recordProviderFailure(provider, code = 'UNKNOWN') {
  const target = metrics.providerStatus[provider]
  if (!target) return
  target.fail += 1
  target.lastCode = code
  target.lastUpdatedAt = nowIso()
}

export function recordFallback() {
  metrics.fallbackCount += 1
}

export function getTranslateMetricsSnapshot() {
  return {
    requestCount: metrics.requestCount,
    fallbackCount: metrics.fallbackCount,
    providerStatus: {
      lingva: { ...metrics.providerStatus.lingva },
      mymemory: { ...metrics.providerStatus.mymemory },
      libretranslate: { ...metrics.providerStatus.libretranslate },
    },
  }
}
