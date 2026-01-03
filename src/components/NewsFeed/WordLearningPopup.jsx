import { BookOpen, Check } from "lucide-react"
import React, { useEffect, useMemo, useState } from "react"
import LoadingSpinner from "../ui/LoadingSpinner"
import { PronunciationButton } from "../ui/PronunciationButton"

const WordLearningPopup = ({
  selectedWord,
  isTranslating,
  feedbackMessage,
  userProfile,
  userDictionary,
  onClose,
  onAddToDictionary,
}) => {
  // Map 1-5 levels to names
  const levelNames = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Native']
  const getLevelName = (level) => {
    return levelNames[level - 1] || 'Beginner'
  }

  const getLevelColor = (level) => {
    if (level === 1) return "bg-amber-500"  // Beginner
    if (level === 2) return "bg-orange-500"   // Intermediate
    if (level === 3) return "bg-yellow-500" // Advanced
    if (level === 4) return "bg-orange-500" // Expert
    return "bg-red-500"                      // Native
  }

  const anchorEl = selectedWord?.clickPosition?.anchorEl || null
  const [anchorRect, setAnchorRect] = useState(null)

  useEffect(() => {
    if (!anchorEl) {
      setAnchorRect(null)
      return
    }

    let raf = 0

    const update = () => {
      raf = 0
      // If the anchor is gone (virtualized out / unmounted), close the popup.
      if (!document.contains(anchorEl)) {
        onClose?.()
        return
      }
      setAnchorRect(anchorEl.getBoundingClientRect())
    }

    const schedule = () => {
      if (raf) return
      raf = window.requestAnimationFrame(update)
    }

    // Prime immediately
    schedule()

    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)

    return () => {
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [anchorEl, onClose])

  // Calculate popup position based on click position
  const getPopupPosition = () => {
    const fallbackRect = selectedWord?.clickPosition?.elementRect || null
    const rect = anchorRect || fallbackRect

    if (!rect) {
      // Fallback to center if no position data
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }
    }

    const popupWidth = 320
    const popupMaxHeight = 400
    const gap = 12
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Account for safe areas on mobile devices (notches, rounded corners)
    // and any sticky top navigation/header so the popup never covers it.
    const stickyTopEl = document.querySelector('.sticky.top-0')
    const stickyTopHeight = stickyTopEl
      ? Math.ceil(stickyTopEl.getBoundingClientRect().height || 0)
      : 0

    const safeAreaTop = 20 + stickyTopHeight
    const safeAreaBottom = 64 // Account for mobile bottom bar (h-16 = 64px) + safe area

    let top, left
    let transformOrigin = 'top center'
    let positionAbove = false

    // Position below the clicked element by default
    top = rect.bottom + gap

    // If popup would go off bottom of viewport (accounting for safe area), position above instead
    if (rect.bottom + gap + popupMaxHeight > viewportHeight - safeAreaBottom) {
      top = rect.top - gap
      transformOrigin = 'bottom center'
      positionAbove = true
    }

    // If positioning above would go off top (accounting for safe area), adjust
    if (positionAbove && rect.top - gap - popupMaxHeight < safeAreaTop) {
      // Not enough space above either, position below with limited height
      top = rect.bottom + gap
      positionAbove = false
      transformOrigin = 'top center'
    }

    // Center horizontally on the clicked element
    left = rect.left + (rect.width / 2)

    // Adjust if too far right
    if (rect.left + (popupWidth / 2) > viewportWidth - 20) {
      left = viewportWidth - popupWidth - 20
    }

    // Adjust if too far left
    if (rect.left - (popupWidth / 2) < 20) {
      left = 20 + (popupWidth / 2)
    }

    // Calculate available height accounting for safe areas
    const availableHeight = viewportHeight - safeAreaTop - safeAreaBottom - gap * 2
    const maxPopupHeight = Math.min(popupMaxHeight, availableHeight)

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      transform: positionAbove ? 'translate(-50%, -100%)' : 'translateX(-50%)',
      transformOrigin,
      maxHeight: `${maxPopupHeight}px`
    }
  }

  const popupStyle = getPopupPosition()

  return (
    <>
      {/* Invisible backdrop for click-outside-to-close */}
      <div
        className="fixed inset-0 z-30"
        onClick={onClose}
      />

      {/* Anchored popup */}
      <div
        className="bg-white rounded-lg shadow-2xl border-2 border-orange-400 p-6 z-40 overflow-y-auto"
        style={{
          ...popupStyle,
          width: '320px',
          animation: 'scaleIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {isTranslating ? (
          <div className="text-center py-8">
            <LoadingSpinner size="lg" showRandomWords={true} />
          </div>
        ) : !feedbackMessage ? (
          <div className="text-center">
            {/* Word Display - handles both target language and English words bidirectionally */}
            <div className="mb-4">
              {selectedWord.showJapaneseTranslation ? (
                  // English word clicked -> show Japanese translation
                  <>
                    <div className="text-sm text-gray-500 mb-1">
                      English word:
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="text-2xl font-bold text-orange-600">
                        {selectedWord.english}
                      </div>
                      <PronunciationButton
                        text={selectedWord.english}
                        language="English"
                      />
                    </div>
                    <div className="text-sm text-gray-500 mb-1">
                      Japanese translation:
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="text-3xl font-bold text-gray-900">
                        {selectedWord.japanese}
                      </div>
                      <PronunciationButton
                        text={selectedWord.japanese}
                        language="Japanese"
                      />
                    </div>
                    <div className="text-lg text-gray-600 mb-2">
                      {selectedWord.hiragana}
                    </div>
                  </>
                ) : (
                  // Japanese word clicked -> show English translation
                  <>
                    <div className="text-sm text-gray-500 mb-1">
                      Japanese word:
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="text-3xl font-bold text-gray-900">
                        {selectedWord.japanese}
                      </div>
                      <PronunciationButton
                        text={selectedWord.japanese}
                        language="Japanese"
                      />
                    </div>
                    {selectedWord.hiragana !== selectedWord.japanese && (
                      <div className="text-lg text-gray-600 mb-2">
                        {selectedWord.hiragana}
                      </div>
                    )}
                    <div className="text-sm text-gray-500 mb-1">
                      English translation:
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="text-2xl font-bold text-amber-600">
                        {selectedWord.english}
                      </div>
                      <PronunciationButton
                        text={selectedWord.english}
                        language="English"
                      />
                    </div>
                  </>
                )
              }
            </div>

            {/* Level Badge */}
            {selectedWord.level && (
              <div className="mb-4 flex items-center space-x-2">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-white text-sm font-medium ${getLevelColor(selectedWord.level)}`}
                >
                  {getLevelName(selectedWord.level)}
                </span>
                {selectedWord.isVocabulary && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                    Vocabulary Word
                  </span>
                )}
                {selectedWord.wordType && (
                  <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
                    {selectedWord.wordType}
                  </span>
                )}
                {selectedWord.isApiTranslated &&
                  !selectedWord.isVocabulary && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                      Live Translation
                    </span>
                  )}
                {selectedWord.isApiFallback && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Basic Translation
                  </span>
                )}
              </div>
            )}

            {/* Context section removed as requested */}

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                className="w-full bg-orange-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-orange-600 transition-colors flex items-center justify-center space-x-1"
                onClick={onAddToDictionary}
              >
                <BookOpen className="w-4 h-4" />
                <span>Save Word</span>
              </button>
            </div>

            {/* Dictionary Status */}
            {(() => {
              const wordToCheck = selectedWord.showJapaneseTranslation
                ? selectedWord.english
                : selectedWord.japanese
              const isInDictionary = userDictionary.some(
                (word) => word.japanese === wordToCheck
              )

              return (
                isInDictionary && (
                  <div className="mt-3 text-sm text-amber-600 flex items-center justify-center space-x-1">
                    <Check className="w-4 h-4" />
                    <span>Already in your dictionary</span>
                  </div>
                )
              )
            })()}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">{feedbackMessage.icon}</div>
            <div className="text-xl font-semibold text-gray-900">
              {feedbackMessage.message}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default WordLearningPopup
