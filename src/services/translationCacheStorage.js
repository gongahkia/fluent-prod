export function deserializeTranslationCache(
  raw,
  { schemaVersion, mappingsVersion, now = Date.now() } = {}
) {
  const output = {
    entries: new Map(),
    shouldClear: false,
  }

  if (!raw || typeof raw !== "string") return output

  let parsed = null
  try {
    parsed = JSON.parse(raw)
  } catch {
    return output
  }

  if (!parsed || typeof parsed !== "object") return output
  if (parsed.version !== schemaVersion) {
    return { ...output, shouldClear: true }
  }
  if (parsed.mappingsVersion !== mappingsVersion) {
    return { ...output, shouldClear: true }
  }

  const entries =
    parsed.entries && typeof parsed.entries === "object" ? parsed.entries : {}
  for (const [key, entry] of Object.entries(entries)) {
    if (!entry || typeof entry !== "object") continue
    if (typeof entry.value !== "string" || !entry.value) continue
    if (typeof entry.expiresAt !== "number" || entry.expiresAt <= now) continue
    const lastAccessAt =
      typeof entry.lastAccessAt === "number" ? entry.lastAccessAt : now
    output.entries.set(key, {
      value: entry.value,
      expiresAt: entry.expiresAt,
      lastAccessAt,
    })
  }

  return output
}

export function serializeTranslationCache(
  entriesMap,
  { schemaVersion, mappingsVersion, now = Date.now() } = {}
) {
  const entries = {}
  for (const [key, entry] of entriesMap.entries()) {
    if (!entry || typeof entry !== "object") continue
    if (typeof entry.value !== "string" || !entry.value) continue
    if (typeof entry.expiresAt !== "number") continue
    entries[key] = {
      value: entry.value,
      expiresAt: entry.expiresAt,
      lastAccessAt:
        typeof entry.lastAccessAt === "number" ? entry.lastAccessAt : now,
    }
  }

  return JSON.stringify({
    version: schemaVersion,
    mappingsVersion,
    savedAt: now,
    entries,
  })
}
