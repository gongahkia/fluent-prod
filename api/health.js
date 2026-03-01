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

  return json(res, 200, {
    status: 'ok',
    service: 'translation-api',
    checkedAt: new Date().toISOString(),
    metrics: getTranslateMetricsSnapshot(),
  })
}
