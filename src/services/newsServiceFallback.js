export async function fetchWithFallback({ fetchPrimary, fetchFallback }) {
  try {
    const primary = await fetchPrimary()
    return {
      data: primary,
      usedFallback: false,
      fallbackReason: null,
    }
  } catch (error) {
    const fallback = await fetchFallback()
    return {
      data: fallback,
      usedFallback: true,
      fallbackReason: error?.message || 'primary-failed',
    }
  }
}
