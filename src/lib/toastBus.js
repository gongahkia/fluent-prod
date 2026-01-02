const TOAST_EVENT_NAME = "fluent:toast"

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
