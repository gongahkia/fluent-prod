/**
 * Performance Monitoring Utilities
 * Track and log performance metrics for async operations
 */

/**
 * Simple performance timer
 * @param {string} operationName - Name of the operation being timed
 * @returns {Object} Timer object with stop method
 */
export function startTimer(operationName) {
  const startTime = Date.now()

  return {
    stop: () => {
      const duration = Date.now() - startTime
      return {
        operation: operationName,
        duration,
        durationMs: `${duration}ms`,
        durationSec: `${(duration / 1000).toFixed(2)}s`
      }
    }
  }
}

/**
 * Track batch operation performance
 * @param {string} operationName - Name of the batch operation
 * @param {number} itemCount - Number of items in batch
 * @returns {Object} Batch timer with stop method
 */
export function startBatchTimer(operationName, itemCount) {
  const startTime = Date.now()

  return {
    stop: () => {
      const duration = Date.now() - startTime
      const perItem = itemCount > 0 ? (duration / itemCount).toFixed(2) : 0

      return {
        operation: operationName,
        itemCount,
        duration,
        durationMs: `${duration}ms`,
        durationSec: `${(duration / 1000).toFixed(2)}s`,
        perItem: `${perItem}ms/item`
      }
    }
  }
}

/**
 * Log performance metrics
 * @param {Object} metrics - Metrics object from timer
 * @param {string} level - Log level (info, success, warning)
 */
export function logPerformance(metrics, level = 'info') {
  if (metrics.itemCount !== undefined) {
    console.log(`[PERF] ${metrics.operation}: ${metrics.itemCount} items in ${metrics.durationSec} (${metrics.perItem})`)
  } else {
    console.log(`[PERF] ${metrics.operation}: ${metrics.durationSec}`)
  }
}

/**
 * Wrapper for async function with automatic timing
 * @param {string} operationName - Name of the operation
 * @param {Function} fn - Async function to execute
 * @returns {Promise<any>} Result of the function
 */
export async function timeAsync(operationName, fn) {
  const timer = startTimer(operationName)

  try {
    const result = await fn()
    const metrics = timer.stop()
    logPerformance(metrics, 'success')
    return result
  } catch (error) {
    const metrics = timer.stop()
    logPerformance(metrics, 'warning')
    throw error
  }
}

/**
 * Cache statistics tracker
 */
export class CacheMetrics {
  constructor() {
    this.hits = 0
    this.misses = 0
    this.sets = 0
    this.startTime = Date.now()
  }

  recordHit() {
    this.hits++
  }

  recordMiss() {
    this.misses++
  }

  recordSet() {
    this.sets++
  }

  getStats() {
    const total = this.hits + this.misses
    const hitRate = total > 0 ? ((this.hits / total) * 100).toFixed(2) : 0
    const uptime = ((Date.now() - this.startTime) / 1000).toFixed(2)

    return {
      hits: this.hits,
      misses: this.misses,
      sets: this.sets,
      total,
      hitRate: `${hitRate}%`,
      uptime: `${uptime}s`
    }
  }

  logStats(cacheName = 'Cache') {
    const stats = this.getStats()
    console.log(`[CACHE] ${cacheName} Stats:`, stats)
  }

  reset() {
    this.hits = 0
    this.misses = 0
    this.sets = 0
    this.startTime = Date.now()
  }
}

/**
 * Request deduplication manager
 * Prevents duplicate in-flight requests for the same operation
 */
export class RequestDeduplicator {
  constructor() {
    this.inFlight = new Map()
    this.stats = {
      deduplicated: 0,
      unique: 0
    }
  }

  /**
   * Execute a function with deduplication
   * @param {string} key - Unique key for this request
   * @param {Function} fn - Async function to execute
   * @returns {Promise<any>} Result of the function
   */
  async dedupe(key, fn) {
    // Check if request is already in flight
    if (this.inFlight.has(key)) {
      this.stats.deduplicated++
      console.log(`[DEDUPE] Request deduplicated: ${key}`)
      return await this.inFlight.get(key)
    }

    // Start new request
    this.stats.unique++
    const promise = fn().finally(() => {
      // Clean up after completion
      this.inFlight.delete(key)
    })

    this.inFlight.set(key, promise)
    return await promise
  }

  getStats() {
    return {
      ...this.stats,
      inFlight: this.inFlight.size,
      totalRequests: this.stats.unique + this.stats.deduplicated,
      dedupeRate: this.stats.deduplicated > 0
        ? `${((this.stats.deduplicated / (this.stats.unique + this.stats.deduplicated)) * 100).toFixed(2)}%`
        : '0%'
    }
  }

  logStats() {
    const stats = this.getStats()
    console.log(`[DEDUPE] Stats:`, stats)
  }
}

export default {
  startTimer,
  startBatchTimer,
  logPerformance,
  timeAsync,
  CacheMetrics,
  RequestDeduplicator
}
