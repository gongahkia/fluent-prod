import {
  X,
  Bookmark,
  MessageCircle,
  MoreVertical,
} from "lucide-react"
import React, { useState, useEffect, useCallback } from "react"
import { handleWordClick as sharedHandleWordClick } from "../lib/wordDatabase"
import translationService from "../services/translationService"
import EnhancedCommentSystem from "./EnhancedCommentSystem"
import WordLearningPopup from "./NewsFeed/WordLearningPopup"
import PostSettingsModal from "./PostSettingsModal"
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
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  // Process post with mixed language content based on user level
  const processPostWithMixedLanguage = useCallback(async () => {
    if (!post || !userProfile?.learningLevel) {
      setProcessedPost(post)
      setIsProcessing(false)
      return
    }

    setIsProcessing(true)
    const targetLangCode = 'ja'

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
      let wordToAdd

      // Japanese-only
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

      const exists = userDictionary.some((word) => word.japanese === wordToAdd.japanese)

      if (!exists) {
        onAddWordToDictionary(wordToAdd)
        showFeedback("Added to dictionary!", "")
      } else {
        showFeedback("Already in dictionary!", "")
      }
    }
  }

  const handleMastered = () => {
    showFeedback("Sugoi!", "")
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

  const handleOpenSettings = () => {
    setShowSettingsModal(true)
  }

  const handleCloseSettings = () => {
    setShowSettingsModal(false)
  }

  const handleNotInterested = (postId) => {
    // In SinglePostView, just close the modal and the post view
    setShowSettingsModal(false)
    onClose()
  }

  const handleReportPost = (postId) => {
    console.log('Post reported:', postId)
    // In a real app, this would send a report to the backend
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
    if (level === 1) return "bg-amber-500"
    if (level === 2) return "bg-orange-500"
    if (level === 3) return "bg-yellow-500"
    if (level === 4) return "bg-orange-500"
    return "bg-red-500"
  }

  const getSourceBadgeColor = (source) => {
    const colors = {
      reddit: "bg-red-500",
      newsapi: "bg-orange-500",
      guardian: "bg-orange-700",
    }
    return colors[source] || "bg-gray-500"
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
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

        {/* Post content */}
        <div className="p-6">
          {/* Top Row: @username, timestamp, and action buttons - matching NewsFeed style */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600 text-sm font-medium">
                @{displayPost.author || 'user'}
              </span>
              <span className="text-gray-400 text-sm">•</span>
              <span className="text-gray-500 text-sm">
                {displayPost.time || (displayPost.publishedAt
                  ? new Date(displayPost.publishedAt).toLocaleDateString()
                  : 'Unknown date')}
              </span>
            </div>
            {/* Action buttons - right side */}
            <div className="flex items-center space-x-2">
              {/* 3-dot menu */}
              <button
                onClick={handleOpenSettings}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Post options"
              >
                <MoreVertical className="w-5 h-5 text-gray-600" />
              </button>
              {/* Save button (already saved, filled) */}
              <button
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Already saved"
                disabled
              >
                <Bookmark className="w-5 h-5 text-orange-600 fill-current" />
              </button>
            </div>
          </div>

          {/* Article Content - matching NewsFeed style */}
          <div className="mb-4">
            {/* Combined Text Block with improved hierarchy */}
            {(() => {
              const titleText = displayPost.title || '';
              const contentText = displayPost.content || '';
              const combinedText = titleText + (titleText && contentText ? '. ' : '') + contentText;
              const combinedId = `${displayPost.id}-combined`;
              const shouldTruncate = shouldTruncateContent(combinedText);
              const isExpanded = expandedPost;

              return (
                <>
                  <div
                    className={`
                      post-body
                      ${!isExpanded && shouldTruncate ? 'post-content-truncated' : 'post-content-expanded'}
                    `}
                  >
                    {/* Title portion with emphasis */}
                    {titleText && (
                      <div className="post-title">
                        {parseMarkdownContent(titleText, `${combinedId}-title`, renderClickableText)}
                      </div>
                    )}
                    {/* Content portion */}
                    {contentText && (
                      <div>
                        {parseMarkdownContent(contentText, `${combinedId}-content`, renderClickableText)}
                      </div>
                    )}
                    {!titleText && !contentText && parseMarkdownContent(combinedText, combinedId, renderClickableText)}
                  </div>
                  {shouldTruncate && (
                    <button
                      onClick={togglePostExpansion}
                      className="text-orange-600 hover:text-orange-700 font-medium mt-3 inline-flex items-center space-x-1 transition-all duration-300 hover:translate-x-1"
                    >
                      <span>{isExpanded ? 'See Less' : 'See More'}</span>
                      <svg
                        className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </>
              );
            })()}

            {displayPost.image && (
              <img
                src={displayPost.image}
                alt={displayPost.title}
                className="w-full h-64 object-cover rounded-lg mt-4 transition-all duration-300 hover:shadow-lg"
              />
            )}
          </div>

          {/* Bottom Row: View Comments (left) and Reddit (right) - matching NewsFeed style */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleComments}
                className="flex items-center space-x-1.5 text-gray-600 hover:text-orange-600 transition-colors text-sm font-medium"
              >
                <MessageCircle className="w-4 h-4" />
                <span>View Comments ({displayPost.comments || 0})</span>
              </button>
            </div>
            <div className="flex items-center space-x-3">
              {/* Open in Reddit/External Link */}
              <a
                href={displayPost.externalUrl || displayPost.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors text-sm font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                </svg>
              </a>

              {/* Remove from Saved - shown only if onRemove is provided */}
              {onRemove && (
                <button
                  onClick={() => {
                    onRemove(displayPost.id)
                    onClose()
                  }}
                  className="text-sm text-red-600 hover:text-red-700 transition-colors ml-2"
                >
                  Remove
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
          />
        )}

        {/* Post Settings Modal */}
        {showSettingsModal && (
          <PostSettingsModal
            post={displayPost}
            onClose={handleCloseSettings}
            onNotInterested={handleNotInterested}
            onReport={handleReportPost}
          />
        )}
      </div>
    </div>
  )
}

export default SinglePostView
