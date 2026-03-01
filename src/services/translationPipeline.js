export async function runFallbackProviders({ providers, runProvider }) {
  for (const provider of providers) {
    const result = await runProvider(provider)
    if (result) return result
  }
  return null
}
