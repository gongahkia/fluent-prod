import { BookOpen } from "lucide-react"
import React from "react"
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
  onMastered,
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

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {isTranslating ? (
          <div className="text-center py-8">
            <LoadingSpinner size="lg" text="Translating..." />
          </div>
        ) : !feedbackMessage ? (
          <div className="text-center">
            {/* Word Display - handles both target language and English words bidirectionally */}
            <div className="mb-4">
              {userProfile?.targetLanguage === 'Korean' ? (
                // Korean mode
                selectedWord.showKoreanTranslation ? (
                  // English word clicked -> show Korean translation
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
                      Korean translation:
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="text-3xl font-bold text-gray-900">
                        {selectedWord.korean}
                      </div>
                      <PronunciationButton
                        text={selectedWord.korean}
                        language="Korean"
                      />
                    </div>
                    {selectedWord.romanization && (
                      <div className="text-lg text-gray-600 mb-2">
                        {selectedWord.romanization}
                      </div>
                    )}
                  </>
                ) : (
                  // Korean word clicked -> show English translation
                  <>
                    <div className="text-sm text-gray-500 mb-1">
                      Korean word:
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="text-3xl font-bold text-gray-900">
                        {selectedWord.korean}
                      </div>
                      <PronunciationButton
                        text={selectedWord.korean}
                        language="Korean"
                      />
                    </div>
                    {selectedWord.romanization && selectedWord.romanization !== selectedWord.korean && (
                      <div className="text-lg text-gray-600 mb-2">
                        {selectedWord.romanization}
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
              ) : (
                // Japanese mode
                selectedWord.showJapaneseTranslation ? (
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
              )}
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
                    📚 Vocabulary Word
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
                      🌐 Live Translation
                    </span>
                  )}
                {selectedWord.isApiFallback && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    ⚠️ Basic Translation
                  </span>
                )}
              </div>
            )}

            {/* Context section removed as requested */}

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                className="w-full bg-amber-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-amber-600 transition-colors"
                onClick={onMastered}
              >
                Mastered! ✨
              </button>
              <button
                className="w-full bg-orange-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-orange-600 transition-colors flex items-center justify-center space-x-1"
                onClick={onAddToDictionary}
              >
                <BookOpen className="w-4 h-4" />
                <span>Add to My Dictionary</span>
              </button>
            </div>

            {/* Dictionary Status */}
            {(() => {
              let wordToCheck, isInDictionary;

              if (userProfile?.targetLanguage === 'Korean') {
                wordToCheck = selectedWord.showKoreanTranslation
                  ? selectedWord.english
                  : selectedWord.korean
                isInDictionary = userDictionary.some(
                  (word) => word.korean === wordToCheck
                )
              } else {
                wordToCheck = selectedWord.showJapaneseTranslation
                  ? selectedWord.english
                  : selectedWord.japanese
                isInDictionary = userDictionary.some(
                  (word) => word.japanese === wordToCheck
                )
              }

              return (
                isInDictionary && (
                  <div className="mt-3 text-sm text-amber-600 flex items-center justify-center space-x-1">
                    <span>✓</span>
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
    </div>
  )
}

export default WordLearningPopup
