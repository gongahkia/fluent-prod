import React from "react"
import vocabularyService from "../../services/vocabularyService"
import { decodeHTMLEntities, segmentJapaneseText } from "./utils/textParsing"

// Parse markdown-style links and format text
export const parseMarkdownContent = (text, postId = null, renderClickableText) => {
  if (!text) return ""

  // Decode HTML entities
  let cleaned = decodeHTMLEntities(text)

  // Check if content is JSON from translation service - handle it directly without splitting
  try {
    if (cleaned.trim().startsWith("{") && cleaned.includes('"wordMetadata"')) {
      const parsedData = JSON.parse(cleaned)
      if (parsedData.text && parsedData.wordMetadata) {
        // This is translation service JSON - render it directly with renderClickableText
        return renderClickableText(cleaned, postId)
      }
    }
  } catch (e) {
    // Not JSON or invalid JSON, continue with normal markdown parsing
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

    // Check for Reddit quote (starts with >)
    if (line.trim().startsWith('&gt;') || line.trim().startsWith('>')) {
      const quoteLine = line.replace(/^(&gt;|>)\s*/, '')
      elements.push(
        <div key={`quote-${lineIndex}`} className="border-l-4 border-gray-300 pl-4 py-1 my-2 text-gray-600 italic">
          {parseLineContent(quoteLine, postId, renderClickableText)}
        </div>
      )
      return
    }

    // Regular line
    elements.push(
      <span key={`line-${lineIndex}`}>
        {parseLineContent(line, postId, renderClickableText)}
        {lineIndex < lines.length - 1 && <br />}
      </span>
    )
  })

  return elements
}

// Parse inline content (links, bold, etc.) within a line - WITH clickable words
export const parseLineContent = (text, postId = null, renderClickableText) => {
  const parts = []
  let keyCounter = 0

  // Match markdown links [text](url) and plain URLs
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)|(https?:\/\/[^\s]+)/g
  let lastIndex = 0
  let match

  while ((match = linkRegex.exec(text)) !== null) {
    // Add text before match - make it clickable for translation
    if (match.index > lastIndex) {
      const textBeforeLink = text.substring(lastIndex, match.index)
      parts.push(
        <span key={`text-${keyCounter++}`}>
          {renderClickableText(textBeforeLink, postId)}
        </span>
      )
    }

    if (match[1] && match[2]) {
      // Markdown link [text](url)
      parts.push(
        <a
          key={`link-${keyCounter++}`}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {match[1]}
        </a>
      )
    } else if (match[3]) {
      // Plain URL
      parts.push(
        <a
          key={`link-${keyCounter++}`}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {match[3]}
        </a>
      )
    }

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
export const createRenderClickableText = (translationStates, toggleTranslation, handleWordClick, targetLanguage = 'Japanese') => {
  return (text, postId = null) => {
    if (!text) return ""

    // Check if text is JSON from translation service
    let parsedData = null
    try {
      if (text.startsWith("{") && text.includes('"wordMetadata"')) {
        parsedData = JSON.parse(text)
      }
    } catch (e) {
      // Not JSON, continue with normal processing
    }

    if (parsedData && parsedData.text && parsedData.wordMetadata) {
      // Process text with word metadata
      const parts = []
      let remainingText = parsedData.text
      let lastIndex = 0

      // Sort metadata by index to process in order
      const sortedMetadata = [...parsedData.wordMetadata].sort((a, b) => a.index - b.index)

      for (const wordData of sortedMetadata) {
        const marker = `{{WORD:${wordData.index}}}`
        const markerIndex = remainingText.indexOf(marker, lastIndex)

        if (markerIndex === -1) continue

        // Add text before this marker
        if (markerIndex > lastIndex) {
          parts.push(remainingText.substring(lastIndex, markerIndex))
        }

        // Check if this word has been toggled
        const stateKey = postId ? `${postId}-${wordData.index}` : null
        const isToggled = stateKey ? translationStates[stateKey] : false

        // Determine what to show based on target language
        // wordData.showJapanese/showKorean indicates this is an ENGLISH word that can be translated to Japanese/Korean
        const showTargetLang = wordData.showJapanese || wordData.showKorean
        const isShowingTargetLang = isToggled ? !showTargetLang : showTargetLang
        const displayText = isShowingTargetLang ? wordData.translation : wordData.original

        // Determine language flag
        const targetLangFlag = wordData.showKorean ? '🇰🇷' : '🇯🇵'
        const targetLangName = wordData.showKorean ? 'Korean' : 'Japanese'

        parts.push(
          <span
            key={`word-${wordData.index}`}
            className="cursor-pointer hover:bg-green-200 border-b-2 border-green-400 hover:border-green-600 rounded px-1 py-0.5 transition-all duration-200 font-medium bg-green-50"
            onClick={() => {
              if (postId) toggleTranslation(postId, wordData.index)
              // When clicking, pass the ACTUAL language of the currently displayed text
              // If showing target lang (Korean/Japanese), the word IS in target lang -> translate to English
              // If showing English, the word is NOT in target lang -> translate to target lang
              handleWordClick(displayText, isShowingTargetLang, remainingText)
            }}
            title={
              isShowingTargetLang
                ? `${targetLangFlag} ${targetLangName}: Click to see English "${wordData.original}"`
                : `📚 English: Click to see ${targetLangName} "${wordData.translation}"`
            }
            style={{ textDecoration: "none" }}
          >
            {displayText}
          </span>
        )

        lastIndex = markerIndex + marker.length
      }

      // Add remaining text after last marker
      if (lastIndex < remainingText.length) {
        parts.push(remainingText.substring(lastIndex))
      }

      return parts.length > 0 ? parts : parsedData.text
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
                      ? "cursor-pointer hover:bg-blue-200 border-b-2 border-blue-400 hover:border-blue-600 rounded px-1 py-0.5 transition-all duration-200 inline-block font-medium bg-blue-50"
                      : "cursor-pointer hover:bg-yellow-200 hover:shadow-sm border-b-2 border-yellow-400 hover:border-orange-400 rounded px-1 py-0.5 transition-all duration-200 inline-block bg-yellow-50"
                  }
                  onClick={() => handleWordClick(text, isTargetLanguage, text)}
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
              className="cursor-pointer hover:bg-blue-200 border-b-2 border-blue-400 hover:border-blue-600 rounded px-1 py-0.5 transition-all duration-200 inline-block font-medium bg-blue-50"
              onClick={() => handleWordClick(segment, isTargetLanguage, segment)}
              title={`🇰🇷 Korean: Click to see English "${segment}"`}
              style={{ textDecoration: "none" }}
            >
              {segment}
            </span>
          </span>
        )
      } else if (hasEnglish) {
        // Enhanced English word handling with vocabulary detection
        const cleanWord = segment.trim().replace(/[.,!?;:"'()[\]{}—–-]/g, "")

        // Skip if empty after cleaning
        if (!cleanWord) {
          return <span key={segmentIndex}>{segment}</span>
        }

        const isVocabularyWord =
          vocabularyService.isValidVocabularyWord(cleanWord)

        // Different styling for vocabulary vs regular words
        const vocabularyClasses = isVocabularyWord
          ? "cursor-pointer hover:bg-green-200 border-b-2 border-green-400 hover:border-green-600 rounded px-1 py-0.5 transition-all duration-200 font-medium bg-green-50"
          : "cursor-pointer hover:bg-blue-100 hover:shadow-sm border-b border-transparent hover:border-blue-300 rounded px-1 py-0.5 transition-all duration-200"

        const vocabularyTitle = isVocabularyWord
          ? `📚 Vocabulary: Click to learn "${cleanWord}"`
          : `Click to translate: ${cleanWord}`

        return (
          <span key={segmentIndex}>
            <span
              className={vocabularyClasses}
              onClick={() => handleWordClick(cleanWord, false, text)}
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
