import { getRuntimeMetricsSnapshot } from './runtimeMetrics.js'
import { getTranslateMetricsSnapshot } from './translateMetrics.js'

function json(res, status, payload) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method not allowed' })
  }

  const runtime = getRuntimeMetricsSnapshot()
  const translation = getTranslateMetricsSnapshot()
  const translationSuccessCount =
    translation.providerStatus.lingva.ok +
    translation.providerStatus.mymemory.ok +
    translation.providerStatus.libretranslate.ok

  const translationSuccessRate =
    translation.requestCount > 0 ? translationSuccessCount / translation.requestCount : 0

  const feedFallbackRate =
    runtime.feedRequests > 0 ? runtime.feedFallbacks / runtime.feedRequests : 0

  return json(res, 200, {
    checkedAt: new Date().toISOString(),
    feedFallbackRate,
    translationSuccessRate,
    aiTimeoutCount: runtime.aiTimeoutCount,
    counters: {
      feedRequests: runtime.feedRequests,
      feedFallbacks: runtime.feedFallbacks,
      translationRequests: translation.requestCount,
      translationFallbacks: translation.fallbackCount,
    },
  })
}
