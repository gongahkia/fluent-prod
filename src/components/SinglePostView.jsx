import {
  X,
  Bookmark,
  MessageCircle,
  Share,
  UserCheck,
  UserPlus,
} from "lucide-react"
import React, { useState, useEffect, useCallback } from "react"
import { handleWordClick as sharedHandleWordClick } from "../lib/wordDatabase"
import translationService from "../services/translationService"
import EnhancedCommentSystem from "./EnhancedCommentSystem"
import WordLearningPopup from "./NewsFeed/WordLearningPopup"
import { createRenderClickableText, parseMarkdownContent } from "./NewsFeed/renderingUtils"
import { shouldTruncateContent, truncateContent } from "./NewsFeed/utils/textParsing"

const SinglePostView = ({
  post,
  userProfile,
  onAddWordToDictionary,
  userDictionary,
  onClose,
  onShare,
  onRemove,
}) => {
  const [selectedWord, setSelectedWord] = useState(null)
  const [feedbackMessage, setFeedbackMessage] = useState(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationStates, setTranslationStates] = useState({})
  const [expandedPost, setExpandedPost] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [processedPost, setProcessedPost] = useState(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)

  // Process post with mixed language content based on user level
  const processPostWithMixedLanguage = useCallback(async () => {
    if (!post || !userProfile?.learningLevel) {
      setProcessedPost(post)
      setIsProcessing(false)
      return
    }

    setIsProcessing(true)
    const targetLangCode = userProfile.targetLanguage === 'Korean' ? 'ko' : 'ja'

    try {
      // Check if post already contains target language
      const titleContainsTargetLang = translationService.containsTargetLanguage(post.title, targetLangCode)
      const contentContainsTargetLang = post.content && translationService.containsTargetLanguage(post.content, targetLangCode)

      // Process title and content
      const processedTitle = titleContainsTargetLang
        ? post.title
        : await translationService.createMixedLanguageContent(
            post.title,
            userProfile.learningLevel,
            targetLangCode
          )

      const processedContent =
        post.content && !contentContainsTargetLang
          ? await translationService.createMixedLanguageContent(
              post.content,
              userProfile.learningLevel,
              targetLangCode
            )
          : post.content

      setProcessedPost({
        ...post,
        originalTitle: post.title,
        originalContent: post.content,
        title: processedTitle,
        content: processedContent,
        isMixedLanguage: true,
      })
    } catch (error) {
      console.warn("Failed to process post for mixed language:", error)
      setProcessedPost({
        ...post,
        originalTitle: post.title,
        originalContent: post.content,
        isMixedLanguage: false,
      })
    } finally {
      setIsProcessing(false)
    }
  }, [post, userProfile?.learningLevel, userProfile?.targetLanguage])

  // Process post when component mounts or user profile changes
  useEffect(() => {
    processPostWithMixedLanguage()
  }, [processPostWithMixedLanguage])

  const showFeedback = (message, icon) => {
    setFeedbackMessage({ message, icon })
    setTimeout(() => {
      setFeedbackMessage(null)
      setSelectedWord(null)
    }, 2000)
  }

  const handleAddToDictionary = () => {
    if (selectedWord) {
      const targetLang = userProfile?.targetLanguage || 'Japanese'
      let wordToAdd

      if (targetLang === 'Korean') {
        if (selectedWord.showKoreanTranslation) {
          wordToAdd = {
            korean: selectedWord.english,
            romanization: selectedWord.romanization,
            english: selectedWord.korean,
            level: selectedWord.level,
            example: selectedWord.example,
            exampleEn: selectedWord.exampleEn,
            source: "Fluent Post",
          }
        } else {
          wordToAdd = {
            korean: selectedWord.korean,
            romanization: selectedWord.romanization,
            english: selectedWord.english,
            level: selectedWord.level,
            example: selectedWord.example,
            exampleEn: selectedWord.exampleEn,
            source: "Fluent Post",
          }
        }

        const exists = userDictionary.some(
          (word) => word.korean === wordToAdd.korean
        )

        if (!exists) {
          onAddWordToDictionary(wordToAdd)
          showFeedback("Added to dictionary! ✓", "📚")
        } else {
          showFeedback("Already in dictionary!", "📖")
        }
      } else {
        if (selectedWord.showJapaneseTranslation) {
          wordToAdd = {
            japanese: selectedWord.english,
            hiragana: selectedWord.hiragana,
            english: selectedWord.japanese,
            level: selectedWord.level,
            example: selectedWord.example,
            exampleEn: selectedWord.exampleEn,
            source: "Fluent Post",
          }
        } else {
          wordToAdd = {
            japanese: selectedWord.japanese,
            hiragana: selectedWord.hiragana,
            english: selectedWord.english,
            level: selectedWord.level,
            example: selectedWord.example,
            exampleEn: selectedWord.exampleEn,
            source: "Fluent Post",
          }
        }

        const exists = userDictionary.some(
          (word) => word.japanese === wordToAdd.japanese
        )

        if (!exists) {
          onAddWordToDictionary(wordToAdd)
          showFeedback("Added to dictionary! ✓", "📚")
        } else {
          showFeedback("Already in dictionary!", "📖")
        }
      }
    }
  }

  const handleMastered = () => {
    showFeedback("Sugoi!", "😊")
  }

  const handleWordClick = async (word, isJapanese, context = null) => {
    await sharedHandleWordClick(
      word,
      setSelectedWord,
      isJapanese,
      context,
      null,
      setIsTranslating,
      userProfile?.targetLanguage || 'Japanese'
    )
  }

  const toggleTranslation = (postId, wordIndex) => {
    const key = `${postId}-${wordIndex}`
    setTranslationStates((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const togglePostExpansion = () => {
    setExpandedPost(!expandedPost)
  }

  const toggleComments = () => {
    setShowComments(!showComments)
  }

  const handleFollowToggle = () => {
    setIsFollowing(!isFollowing)
  }

  // Create renderClickableText function
  const renderClickableText = createRenderClickableText(
    translationStates,
    toggleTranslation,
    handleWordClick,
    userProfile?.targetLanguage || 'Japanese'
  )

  const displayPost = processedPost || post

  const getLevelName = (level) => {
    const levelNames = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Native']
    return levelNames[level - 1] || 'Beginner'
  }

  const getLevelColor = (level) => {
    if (level === 1) return "bg-green-500"
    if (level === 2) return "bg-blue-500"
    if (level === 3) return "bg-yellow-500"
    if (level === 4) return "bg-orange-500"
    return "bg-red-500"
  }

  const getSourceBadgeColor = (source) => {
    const colors = {
      reddit: "bg-red-500",
      newsapi: "bg-blue-500",
      guardian: "bg-blue-700",
    }
    return colors[source] || "bg-gray-500"
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        {/* Header with close button */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-gray-900">Post Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Processing indicator */}
        {isProcessing && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <span className="text-blue-700 text-sm font-medium">
                Processing post with your learning level...
              </span>
            </div>
          </div>
        )}

        {/* Post content */}
        <div className="p-6">
          {/* Article Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-orange-700">
                    {displayPost.author?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">
                      {displayPost.author || 'Unknown'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {displayPost.source} •{" "}
                    {displayPost.publishedAt
                      ? new Date(displayPost.publishedAt).toLocaleDateString()
                      : 'Unknown date'}
                  </div>
                </div>
                <button
                  onClick={handleFollowToggle}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    isFollowing
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={displayPost.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="See original post"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
                {displayPost.difficulty && (
                  <span className={`${getLevelColor(displayPost.difficulty)} text-white px-2 py-1 rounded text-xs font-medium`}>
                    {getLevelName(displayPost.difficulty)}
                  </span>
                )}
                {displayPost.source && (
                  <span
                    className={`text-white px-2 py-1 rounded text-xs font-medium ${getSourceBadgeColor(displayPost.source)}`}
                  >
                    {displayPost.source}
                  </span>
                )}
              </div>
            </div>

            {/* Article Content */}
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {renderClickableText(displayPost.title, `${displayPost.id}-title`)}
              </h2>
              <div className="text-gray-800 leading-relaxed mb-4 whitespace-pre-wrap">
                {displayPost.content ? (
                  <>
                    {expandedPost || !shouldTruncateContent(displayPost.content) ? (
                      <div>{parseMarkdownContent(displayPost.content, `${displayPost.id}-content`, renderClickableText)}</div>
                    ) : (
                      <div>{parseMarkdownContent(truncateContent(displayPost.content), `${displayPost.id}-content`, renderClickableText)}</div>
                    )}
                    {shouldTruncateContent(displayPost.content) && (
                      <button
                        onClick={togglePostExpansion}
                        className="text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block"
                      >
                        {expandedPost ? 'See Less' : 'See More'}
                      </button>
                    )}
                  </>
                ) : ""}
              </div>

              {displayPost.image && (
                <img
                  src={displayPost.image}
                  alt={displayPost.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}
            </div>

            {/* Tags */}
            {displayPost.tags && displayPost.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {displayPost.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Engagement Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-6">
                <button
                  className="flex items-center space-x-2 text-orange-500 transition-colors"
                  disabled
                >
                  <Bookmark className="w-5 h-5 fill-current" />
                  <span className="text-sm font-medium">Saved</span>
                </button>
                <button
                  onClick={toggleComments}
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {displayPost.comments || 0} comments
                  </span>
                </button>
                <button
                  onClick={() => onShare && onShare(displayPost)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-green-500 transition-colors"
                >
                  <Share className="w-5 h-5" />
                  <span className="text-sm font-medium">Share</span>
                </button>
              </div>
              {onRemove && (
                <button
                  onClick={() => {
                    onRemove(displayPost.id)
                    onClose()
                  }}
                  className="text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  Remove from Saved
                </button>
              )}
            </div>
          </div>

          {/* Enhanced Comment System */}
          {showComments && (
            <div className="border-t border-gray-200 pt-4">
              <EnhancedCommentSystem
                articleId={displayPost.id}
                postContent={displayPost.content}
                postTitle={displayPost.title}
                userProfile={userProfile}
                userDictionary={userDictionary}
                onAddWordToDictionary={onAddWordToDictionary}
              />
            </div>
          )}
        </div>

        {/* Word Learning Popup */}
        {(selectedWord || isTranslating) && (
          <WordLearningPopup
            selectedWord={selectedWord}
            isTranslating={isTranslating}
            feedbackMessage={feedbackMessage}
            userProfile={userProfile}
            userDictionary={userDictionary}
            onClose={() => {
              setSelectedWord(null)
              setIsTranslating(false)
            }}
            onAddToDictionary={handleAddToDictionary}
            onMastered={handleMastered}
          />
        )}
      </div>
    </div>
  )
}

export default SinglePostView
