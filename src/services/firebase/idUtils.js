export function sanitizeFirestoreId(value, fallback = "unknown") {
  let normalized = ""

  if (typeof value === "string") {
    normalized = value.trim()
  } else if (typeof value === "number" && Number.isFinite(value)) {
    normalized = String(value)
  } else if (typeof value === "bigint") {
    normalized = String(value)
  }

  if (!normalized) {
    normalized = String(fallback || "unknown")
  }

  // Firestore path segments cannot contain "/".
  normalized = normalized
    .replaceAll("/", "_")
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0)
      return code <= 31 || code === 127 ? "_" : char
    })
    .join("")

  if (!normalized.trim()) {
    return String(fallback || "unknown")
  }

  return normalized
}

export function createFirestoreId() {
  const randomId =
    globalThis?.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return sanitizeFirestoreId(randomId)
}
