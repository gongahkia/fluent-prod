const KEY_ASKED = "fluent:webllm:asked"
const KEY_ENABLED = "fluent:webllm:enabled"
const ENABLED_EVENT = "fluent:webllm:enabled-changed"

export function getDefaultWebLlmModelId() {
  return import.meta.env.VITE_WEBLLM_MODEL || ""
}

export function hasAskedWebLlmDownload() {
  try {
    return localStorage.getItem(KEY_ASKED) === "1"
  } catch {
    return false
  }
}

export function setAskedWebLlmDownload() {
  try {
    localStorage.setItem(KEY_ASKED, "1")
  } catch {
    // ignore
  }
}

export function isWebLlmEnabled() {
  try {
    return localStorage.getItem(KEY_ENABLED) === "1"
  } catch {
    return false
  }
}

export function setWebLlmEnabled(enabled) {
  try {
    localStorage.setItem(KEY_ENABLED, enabled ? "1" : "0")
  } catch {
    // ignore
  }

  try {
    window.dispatchEvent(
      new CustomEvent(ENABLED_EVENT, {
        detail: { enabled: Boolean(enabled) },
      })
    )
  } catch {
    // ignore
  }
}

export function addWebLlmEnabledListener(handler) {
  if (typeof window === "undefined") return () => {}
  const wrapped = (event) => handler?.(Boolean(event?.detail?.enabled))
  window.addEventListener(ENABLED_EVENT, wrapped)
  return () => window.removeEventListener(ENABLED_EVENT, wrapped)
}
