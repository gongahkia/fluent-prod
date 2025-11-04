import React from "react"
import vocabularyService from "../../services/vocabularyService"
import { decodeHTMLEntities, segmentJapaneseText } from "./utils/textParsing"

// Parse plaintext content (markdown already stripped by backend)
export const parseMarkdownContent = (text, postId = null, renderClickableText) => {
  if (!text) return ""

  // Decode HTML entities
  let cleaned = decodeHTMLEntities(text)

  // Check if content is JSON from translation service - extract and render the text
  let parsedData = null
  try {
    if (typeof cleaned === 'string' && cleaned.trim().startsWith("{") && cleaned.includes('"wordMetadata"')) {
      parsedData = JSON.parse(cleaned)
      if (parsedData.text && parsedData.wordMetadata !== undefined) {
        // Extract the text (markdown already stripped by backend)
        cleaned = parsedData.text
      } else {
        console.warn('⚠️ JSON structure invalid - missing text or wordMetadata')
        parsedData = null
      }
    }
  } catch (e) {
    // Not JSON or invalid JSON, continue with normal parsing
    console.warn('Failed to parse JSON content:', e, 'Text:', cleaned?.substring(0, 100))
    parsedData = null
  }

  // Check if text is an object (shouldn't happen but handle it)
  if (typeof cleaned !== 'string') {
    console.error('Content is not a string:', cleaned)
    // Try to extract text if it's an object with text property
    if (cleaned && typeof cleaned === 'object' && cleaned.text) {
      cleaned = cleaned.text
    } else {
      return String(cleaned || '')
    }
  }

  // If we had JSON with wordMetadata, pass it to renderClickableText
  if (parsedData && parsedData.wordMetadata !== undefined) {
    if (Array.isArray(parsedData.wordMetadata) && parsedData.wordMetadata.length === 0) {
      // No word metadata, continue with normal processing below
    } else {
      // NEW: Pass JSON with allWordTranslations to renderClickableText
      const cleanedJson = JSON.stringify({
        text: cleaned,
        wordMetadata: parsedData.wordMetadata,
        allWordTranslations: parsedData.allWordTranslations || {}  // Include all translations
      })
      return renderClickableText(cleanedJson, postId)
    }
  }

  // Split by lines to preserve paragraph structure
  const lines = cleaned.split('\n')
  const elements = []

  lines.forEach((line, lineIndex) => {
    if (line.trim() === '') {
      // Empty line - add spacing
      elements.push(<br key={`br-${lineIndex}`} />)
      return
    }

    // Regular line - process normally (markdown already stripped by backend)
    elements.push(
      <span key={`line-${lineIndex}`}>
        {parseLineContent(line, postId, renderClickableText)}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    )
  })

  return elements
}

// Parse inline content - only handle plain URLs (markdown already stripped by backend)
export const parseLineContent = (text, postId = null, renderClickableText) => {
  const parts = []
  let keyCounter = 0

  // Match only plain URLs (markdown links already removed by backend)
  const urlRegex = /(https?:\/\/[^\s]+)/g
  let lastIndex = 0
  let match

  while ((match = urlRegex.exec(text)) !== null) {
    // Add text before match - make it clickable for translation
    if (match.index > lastIndex) {
      const textBeforeUrl = text.substring(lastIndex, match.index)
      parts.push(
        <span key={`text-${keyCounter++}`}>
          {renderClickableText(textBeforeUrl, postId)}
        </span>
      )
    }

    // Plain URL - make it clickable for navigation
    parts.push(
      <a
        key={`link-${keyCounter++}`}
        href={match[1]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-orange-600 hover:text-orange-800 underline break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {match[1]}
      </a>
    )

    lastIndex = match.index + match[0].length
  }

  // Add remaining text - make it clickable for translation
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex)
    parts.push(
      <span key={`text-${keyCounter++}`}>
        {renderClickableText(remainingText, postId)}
      </span>
    )
  }

  return parts.length > 0 ? parts : renderClickableText(text, postId)
}

// Create renderClickableText function factory
export const createRenderClickableText = (translationStates, toggleTranslation, handleWordClick, targetLanguage = 'Japanese', allWordTranslations = {}) => {
  return (text, postId = null) => {
    if (!text) return ""

    // Check if text is JSON from translation service
    let parsedData = null
    try {
      if (text.trim().startsWith("{") && text.includes('"wordMetadata"')) {
        parsedData = JSON.parse(text)
      }
    } catch (e) {
      // Not JSON, continue with normal processing
      console.warn('Failed to parse JSON in renderClickableText:', e)
    }

    if (parsedData && parsedData.text && parsedData.wordMetadata !== undefined) {
      // NEW: Extract allWordTranslations and vocabularyWords from parsed data
      const allTranslations = parsedData.allWordTranslations || allWordTranslations || {}
      const vocabularyWords = parsedData.vocabularyWords || []

      // Process text with word metadata
      let processedText = parsedData.text

      // Ensure processedText is a string
      if (typeof processedText !== 'string') {
        console.error('processedText is not a string:', processedText)
        return String(processedText || '')
      }

      // If wordMetadata is empty, just return the plain text (no markers should exist)
      if (!Array.isArray(parsedData.wordMetadata) || parsedData.wordMetadata.length === 0) {
        // Remove any orphaned markers that shouldn't be there
        const cleanedText = processedText.replace(/\{\{WORD:\d+\}\}/g, '[translation unavailable]')
        // Return as React element to maintain consistency with other returns
        return [<span key="cleaned-text">{cleanedText}</span>]
      }

      // Build a map of all markers and their positions
      const markerPositions = []

      // Sort metadata by index to process in order
      const sortedMetadata = [...parsedData.wordMetadata].sort((a, b) => a.index - b.index)

      for (const wordData of sortedMetadata) {
        // Validate wordData structure
        if (!wordData || typeof wordData.index !== 'number') {
          console.warn('Invalid wordData:', wordData)
          continue
        }

        const marker = `{{WORD:${wordData.index}}}`
        const markerIndex = processedText.indexOf(marker)

        if (markerIndex !== -1) {
          markerPositions.push({
            index: markerIndex,
            marker,
            wordData
          })
        } else {
          console.warn(`Marker ${marker} not found in text for word:`, wordData.original)
        }
      }

      // If no valid markers found, return cleaned text
      if (markerPositions.length === 0) {
        const cleanedText = processedText.replace(/\{\{WORD:\d+\}\}/g, '[word]')
        return [<span key="cleaned-text-no-markers">{cleanedText}</span>]
      }

      // Sort by position in text
      markerPositions.sort((a, b) => a.index - b.index)

      // Build the final output
      const parts = []
      let lastIndex = 0
      let keyCounter = 0

      // Helper function to render text with vocabulary words clickable
      const renderTextWithVocab = (text, keyPrefix) => {
        if (!text) return []

        // If we have vocabularyWords data, make them clickable
        if (vocabularyWords && vocabularyWords.length > 0) {
          // Create a map of vocabulary words for quick lookup
          const vocabMap = new Map()
          vocabularyWords.forEach(v => {
            const normalizedWord = v.word.toLowerCase()
            vocabMap.set(normalizedWord, v)
          })

          // Split by word boundaries
          const segments = text.split(/(\s+|[.,!?;:"'()[\]{}—–-])/)
          return segments.map((segment, idx) => {
            // Keep whitespace and punctuation as-is
            if (!segment.trim() || /^[.,!?;:"'()[\]{}—–-\s]+$/.test(segment)) {
              return <span key={`${keyPrefix}-${idx}`}>{segment}</span>
            }

            const cleanWord = segment.trim().toLowerCase().replace(/[.,!?;:"'()[\]{}—–-]/g, "")
            const vocabData = vocabMap.get(cleanWord)

            if (vocabData && vocabularyService.isValidVocabularyWord(cleanWord)) {
              // This is a vocabulary word - make it clickable
              const targetLangName = targetLanguage === 'Korean' ? 'Korean' : 'Japanese'

              return (
                <span
                  key={`${keyPrefix}-vocab-${idx}`}
                  className="cursor-pointer hover:bg-amber-200 border-b-2 border-amber-400 hover:border-amber-600 rounded px-1 py-0.5 transition-all duration-200 font-medium bg-amber-50"
                  onClick={(e) => handleWordClick(segment.trim(), false, processedText, e)}
                  title={`📚 Level ${vocabData.difficulty} Vocabulary: Click to see ${targetLangName} "${vocabData.translation}"`}
                  style={{ textDecoration: "none" }}
                >
                  {segment}
                </span>
              )
            }

            // Not a vocabulary word - just plain text
            return <span key={`${keyPrefix}-text-${idx}`}>{segment}</span>
          })
        }

        // No vocabulary data, just return plain text
        return [<span key={keyPrefix}>{text}</span>]
      }

      for (const { index: markerIndex, marker, wordData } of markerPositions) {
        // Add text before this marker (may contain orphaned markers - we'll clean them)
        if (markerIndex > lastIndex) {
          const textBeforeMarker = processedText.substring(lastIndex, markerIndex)
          // Remove any orphaned markers in this segment
          const cleanedSegment = textBeforeMarker.replace(/\{\{WORD:\d+\}\}/g, '[word]')
          if (cleanedSegment) {
            // NEW: Render with vocabulary words clickable
            parts.push(...renderTextWithVocab(cleanedSegment, `before-${keyCounter++}`))
          }
        }

        // Check if this word has been toggled
        const stateKey = postId ? `${postId}-${wordData.index}` : null
        const isToggled = stateKey ? translationStates[stateKey] : false

        // Determine what to show based on target language
        // wordData.showJapanese/showKorean indicates this is an ENGLISH word that can be translated to Japanese/Korean
        const showTargetLang = wordData.showJapanese || wordData.showKorean
        const isShowingTargetLang = isToggled ? !showTargetLang : showTargetLang
        const displayText = isShowingTargetLang ? (wordData.translation || wordData.original) : wordData.original

        // Determine language flag
        const targetLangFlag = wordData.showKorean ? '🇰🇷' : '🇯🇵'
        const targetLangName = wordData.showKorean ? 'Korean' : 'Japanese'

        parts.push(
          <span
            key={`word-${wordData.index}-${keyCounter++}`}
            className="cursor-pointer hover:bg-amber-200 border-b-2 border-amber-400 hover:border-amber-600 rounded px-1 py-0.5 transition-all duration-200 font-medium bg-amber-50"
            onClick={(e) => {
              if (postId) toggleTranslation(postId, wordData.index)
              // When clicking, pass the ACTUAL language of the currently displayed text
              // If showing target lang (Korean/Japanese), the word IS in target lang -> translate to English
              // If showing English, the word is NOT in target lang -> translate to target lang
              handleWordClick(displayText, isShowingTargetLang, processedText, e)
            }}
            title={
              isShowingTargetLang
                ? `${targetLangFlag} ${targetLangName}: Click to see English "${wordData.original}"`
                : `📚 English: Click to see ${targetLangName} "${wordData.translation || '...'}"`
            }
            style={{ textDecoration: "none" }}
          >
            {displayText}
          </span>
        )

        lastIndex = markerIndex + marker.length
      }

      // Add remaining text after last marker
      if (lastIndex < processedText.length) {
        const remainingText = processedText.substring(lastIndex)
        // Clean any orphaned markers in the remaining text
        const cleanedRemaining = remainingText.replace(/\{\{WORD:\d+\}\}/g, '[word]')

        if (cleanedRemaining) {
          // NEW: Render remaining text with ALL vocabulary words clickable
          parts.push(...renderTextWithVocab(cleanedRemaining, `remaining-${keyCounter++}`))
        }
      }

      // Always return an array of React elements, never plain text strings mixed with elements
      return parts.length > 0 ? parts : [<span key="fallback">{processedText}</span>]
    }

    // Split by spaces and punctuation, preserving them
    const segments = text.split(/(\s+|[.,!?;:"'()[\]{}—–-])/)

    return segments.map((segment, segmentIndex) => {
      // Keep whitespace and punctuation as-is
      if (!segment.trim() || /^[.,!?;:"'()[\]{}—–-\s]+$/.test(segment)) {
        return <span key={segmentIndex}>{segment}</span>
      }

      const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(
        segment
      )
      const hasKorean = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(segment)
      const hasEnglish = /[a-zA-Z]/.test(segment)

      if (hasJapanese) {
        // Use intelligent segmentation for Japanese text
        const words = segmentJapaneseText(segment)

        // Japanese is target language if user is learning Japanese
        const isTargetLanguage = targetLanguage === 'Japanese'

        return (
          <span key={segmentIndex}>
            {words.map((wordObj, wordIndex) => {
              const { text } = wordObj

              // Check if this Japanese word came from translation (should be highlighted differently)
              const isTranslatedWord =
                /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text) &&
                text.length > 1

              return (
                <span
                  key={`${segmentIndex}-${wordIndex}`}
                  className={
                    isTranslatedWord
                      ? "cursor-pointer hover:bg-orange-200 border-b-2 border-orange-400 hover:border-orange-600 rounded px-1 py-0.5 transition-all duration-200 inline-block font-medium bg-orange-50"
                      : "cursor-pointer hover:bg-yellow-200 hover:shadow-sm border-b-2 border-yellow-400 hover:border-orange-400 rounded px-1 py-0.5 transition-all duration-200 inline-block bg-yellow-50"
                  }
                  onClick={(e) => handleWordClick(text, isTargetLanguage, text, e)}
                  title={
                    isTranslatedWord
                      ? `🇯🇵 Japanese: Click to see English "${text}"`
                      : `Click to learn: ${text}`
                  }
                  style={{ textDecoration: "none" }}
                >
                  {text}
                </span>
              )
            })}
          </span>
        )
      } else if (hasKorean) {
        // Korean text - make it clickable
        // Korean is target language if user is learning Korean
        const isTargetLanguage = targetLanguage === 'Korean'

        return (
          <span key={segmentIndex}>
            <span
              className="cursor-pointer hover:bg-orange-200 border-b-2 border-orange-400 hover:border-orange-600 rounded px-1 py-0.5 transition-all duration-200 inline-block font-medium bg-orange-50"
              onClick={(e) => handleWordClick(segment, isTargetLanguage, segment, e)}
              title={`🇰🇷 Korean: Click to see English "${segment}"`}
              style={{ textDecoration: "none" }}
            >
              {segment}
            </span>
          </span>
        )
      } else if (hasEnglish) {
        // MODIFIED: ALL English words are now clickable with consistent styling
        const cleanWord = segment.trim().replace(/[.,!?;:"'()[\]{}—–-]/g, "")

        // Skip if empty after cleaning
        if (!cleanWord) {
          return <span key={segmentIndex}>{segment}</span>
        }

        const isVocabularyWord =
          vocabularyService.isValidVocabularyWord(cleanWord)

        // Use consistent amber styling for ALL words (vocabulary or not)
        const vocabularyClasses = "cursor-pointer hover:bg-amber-200 border-b-2 border-amber-400 hover:border-amber-600 rounded px-1 py-0.5 transition-all duration-200 font-medium bg-amber-50"

        const vocabularyTitle = `Click to translate: "${cleanWord}"`

        return (
          <span key={segmentIndex}>
            <span
              className={vocabularyClasses}
              onClick={(e) => handleWordClick(cleanWord, false, text, e)}
              title={vocabularyTitle}
              style={{ textDecoration: "none" }}
            >
              {segment}
            </span>
          </span>
        )
      }

      return <span key={segmentIndex}>{segment}</span>
    })
  }
}
