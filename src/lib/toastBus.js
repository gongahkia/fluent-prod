const TOAST_EVENT_NAME = "fluent:toast"
const TRANSLATION_EVENT_NAME = "fluent:translation"

export function emitToast({ message, icon = "⚠️", duration = 2500 } = {}) {
  if (typeof window === "undefined") return
  if (!message) return

  try {
    window.dispatchEvent(
      new CustomEvent(TOAST_EVENT_NAME, {
        detail: { message, icon, duration },
      })
    )
  } catch {
    // ignore
  }
}

export function addToastListener(handler) {
  if (typeof window === "undefined") return () => {}

  const wrapped = (event) => {
    handler?.(event?.detail)
  }

  window.addEventListener(TOAST_EVENT_NAME, wrapped)
  return () => window.removeEventListener(TOAST_EVENT_NAME, wrapped)
}

export function emitTranslationEvent(event = {}) {
  if (typeof window === "undefined") return

  const detail = {
    type: "translation",
    state: event?.state || "unknown",
    source: event?.source || "unknown",
    provider: event?.provider || null,
    fromLang: event?.fromLang || null,
    toLang: event?.toLang || null,
    cacheHit: Boolean(event?.cacheHit),
    timestamp: Date.now(),
  }

  try {
    window.dispatchEvent(
      new CustomEvent(TRANSLATION_EVENT_NAME, {
        detail,
      })
    )
  } catch {
    // ignore
  }
}

export function addTranslationEventListener(handler) {
  if (typeof window === "undefined") return () => {}

  const wrapped = (event) => {
    handler?.(event?.detail)
  }

  window.addEventListener(TRANSLATION_EVENT_NAME, wrapped)
  return () => window.removeEventListener(TRANSLATION_EVENT_NAME, wrapped)
}

export async function captureAsyncError(operation, {
  message = "An unexpected error occurred.",
  icon = "⚠️",
  duration = 2500,
  onError,
  rethrow = false,
} = {}) {
  try {
    return await operation()
  } catch (error) {
    emitToast({ message, icon, duration })
    if (typeof onError === "function") {
      onError(error)
    }
    if (rethrow) throw error
    return null
  }
}
