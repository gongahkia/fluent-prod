const KEY_ASKED = "fluent:webllm:asked"
const KEY_ENABLED = "fluent:webllm:enabled"

export function getDefaultWebLlmModelId() {
  return import.meta.env.VITE_WEBLLM_MODEL || "Llama-3.2-1B-Instruct-q4f16_1"
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
}
