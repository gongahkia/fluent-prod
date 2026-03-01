const TRANSIENT_FIRESTORE_WRITE_CODES = new Set([
  "aborted",
  "deadline-exceeded",
  "internal",
  "resource-exhausted",
  "unavailable",
])

export function isTransientFirestoreWriteError(error) {
  const code = String(error?.code || "")
    .trim()
    .toLowerCase()
  return TRANSIENT_FIRESTORE_WRITE_CODES.has(code)
}

export async function withFirestoreWriteRetry(
  operation,
  fn,
  { maxRetries = 3, baseDelayMs = 150, maxDelayMs = 2500 } = {}
) {
  let attempt = 0

  while (attempt <= maxRetries) {
    try {
      return await fn()
    } catch (error) {
      if (!isTransientFirestoreWriteError(error) || attempt >= maxRetries) {
        throw error
      }

      const backoffMs = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt)
      const jitterMs = Math.floor(Math.random() * 75)
      const delayMs = backoffMs + jitterMs
      console.warn("[FirestoreWriteRetry]", {
        operation,
        attempt: attempt + 1,
        delayMs,
        code: error?.code,
      })
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      attempt += 1
    }
  }
}
