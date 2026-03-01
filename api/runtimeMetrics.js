const runtimeMetrics = {
  feedRequests: 0,
  feedFallbacks: 0,
  aiTimeoutCount: 0,
}

export function recordFeedRequest() {
  runtimeMetrics.feedRequests += 1
}

export function recordFeedFallback() {
  runtimeMetrics.feedFallbacks += 1
}

export function recordAiTimeout() {
  runtimeMetrics.aiTimeoutCount += 1
}

export function getRuntimeMetricsSnapshot() {
  return { ...runtimeMetrics }
}
