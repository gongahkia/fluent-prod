/**
 * Text Utility Functions
 * Shared utilities for text processing and markdown manipulation
 */

/**
 * Strip markdown formatting and reduce text to plaintext
 * This happens BEFORE difficulty classification
 * @param {string} text - Text with markdown formatting
 * @returns {string} Plain text without markdown
 */
export function stripMarkdownToPlaintext(text) {
  if (!text || text.trim().length === 0) {
    return ''
  }

  let plaintext = text

  // Remove code blocks (```code```)
  plaintext = plaintext.replace(/```[\s\S]*?```/g, '')

  // Remove inline code (`code`)
  plaintext = plaintext.replace(/`([^`]+)`/g, '$1')

  // Remove images ![alt](url)
  plaintext = plaintext.replace(/!\[([^\]]*)\]\([^)]+\)/g, '')

  // Remove links but keep text [text](url) -> text
  plaintext = plaintext.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

  // Remove headers (##, ###, etc.)
  plaintext = plaintext.replace(/^#{1,6}\s+/gm, '')

  // Remove bold/italic (**text**, *text*, __text__, _text_)
  plaintext = plaintext.replace(/(\*\*|__)(.*?)\1/g, '$2')
  plaintext = plaintext.replace(/(\*|_)(.*?)\1/g, '$2')

  // Remove blockquotes (> text)
  plaintext = plaintext.replace(/^>\s+/gm, '')

  // Remove horizontal rules (---, ***, ___)
  plaintext = plaintext.replace(/^[-*_]{3,}$/gm, '')

  // Remove list markers (-, *, +, 1., 2., etc.)
  plaintext = plaintext.replace(/^\s*[-*+]\s+/gm, '')
  plaintext = plaintext.replace(/^\s*\d+\.\s+/gm, '')

  // Remove HTML tags
  plaintext = plaintext.replace(/<[^>]+>/g, '')

  // Normalize whitespace
  plaintext = plaintext.replace(/\n{3,}/g, '\n\n')
  plaintext = plaintext.trim()

  return plaintext
}

/**
 * Strip markdown formatting for translation (lighter version)
 * Used in translationService for cleaning text before translation
 * @param {string} text - Text with markdown formatting
 * @returns {string} Plain text without markdown
 */
export function stripMarkdownFormatting(text) {
  if (!text) return ''

  let cleaned = text

  // Remove bold: **text** or __text__
  cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1')
  cleaned = cleaned.replace(/__(.+?)__/g, '$1')

  // Remove italic: *text* or _text_ (but not within words)
  cleaned = cleaned.replace(/\*(.+?)\*/g, '$1')
  cleaned = cleaned.replace(/\b_(.+?)_\b/g, '$1')

  // Remove strikethrough: ~~text~~
  cleaned = cleaned.replace(/~~(.+?)~~/g, '$1')

  // Remove inline code: `code`
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1')

  // Remove code blocks: ```code```
  cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
    return match.replace(/```\w*\n?/g, '').replace(/```/g, '')
  })

  // Remove headers: # Header
  cleaned = cleaned.replace(/^#{1,6}\s+(.+)$/gm, '$1')

  // Remove list markers: - item or * item or 1. item
  cleaned = cleaned.replace(/^[\s]*[-*+]\s+/gm, '')
  cleaned = cleaned.replace(/^[\s]*\d+\.\s+/gm, '')

  // Remove horizontal rules: --- or ***
  cleaned = cleaned.replace(/^[\s]*[-*_]{3,}[\s]*$/gm, '')

  // Remove markdown links [text](url) - extract only the text
  cleaned = cleaned.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')

  // Remove Reddit quote markers: > or &gt;
  cleaned = cleaned.replace(/^[\s]*(&gt;|>)\s*/gm, '')

  return cleaned
}

/**
 * Chunk array into smaller arrays for batch processing
 * @param {Array} array - Array to chunk
 * @param {number} size - Size of each chunk
 * @returns {Array<Array>} Array of chunks
 */
export function chunkArray(array, size) {
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

/**
 * Clean text for processing (basic cleaning)
 * @param {string} text - Text to clean
 * @returns {string} Cleaned text
 */
export function cleanText(text) {
  if (!text || typeof text !== 'string') {
    return ''
  }

  return text
    .replace(/[^\w\s.!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export default {
  stripMarkdownToPlaintext,
  stripMarkdownFormatting,
  chunkArray,
  cleanText
}
