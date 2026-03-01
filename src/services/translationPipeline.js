export async function runFallbackProviders({ providers, runProvider }) {
  for (const provider of providers) {
    const result = await runProvider(provider)
    if (result) return result
  }
  return null
}

const HTML_ENTITY_MAP = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

function decodeHtmlEntities(input) {
  return String(input ?? '').replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (fullMatch, entity) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      const codePoint = Number.parseInt(entity.slice(2), 16)
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : fullMatch
    }
    if (entity.startsWith('#')) {
      const codePoint = Number.parseInt(entity.slice(1), 10)
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : fullMatch
    }
    return HTML_ENTITY_MAP[entity.toLowerCase()] || fullMatch
  })
}

export function normalizeTranslationText(input) {
  let text = decodeHtmlEntities(input)
  text = text
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
      String.fromCharCode(Number.parseInt(hex, 16))
    )

  text = text.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '')
  text = text.replace(/(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '$1')

  return text.normalize('NFKC').trim()
}

export function passesMinimumTranslationQuality(translation, originalText = '') {
  const normalizedTranslation = normalizeTranslationText(translation)
  const normalizedOriginal = normalizeTranslationText(originalText)
  if (!normalizedTranslation) return false

  // Reject unchanged and near-empty outputs.
  if (
    normalizedOriginal &&
    normalizedTranslation.toLowerCase() === normalizedOriginal.toLowerCase()
  ) {
    return false
  }
  if (normalizedTranslation.length < 2) return false

  // Reject outputs with no letter/number content.
  if (!/[\p{L}\p{N}]/u.test(normalizedTranslation)) return false

  // If source text is substantial, translation should not collapse to a tiny fragment.
  if (normalizedOriginal.length >= 12 && normalizedTranslation.length <= 2) {
    return false
  }

  return true
}

export function withTimeout(ms) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ms)
  return { signal: controller.signal, cancel: () => clearTimeout(timeout) }
}
