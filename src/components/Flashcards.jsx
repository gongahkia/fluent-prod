import {
  ArrowLeft,
  BookOpen,
  RotateCcw,
  Settings,
  Shuffle,
} from "lucide-react"
import React, { useEffect, useState } from "react"
import {
  getLanguageByName,
  getLevelColor,
  getLevelName,
} from "@config/languages"
import { useAuth } from "@/contexts/AuthContext"
import {
  getFlashcardProgress,
  migrateFlashcardData,
  saveFlashcardProgress,
} from "@/services/databaseService"
import { PronunciationButton } from "./ui/PronunciationButton"

const Flashcards = ({ userDictionary, onUpdateWord, userProfile, onBack }) => {
  // Get language configuration
  const targetLanguage = userProfile?.targetLanguage || "Japanese"
  const languageConfig = getLanguageByName(targetLanguage)
  const langLabels = languageConfig.uiLabels
  const langFields = languageConfig.dictionaryFields
  const { currentUser } = useAuth()

  // Helper function to clean {{WORD:X}} markers from example sentences
  const cleanExampleText = (text) => {
    if (!text) return ""
    // Remove all {{WORD:X}} or {{word:X}} markers, leaving the surrounding text intact
    return text.replace(/\{\{(WORD|word):\s*\d+\}\}\s*/g, "")
  }

  const [quizStarted, setQuizStarted] = useState(false)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [cardData, setCardData] = useState({})
  const [studyMode, setStudyMode] = useState("all") // 'all', 'new', 'review', 'due'
  const [showSettings, setShowSettings] = useState(false)
  const [shuffledWords, setShuffledWords] = useState([])
  const [keybinds, setKeybinds] = useState({
    showAnswer: " ",
    again: "1",
    hard: "2",
    good: "3",
    easy: "4",
  })

  // Spaced repetition algorithm (SM-2 simplified)
  const calculateNextReview = (cardInfo, rating) => {
    const now = new Date()
    let interval = cardInfo?.interval || 0
    let easeFactor = cardInfo?.easeFactor || 2.5
    let repetitions = cardInfo?.repetitions || 0

    switch (rating) {
      case "again":
        interval = 0
        repetitions = 0
        easeFactor = Math.max(1.3, easeFactor - 0.2)
        break
      case "hard":
        interval = interval === 0 ? 1 : Math.max(interval * 1.2, interval + 1)
        repetitions += 1
        easeFactor = Math.max(1.3, easeFactor - 0.15)
        break
      case "good":
        if (repetitions === 0) {
          interval = 1
        } else if (repetitions === 1) {
          interval = 6
        } else {
          interval = Math.round(interval * easeFactor)
        }
        repetitions += 1
        break
      case "easy":
        if (repetitions === 0) {
          interval = 4
        } else {
          interval = Math.round(interval * easeFactor * 1.3)
        }
        repetitions += 1
        easeFactor = easeFactor + 0.15
        break
      default:
        break
    }

    const nextReview = new Date(now)
    nextReview.setDate(nextReview.getDate() + Math.round(interval))

    return {
      interval,
      easeFactor,
      repetitions,
      lastReviewed: now.toISOString(),
      nextReview: nextReview.toISOString(),
    }
  }

  // Initialize card data from database
  useEffect(() => {
    if (!currentUser) return

    const loadFlashcardData = async () => {
      // Try to migrate localStorage data first (one-time migration)
      await migrateFlashcardData(currentUser.id)

      // Load flashcard progress from database
      const result = await getFlashcardProgress(currentUser.id)
      if (result.success) {
        setCardData(result.data)
      }
    }

    loadFlashcardData()
  }, [currentUser])

  // Shuffle array using Fisher-Yates algorithm
  const shuffleArray = (array) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Convert user dictionary to flashcard format
  const createFlashcardsFromDictionary = () => {
    if (!userDictionary || userDictionary.length === 0) {
      return []
    }

    return userDictionary.map((word) => ({
      id: word.id,
      word: word[langFields.word] || word.japanese || word.korean || "",
      reading:
        word[langFields.reading] || word.hiragana || word.romanization || "",
      meaning: word[langFields.meaning] || word.english || "",
      example: word.example,
      exampleTranslation: word.exampleEn,
      level: word.level,
      source: word.source,
      dateAdded: word.dateAdded,
      cardInfo: cardData[word.id] || {
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        lastReviewed: null,
        nextReview: new Date().toISOString(),
      },
    }))
  }

  const allFlashcards = createFlashcardsFromDictionary()

  // Filter flashcards based on study mode
  const getFilteredFlashcards = () => {
    const now = new Date()

    switch (studyMode) {
      case "new": {
        // Words never studied before
        return allFlashcards.filter(
          (card) => !cardData[card.id] || cardData[card.id].repetitions === 0
        )
      }
      case "review": {
        // Words currently being reviewed (not mastered)
        return allFlashcards.filter(
          (card) =>
            cardData[card.id] &&
            cardData[card.id].repetitions > 0 &&
            cardData[card.id].interval < 21 // Not mastered (< 3 weeks)
        )
      }
      case "due": {
        // Words that are due for review
        return allFlashcards.filter((card) => {
          if (!cardData[card.id]) return true // New cards are always due
          const nextReview = new Date(cardData[card.id].nextReview)
          return nextReview <= now
        })
      }
      default:
        return allFlashcards
    }
  }

  const handleStartQuiz = () => {
    const filtered = getFilteredFlashcards()
    const shuffled = shuffleArray(filtered)
    setShuffledWords(shuffled)
    setQuizStarted(true)
    setCurrentCardIndex(0)
    setShowAnswer(false)
  }

  const handleBackToStart = () => {
    setQuizStarted(false)
    setCurrentCardIndex(0)
    setShowAnswer(false)
    setShuffledWords([])
  }

  const flashcards = quizStarted ? shuffledWords : []
  const currentCard = flashcards[currentCardIndex]

  const handleRating = async (rating) => {
    if (!currentCard || !currentUser) return

    const updatedInfo = calculateNextReview(currentCard.cardInfo, rating)
    const newCardData = {
      ...cardData,
      [currentCard.id]: updatedInfo,
    }

    setCardData(newCardData)

    // Save to database
    await saveFlashcardProgress(currentUser.id, currentCard.id, updatedInfo)

    // Update word in dictionary if callback provided
    if (onUpdateWord) {
      onUpdateWord(currentCard.id, { reviewData: updatedInfo })
    }

    handleNext()
  }

  const handleNext = () => {
    if (flashcards.length === 0) return
    setShowAnswer(false)
    setCurrentCardIndex((prev) => (prev + 1) % flashcards.length)
  }

  const handleStudyModeChange = (newMode) => {
    setStudyMode(newMode)
    if (quizStarted) {
      // Restart quiz with new mode
      handleBackToStart()
    }
  }

  const resetProgress = async () => {
    if (
      confirm(
        "Are you sure you want to reset all progress? This cannot be undone."
      )
    ) {
      setCardData({})
      setCurrentCardIndex(0)
      setShowAnswer(false)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return

      if (!quizStarted) return

      if (!showAnswer && e.key === keybinds.showAnswer) {
        setShowAnswer(true)
        e.preventDefault()
      } else if (showAnswer) {
        if (e.key === keybinds.again) {
          handleRating("again")
          e.preventDefault()
        } else if (e.key === keybinds.hard) {
          handleRating("hard")
          e.preventDefault()
        } else if (e.key === keybinds.good) {
          handleRating("good")
          e.preventDefault()
        } else if (e.key === keybinds.easy) {
          handleRating("easy")
          e.preventDefault()
        }
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [showAnswer, keybinds, currentCard, quizStarted])

  // Get statistics
  const getStats = () => {
    const total = allFlashcards.length
    const newCards = allFlashcards.filter(
      (card) => !cardData[card.id] || cardData[card.id].repetitions === 0
    ).length
    const learning = allFlashcards.filter(
      (card) =>
        cardData[card.id] &&
        cardData[card.id].repetitions > 0 &&
        cardData[card.id].interval < 21
    ).length
    const mature = allFlashcards.filter(
      (card) => cardData[card.id] && cardData[card.id].interval >= 21
    ).length

    return { total, newCards, learning, mature }
  }

  const stats = getStats()

  // Show initial view with Start Quiz button
  if (!quizStarted) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
                title="Back to Saved Words"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Practice Quiz</h1>
              <p className="text-sm text-gray-600 mt-1">
                Test yourself on all your saved words
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Your Progress
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.total}
              </div>
              <div className="text-xs text-gray-600">Total Words</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {stats.newCards}
              </div>
              <div className="text-xs text-gray-600">New</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {stats.learning}
              </div>
              <div className="text-xs text-gray-600">Learning</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">
                {stats.mature}
              </div>
              <div className="text-xs text-gray-600">Mature</div>
            </div>
          </div>
        </div>

        {/* Study Mode Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Study Mode
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => handleStudyModeChange("due")}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                studyMode === "due"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <div className="font-bold">Due</div>
              <div className="text-xs opacity-90">
                {
                  allFlashcards.filter((card) => {
                    if (!cardData[card.id]) return true
                    const nextReview = new Date(cardData[card.id].nextReview)
                    return nextReview <= new Date()
                  }).length
                }{" "}
                words
              </div>
            </button>
            <button
              onClick={() => handleStudyModeChange("new")}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                studyMode === "new"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <div className="font-bold">New</div>
              <div className="text-xs opacity-90">{stats.newCards} words</div>
            </button>
            <button
              onClick={() => handleStudyModeChange("review")}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                studyMode === "review"
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <div className="font-bold">Review</div>
              <div className="text-xs opacity-90">{stats.learning} words</div>
            </button>
            <button
              onClick={() => handleStudyModeChange("all")}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                studyMode === "all"
                  ? "bg-amber-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <div className="font-bold">All</div>
              <div className="text-xs opacity-90">{stats.total} words</div>
            </button>
          </div>
        </div>

        {/* Start Quiz Button */}
        {getFilteredFlashcards().length > 0 ? (
          <div className="text-center">
            <button
              onClick={handleStartQuiz}
              className="inline-flex items-center gap-3 px-8 py-4 bg-orange-600 text-white rounded-lg font-medium text-lg hover:bg-orange-700 transition-colors shadow-lg"
            >
              <Shuffle className="w-6 h-6" />
              Start Random Quiz ({getFilteredFlashcards().length} words)
            </button>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {stats.total === 0
                ? "No Saved Words Yet"
                : studyMode === "new"
                  ? "No New Words"
                  : studyMode === "due"
                    ? "No Cards Due!"
                    : studyMode === "review"
                      ? "No Words to Review"
                      : "No Words Available"}
            </h3>
            <p className="text-gray-600">
              {stats.total === 0
                ? "Start saving words from the learning feed to practice!"
                : studyMode === "new"
                  ? "All words have been studied at least once."
                  : studyMode === "due"
                    ? "Great job! You're all caught up for today."
                    : studyMode === "review"
                      ? "No words are currently in review."
                      : "Try selecting a different study mode."}
            </p>
          </div>
        )}
      </div>
    )
  }

  // Show flashcard study UI when quiz is started
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Practice Quiz</h1>
            <p className="text-sm text-gray-600">
              {studyMode === "all"
                ? "All words"
                : studyMode === "new"
                  ? "New words"
                  : studyMode === "due"
                    ? "Due for review"
                    : "Review"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={resetProgress}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm">Reset</span>
            </button>
            <button
              onClick={onBack || handleBackToStart}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Exit Quiz
            </button>
          </div>
        </div>
      </div>

      <div>
        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Keyboard Shortcuts
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Show Answer</span>
                  <input
                    type="text"
                    value={keybinds.showAnswer}
                    onChange={(e) =>
                      setKeybinds({ ...keybinds, showAnswer: e.target.value })
                    }
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                    maxLength="1"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Again</span>
                  <input
                    type="text"
                    value={keybinds.again}
                    onChange={(e) =>
                      setKeybinds({ ...keybinds, again: e.target.value })
                    }
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                    maxLength="1"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Hard</span>
                  <input
                    type="text"
                    value={keybinds.hard}
                    onChange={(e) =>
                      setKeybinds({ ...keybinds, hard: e.target.value })
                    }
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                    maxLength="1"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Good</span>
                  <input
                    type="text"
                    value={keybinds.good}
                    onChange={(e) =>
                      setKeybinds({ ...keybinds, good: e.target.value })
                    }
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                    maxLength="1"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Easy</span>
                  <input
                    type="text"
                    value={keybinds.easy}
                    onChange={(e) =>
                      setKeybinds({ ...keybinds, easy: e.target.value })
                    }
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                    maxLength="1"
                  />
                </div>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="mt-6 w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {flashcards.length > 0 ? (
          <>
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Card {currentCardIndex + 1} of {flashcards.length}
                </span>
                {currentCard.cardInfo.nextReview && (
                  <span className="text-sm text-gray-500">
                    Next review:{" "}
                    {new Date(
                      currentCard.cardInfo.nextReview
                    ).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentCardIndex + 1) / flashcards.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Flashcard */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 mb-6 min-h-96 flex flex-col justify-center">
              <div className="text-center">
                <div className="mb-4 flex items-center justify-center gap-2">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-white text-sm font-medium ${getLevelColor(languageConfig.id, currentCard.level)}`}
                  >
                    {getLevelName(languageConfig.id, currentCard.level)}
                  </span>
                  {currentCard.cardInfo.interval > 0 && (
                    <span className="inline-block px-3 py-1 rounded-full bg-gray-200 text-gray-700 text-sm font-medium">
                      Interval: {Math.round(currentCard.cardInfo.interval)}d
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <h2 className="text-5xl font-bold text-gray-900">
                      {currentCard.word}
                    </h2>
                    <PronunciationButton
                      text={currentCard.word}
                      language={targetLanguage}
                      size="lg"
                    />
                  </div>
                  <p className="text-xl text-gray-600">{currentCard.reading}</p>
                </div>

                {showAnswer ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <div className="text-3xl font-semibold text-orange-600">
                        {currentCard.meaning}
                      </div>
                      <PronunciationButton
                        text={currentCard.meaning}
                        language="English"
                        size="default"
                      />
                    </div>
                    {currentCard.example && (
                      <div className="bg-gray-50 rounded-lg p-4 mt-4">
                        <div className="flex items-start gap-2 mb-2">
                          <p className="text-gray-800 flex-1">
                            {cleanExampleText(currentCard.example)}
                          </p>
                          <PronunciationButton
                            text={cleanExampleText(currentCard.example)}
                            language={targetLanguage}
                            size="sm"
                          />
                        </div>
                        {currentCard.exampleTranslation && (
                          <div className="flex items-start gap-2">
                            <p className="text-gray-600 text-sm flex-1">
                              {cleanExampleText(currentCard.exampleTranslation)}
                            </p>
                            <PronunciationButton
                              text={cleanExampleText(currentCard.exampleTranslation)}
                              language="English"
                              size="sm"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAnswer(true)}
                    className="bg-orange-600 text-white px-8 py-4 rounded-lg font-medium hover:bg-orange-700 transition-colors text-lg"
                  >
                    Show Answer ({keybinds.showAnswer})
                  </button>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-3">
              {showAnswer ? (
                <>
                  <button
                    onClick={() => handleRating("again")}
                    className="flex-1 max-w-xs bg-red-500 text-white px-4 py-4 rounded-lg font-medium hover:bg-red-600 transition-colors"
                  >
                    <div className="text-lg font-bold">Again</div>
                    <div className="text-xs opacity-90">
                      &lt;10m ({keybinds.again})
                    </div>
                  </button>
                  <button
                    onClick={() => handleRating("hard")}
                    className="flex-1 max-w-xs bg-orange-500 text-white px-4 py-4 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                  >
                    <div className="text-lg font-bold">Hard</div>
                    <div className="text-xs opacity-90">
                      {currentCard.cardInfo.interval === 0
                        ? "1d"
                        : `${Math.round(currentCard.cardInfo.interval * 1.2)}d`}{" "}
                      ({keybinds.hard})
                    </div>
                  </button>
                  <button
                    onClick={() => handleRating("good")}
                    className="flex-1 max-w-xs bg-amber-500 text-white px-4 py-4 rounded-lg font-medium hover:bg-amber-600 transition-colors"
                  >
                    <div className="text-lg font-bold">Good</div>
                    <div className="text-xs opacity-90">
                      {currentCard.cardInfo.repetitions === 0
                        ? "1d"
                        : currentCard.cardInfo.repetitions === 1
                          ? "6d"
                          : `${Math.round(currentCard.cardInfo.interval * currentCard.cardInfo.easeFactor)}d`}{" "}
                      ({keybinds.good})
                    </div>
                  </button>
                  <button
                    onClick={() => handleRating("easy")}
                    className="flex-1 max-w-xs bg-orange-500 text-white px-4 py-4 rounded-lg font-medium hover:bg-orange-600 transition-colors"
                  >
                    <div className="text-lg font-bold">Easy</div>
                    <div className="text-xs opacity-90">
                      {currentCard.cardInfo.repetitions === 0
                        ? "4d"
                        : `${Math.round(currentCard.cardInfo.interval * currentCard.cardInfo.easeFactor * 1.3)}d`}{" "}
                      ({keybinds.easy})
                    </div>
                  </button>
                </>
              ) : (
                <div className="text-center text-gray-500 text-sm">
                  <p>
                    Press{" "}
                    <kbd className="px-2 py-1 bg-gray-200 rounded">
                      {keybinds.showAnswer}
                    </kbd>{" "}
                    to reveal answer
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🃏</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Words to Practice
            </h3>
            <p className="text-gray-600 mb-4">
              Save some words from the learning feed to start practicing!
            </p>
            <button
              onClick={handleBackToStart}
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Flashcards
