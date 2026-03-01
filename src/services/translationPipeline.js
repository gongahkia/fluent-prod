export async function runFallbackProviders({ providers, runProvider }) {
  for (const provider of providers) {
    const result = await runProvider(provider)
    if (result) return result
  }
  return null
}

export function normalizeTranslationText(input) {
  let text = String(input ?? '')
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

export function withTimeout(ms) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ms)
  return { signal: controller.signal, cancel: () => clearTimeout(timeout) }
}
