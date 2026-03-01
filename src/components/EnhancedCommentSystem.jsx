import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Heart,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react"
import React, { useEffect, useRef, useState } from "react"
import { emitToast } from "../lib/toastBus"
import { handleWordClick as sharedHandleWordClick } from "../lib/wordDatabase"
import {
  addWebLlmEnabledListener,
  isWebLlmEnabled,
} from "../services/commentAiPrefs"
import {
  createReply,
  onCommentsChanged,
} from "../services/firebase/commentsService"
import { segmentJapaneseText } from "./NewsFeed/utils/textParsing"
import WordLearningPopup from "./NewsFeed/WordLearningPopup"
import LoadingSpinner from "./ui/LoadingSpinner"
import SpeechToTextButton from "./ui/SpeechToTextButton"

async function loadCommentAiService() {
  return await import("../services/commentAiService")
}

function toDisplayComment(comment = {}) {
  const userLabel = String(
    comment?.user || comment?.username || comment?.displayName || "User"
  )
  return {
    ...comment,
    id: comment?.id || `comment-${Date.now()}`,
    user: userLabel,
    likes: Number(comment?.likesCount ?? comment?.likes ?? 0),
    avatar: comment?.avatar || userLabel.charAt(0).toUpperCase() || "U",
    profilePictureUrl: comment?.profilePictureUrl || "",
    parentCommentId: comment?.parentCommentId || null,
    replies: [],
  }
}

function buildCommentTree(comments = []) {
  const indexedComments = new Map()
  comments.forEach((rawComment) => {
    const comment = toDisplayComment(rawComment)
    indexedComments.set(comment.id, comment)
  })

  const roots = []
  indexedComments.forEach((comment) => {
    if (
      comment.parentCommentId &&
      indexedComments.has(comment.parentCommentId)
    ) {
      indexedComments.get(comment.parentCommentId).replies.push(comment)
    } else {
      roots.push(comment)
    }
  })

  return roots
}

const EnhancedCommentSystem = ({
  articleId,
  postContent,
  postTitle,
  userProfile,
  userDictionary,
  onAddWordToDictionary,
  isGuest,
}) => {
  const [isAiEnabled, setIsAiEnabled] = useState(() => isWebLlmEnabled())
  const [showAIHelp, setShowAIHelp] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [selectedWord, setSelectedWord] = useState(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState("")
  const [comments, setComments] = useState([])
  const [feedbackMessage, setFeedbackMessage] = useState(null)
  const [commentLikes, setCommentLikes] = useState({})
  const [likedComments, setLikedComments] = useState(new Set())
  const [isTranslating, setIsTranslating] = useState(false)
  const [replyingTo, setReplyingTo] = useState(null)
  const [collapsedComments, setCollapsedComments] = useState(new Set())
  const [aiSuggestions, setAiSuggestions] = useState([])
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [aiModel, setAiModel] = useState("")
  const commentInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [showGrammarCheck, setShowGrammarCheck] = useState(false)
  const [grammarCheckResult, setGrammarCheckResult] = useState(null)
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false)
  const aiSuggestionsRequestRef = useRef(0)
  const grammarRequestRef = useRef(0)

  // All comments come from user-submitted comments state
  const allComments = comments

  // Fetch AI suggestions
  const fetchAISuggestions = async () => {
    const requestId = aiSuggestionsRequestRef.current + 1
    aiSuggestionsRequestRef.current = requestId
    setIsLoadingAI(true)
    try {
      const targetLanguage = userProfile?.targetLanguage || "Japanese"

      const { generateCommentSuggestionsLocal } = await loadCommentAiService()

      const data = await generateCommentSuggestionsLocal({
        postContent:
          postContent || "Interesting post about the target culture.",
        postTitle: postTitle || "",
        numberOfSuggestions: 3,
        targetLanguage,
      })
      if (requestId !== aiSuggestionsRequestRef.current) return

      if (data?.suggestions && data.suggestions.length > 0) {
        setAiSuggestions(data.suggestions)
        setAiModel(`WebLLM (${data.model})`)
      } else {
        console.warn("No suggestions from local LLM, using fallbacks")
        // Fallback suggestions based on target language
        const fallbackSuggestions = [
          {
            text: "This is interesting! もっと知りたいです。",
            translation: "I want to know more.",
          },
          {
            text: "Great post! 日本語の勉強になります。",
            translation: "This helps with studying Japanese.",
          },
        ]
        setAiSuggestions(fallbackSuggestions)
        setAiModel("WebLLM (fallback)")
      }
    } catch (error) {
      console.error("Failed to generate local AI suggestions:", error)
      emitToast({
        message: "AI not available. Using default suggestions.",
        icon: "⚠️",
      })
      // Fallback suggestions based on target language
      const fallbackSuggestions = [
        {
          text: "This looks amazing! どこですか？",
          translation: "Where is this?",
        },
        {
          text: "Thanks for sharing! 勉強になります。",
          translation: "This is educational.",
        },
      ]
      console.log("Using catch block fallbacks:", fallbackSuggestions)
      if (requestId !== aiSuggestionsRequestRef.current) return
      setAiSuggestions(fallbackSuggestions)
      setAiModel("WebLLM (fallback)")
    }
    if (requestId === aiSuggestionsRequestRef.current) {
      setIsLoadingAI(false)
    }
  }

  const handleShowAIHelp = () => {
    if (isGuest) {
      emitToast({ message: "Sign up to use AI help!", icon: "🔒" })
      return
    }
    if (!isAiEnabled) return
    setShowAIHelp(!showAIHelp)
    if (!showAIHelp && aiSuggestions.length === 0) {
      fetchAISuggestions()
    }
  }

  // Keep in sync if user enables/disables in this browser (e.g., via login prompt)
  useEffect(() => {
    const unsubscribe = addWebLlmEnabledListener(() => {
      setIsAiEnabled(isWebLlmEnabled())
    })

    const onStorage = (event) => {
      if (!event?.key) return
      if (event.key === "fluent:webllm:enabled") {
        setIsAiEnabled(isWebLlmEnabled())
      }
    }

    window.addEventListener("storage", onStorage)
    return () => {
      unsubscribe?.()
      window.removeEventListener("storage", onStorage)
      aiSuggestionsRequestRef.current += 1
      grammarRequestRef.current += 1
    }
  }, [])

  useEffect(() => {
    if (!articleId) {
      setComments([])
      return
    }

    const unsubscribe = onCommentsChanged(articleId, (loadedComments = []) => {
      setComments(buildCommentTree(loadedComments))
    })

    return () => {
      unsubscribe?.()
    }
  }, [articleId])

  // Word click functionality
  const handleWordClick = async (
    word,
    isJapanese,
    context = null,
    event = null
  ) => {
    const findCommentWithWord = (comments) => {
      for (const comment of comments) {
        if (comment.content.includes(word)) {
          return comment
        }
        if (comment.replies && comment.replies.length > 0) {
          const found = findCommentWithWord(comment.replies)
          if (found) return found
        }
      }
      return null
    }

    const comment = findCommentWithWord(allComments)
    let fullContext = context

    if (comment) {
      fullContext = comment.content
    }

    const anchorEl = event?.currentTarget || event?.target || null
    const clickPosition = anchorEl
      ? {
          x: event?.clientX,
          y: event?.clientY,
          anchorEl,
          elementRect: anchorEl.getBoundingClientRect(),
        }
      : null

    await sharedHandleWordClick(
      word,
      setSelectedWord,
      isJapanese,
      fullContext,
      null,
      setIsTranslating,
      userProfile?.targetLanguage || "Japanese",
      clickPosition
    )
  }

  const handleClosePopup = () => {
    setSelectedWord(null)
    setIsTranslating(false)
    setFeedbackMessage(null)
  }

  const showFeedback = (message, icon) => {
    setFeedbackMessage({ message, icon })
    setTimeout(() => {
      setFeedbackMessage(null)
      setSelectedWord(null)
    }, 2000)
  }

  const handleAddToDictionary = () => {
    if (isGuest) {
      emitToast({ message: "Sign up to save words!", icon: "🔒" })
      return
    }
    if (selectedWord) {
      const wordToAdd = {
        japanese: selectedWord.japanese,
        hiragana: selectedWord.hiragana,
        english: selectedWord.english,
        level: selectedWord.level,
      }

      const isAlreadyInDictionary = userDictionary.some((item) => {
        return (
          item.japanese === wordToAdd.japanese ||
          item.english === wordToAdd.english
        )
      })

      if (!isAlreadyInDictionary) {
        onAddWordToDictionary(wordToAdd)
        showFeedback("Saved Word!", "")
      } else {
        showFeedback("Already saved!", "")
      }
    }
  }

  const handleLikeComment = (commentId) => {
    if (isGuest) {
      emitToast({ message: "Sign up to like comments!", icon: "🔒" })
      return
    }
    if (!likedComments.has(commentId)) {
      const findCommentById = (comments, id) => {
        for (const comment of comments) {
          if (comment.id === id) return comment
          if (comment.replies) {
            const found = findCommentById(comment.replies, id)
            if (found) return found
          }
        }
        return null
      }

      const comment = findCommentById(allComments, commentId)
      const currentLikes = comment ? comment.likes : 0

      setCommentLikes((prev) => ({
        ...prev,
        [commentId]: currentLikes + 1,
      }))
      setLikedComments((prev) => new Set([...prev, commentId]))
    }
  }

  const handleReplyToComment = (commentId, username) => {
    if (isGuest) {
      emitToast({ message: "Sign up to reply!", icon: "🔒" })
      return
    }
    setReplyingTo({ id: commentId, username })
    setCommentText(`@${username} `)
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
        commentInputRef.current.focus()
      }
    }, 100)
  }

  const toggleCommentCollapse = (commentId) => {
    setCollapsedComments((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(commentId)) {
        newSet.delete(commentId)
      } else {
        newSet.add(commentId)
      }
      return newSet
    })
  }

  const renderClickableText = (text) => {
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
      const hasEnglish = /[a-zA-Z]/.test(segment)

      if (hasJapanese) {
        // Use intelligent segmentation for Japanese text
        const words = segmentJapaneseText(segment)

        // Japanese is target language if user is learning Japanese
        const isTargetLanguage = userProfile?.targetLanguage === "Japanese"

        return (
          <span key={segmentIndex}>
            {words.map((wordObj, wordIndex) => {
              const { text: wordText } = wordObj

              return (
                <span
                  key={`${segmentIndex}-${wordIndex}`}
                  className="cursor-pointer hover:bg-amber-50 border-b-2 border-transparent hover:border-amber-400 rounded px-1 py-0.5 transition-all duration-200"
                  onClick={(e) =>
                    handleWordClick(wordText, isTargetLanguage, text, e)
                  }
                  title={`Click to translate: ${wordText}`}
                  style={{ textDecoration: "none" }}
                >
                  {wordText}
                </span>
              )
            })}
          </span>
        )
      } else if (hasEnglish) {
        const cleanWord = segment.trim().replace(/[.,!?;:"'()[\]{}—–-]/g, "")

        // Skip if empty after cleaning
        if (!cleanWord) {
          return <span key={segmentIndex}>{segment}</span>
        }

        return (
          <span key={segmentIndex}>
            <span
              className="cursor-pointer hover:bg-amber-50 border-b-2 border-transparent hover:border-amber-400 rounded px-1 py-0.5 transition-all duration-200"
              onClick={(e) => handleWordClick(cleanWord, false, text, e)}
              title={`Click to translate: ${cleanWord}`}
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

  // Handle file selection for media uploads
  const handleFileSelect = (event) => {
    if (isGuest) {
      emitToast({ message: "Sign up to upload media!", icon: "🔒" })
      return
    }
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ]
    if (!validTypes.includes(file.type)) {
      emitToast({
        message: "Please select a valid image file (JPEG, PNG, GIF, or WebP)",
        icon: "⚠️",
      })
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      emitToast({
        message: "File size must be less than 5MB",
        icon: "⚠️",
      })
      return
    }

    // Convert to base64 for preview and storage
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result
      setSelectedMedia({
        file: file,
        type: file.type,
        name: file.name,
        data: base64String,
      })
      setMediaPreview(base64String)
    }
    reader.readAsDataURL(file)
  }

  // Remove selected media
  const handleRemoveMedia = () => {
    setSelectedMedia(null)
    setMediaPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Handle speech-to-text transcript
  const handleTranscript = (transcript) => {
    if (isGuest) {
      emitToast({ message: "Sign up to use speech-to-text!", icon: "🔒" })
      return
    }
    // Append transcript to existing comment text (with space if there's existing text)
    setCommentText((prevText) => {
      if (prevText.trim()) {
        return prevText + " " + transcript
      }
      return transcript
    })

    // Focus on the comment input after transcription
    if (commentInputRef.current) {
      commentInputRef.current.focus()
    }
  }

  // Check grammar before posting
  const checkCommentGrammar = async () => {
    if (isGuest) {
      emitToast({ message: "Sign up to post comments!", icon: "🔒" })
      return
    }
    if (!isAiEnabled) {
      postCommentDirectly()
      return
    }

    const requestId = grammarRequestRef.current + 1
    grammarRequestRef.current = requestId
    setIsCheckingGrammar(true)
    try {
      const targetLanguage = userProfile?.targetLanguage || "Japanese"

      const { checkGrammarLocal } = await loadCommentAiService()

      const data = await checkGrammarLocal({
        commentText: commentText.trim(),
        targetLanguage,
      })
      if (requestId !== grammarRequestRef.current) return

      setGrammarCheckResult({
        ...data,
        model: `WebLLM (${data.model})`,
      })

      // Only show modal if there are errors
      if (!data.isCorrect && data.correctedText) {
        setShowGrammarCheck(true)
      } else {
        // If grammar is correct or no target language detected, post directly
        await postCommentDirectly()
      }
    } catch (error) {
      if (requestId !== grammarRequestRef.current) return
      console.error("Failed to check grammar locally:", error)
      emitToast({
        message: "Grammar check unavailable. Posting anyway.",
        icon: "⚠️",
      })
      // On error, allow posting anyway
      await postCommentDirectly()
    }
    if (requestId === grammarRequestRef.current) {
      setIsCheckingGrammar(false)
    }
  }

  // Actually post the comment (called after grammar check passes or user confirms)
  const postCommentDirectly = async () => {
    if (isGuest) {
      emitToast({ message: "Sign up to post comments!", icon: "🔒" })
      return
    }
    setShowGrammarCheck(false)

    const newComment = {
      id: Date.now(),
      user: userProfile?.name || "Anonymous",
      content: commentText,
      likes: 0,
      avatar: userProfile?.name?.charAt(0) || "A",
      profilePictureUrl: userProfile?.profilePictureUrl || "",
      replies: [],
      media: selectedMedia
        ? {
            type: selectedMedia.type,
            data: selectedMedia.data,
            name: selectedMedia.name,
          }
        : null,
    }

    if (replyingTo) {
      const userId = userProfile?.userId
      if (!articleId || !userId) {
        emitToast({
          message: "Could not identify user for reply",
          icon: "⚠️",
        })
        return
      }

      const replyResult = await createReply({
        postHash: articleId,
        userId,
        parentCommentId: replyingTo.id,
        content: commentText,
        media: selectedMedia
          ? {
              type: selectedMedia.type,
              data: selectedMedia.data,
              name: selectedMedia.name,
            }
          : null,
      })

      if (!replyResult?.success) {
        emitToast({
          message: replyResult?.error || "Failed to post reply",
          icon: "⚠️",
        })
        return
      }

      setReplyingTo(null)
    } else {
      setComments([newComment, ...comments])
    }

    setCommentText("")
    handleRemoveMedia()
    setShowSuccessMessage("Comment posted successfully!")
    setTimeout(() => setShowSuccessMessage(""), 2000)
  }

  const handlePostComment = async () => {
    if (isGuest) {
      emitToast({ message: "Sign up to post comments!", icon: "🔒" })
      return
    }
    if (commentText.trim() || selectedMedia) {
      // Check grammar before posting if there's text
      if (commentText.trim()) {
        await checkCommentGrammar()
      } else {
        // If only media, post directly
        await postCommentDirectly()
      }
    }
  }

  // Use corrected text from grammar check
  const handleUseCorrectedText = () => {
    if (grammarCheckResult?.correctedText) {
      setCommentText(grammarCheckResult.correctedText)
      setShowGrammarCheck(false)
    }
  }

  // Render a single comment with Reddit-style threading
  const renderComment = (comment, depth = 0) => {
    const isCollapsed = collapsedComments.has(comment.id)
    const hasReplies = comment.replies && comment.replies.length > 0

    const renderThreadGutter = () => {
      if (depth <= 0) return null

      const indentCols = Array.from({ length: Math.max(0, depth - 1) })

      return (
        <div className="flex-shrink-0 flex" aria-hidden="true">
          {indentCols.map((_, idx) => (
            <div key={idx} className="w-6" />
          ))}
          <div className="w-6" />
        </div>
      )
    }

    return (
      <div key={comment.id}>
        <div className="flex">
          {renderThreadGutter()}

          {/* Comment content */}
          <div className="flex-1">
            <div className="flex items-start space-x-3 py-3">
              {/* Collapse button and avatar */}
              <div className="flex-shrink-0 flex items-center space-x-2">
                {hasReplies && (
                  <button
                    onClick={() => toggleCommentCollapse(comment.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                )}
                {!hasReplies && <div className="w-4"></div>}
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                  {comment.profilePictureUrl ? (
                    <img
                      src={comment.profilePictureUrl}
                      alt={`${comment.user || "User"} profile picture`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-xs font-medium text-gray-600">
                      {comment.avatar}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-gray-900 text-sm">
                    {comment.user}
                  </span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-500">2h ago</span>
                  {hasReplies && (
                    <>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">
                        {comment.replies.length}{" "}
                        {comment.replies.length === 1 ? "reply" : "replies"}
                      </span>
                    </>
                  )}
                </div>

                {!isCollapsed && (
                  <>
                    {comment.content && (
                      <div className="text-gray-800 text-sm mb-2">
                        {renderClickableText(comment.content)}
                      </div>
                    )}

                    {/* Render media if present */}
                    {comment.media && (
                      <div className="mb-2">
                        <img
                          src={comment.media.data}
                          alt={comment.media.name || "Comment attachment"}
                          className="max-w-sm max-h-64 rounded-lg border border-gray-200"
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleLikeComment(comment.id)}
                        className={`flex items-center space-x-1 text-xs transition-colors ${
                          likedComments.has(comment.id)
                            ? "text-red-500"
                            : "text-gray-500 hover:text-red-500"
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${likedComments.has(comment.id) ? "fill-red-500" : ""}`}
                        />
                        <span>{commentLikes[comment.id] || comment.likes}</span>
                      </button>
                      <button
                        onClick={() =>
                          handleReplyToComment(comment.id, comment.user)
                        }
                        className="flex items-center space-x-1 text-xs text-gray-500 hover:text-orange-500"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Reply</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Render replies (outside the row so the gutter doesn't stretch through the whole subtree) */}
        {!isCollapsed && hasReplies && (
          <div className="mt-1">
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-orange-500" />
            Comments ({allComments.length})
          </h3>
        </div>
      </div>

      {/* Comment Input */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
            {userProfile?.profilePictureUrl ? (
              <img
                src={userProfile.profilePictureUrl}
                alt={`${userProfile?.name || "User"} profile picture`}
                className="w-full h-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-sm font-medium text-orange-700">
                {userProfile?.name?.charAt(0) || "U"}
              </span>
            )}
          </div>
          <div className="flex-1">
            {replyingTo && (
              <div className="mb-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg flex items-center justify-between">
                <span>
                  Replying to <strong>@{replyingTo.username}</strong>
                </span>
                <button
                  onClick={() => {
                    setReplyingTo(null)
                    setCommentText("")
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <textarea
              ref={commentInputRef}
              value={commentText}
              onChange={(e) => {
                setCommentText(e.target.value)
                // Close AI suggestions when user starts typing
                if (showAIHelp && e.target.value.length > 0) {
                  setShowAIHelp(false)
                }
              }}
              placeholder="Share your thoughts... (You can write in any language)"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              rows={3}
            />

            {/* Media Preview */}
            {mediaPreview && (
              <div className="mt-3 relative inline-block">
                <img
                  src={mediaPreview}
                  alt="Preview"
                  className="max-w-xs max-h-48 rounded-lg border border-gray-300"
                />
                <button
                  onClick={handleRemoveMedia}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleShowAIHelp}
                  disabled={!isAiEnabled}
                  className={`flex items-center space-x-1 text-sm transition-colors ${
                    isAiEnabled
                      ? "text-gray-600 hover:text-orange-600"
                      : "text-gray-400 cursor-not-allowed opacity-60"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>AI Help</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-orange-600 transition-colors"
                  title="Add photo or GIF"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Photo/GIF</span>
                </button>

                <SpeechToTextButton
                  targetLanguage={userProfile?.targetLanguage || "Japanese"}
                  onTranscript={handleTranscript}
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              <button
                onClick={handlePostComment}
                disabled={
                  (!commentText.trim() && !selectedMedia) || isCheckingGrammar
                }
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center space-x-1 transition-colors"
              >
                {isCheckingGrammar ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Post</span>
                  </>
                )}
              </button>
            </div>

            {showSuccessMessage && (
              <div className="mt-2 p-2 bg-amber-100 text-amber-800 rounded text-sm">
                {showSuccessMessage}
              </div>
            )}
          </div>
        </div>

        {/* AI Help Panel */}
        {showAIHelp && (
          <div className="mt-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg border border-amber-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-amber-900 flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>AI Suggestions</span>
              </h4>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full border border-amber-300">
                {aiModel}
              </span>
            </div>

            {isLoadingAI ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-amber-600 mr-2" />
                <span className="text-sm text-amber-700">
                  Generating suggestions...
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                {aiSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white rounded border border-amber-200 hover:border-amber-300 transition-colors"
                  >
                    <div className="text-sm text-gray-900 mb-1">
                      {suggestion.text}
                    </div>
                    {suggestion.translation && (
                      <div className="text-xs text-gray-600 italic">
                        {suggestion.translation}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setCommentText(suggestion.text)
                        setShowAIHelp(false)
                      }}
                      className="mt-2 text-xs text-amber-600 hover:text-amber-800 font-medium"
                    >
                      Use this suggestion
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-amber-700 mt-3 text-center">
              AI-generated suggestions to help you practice mixed-language
              comments
            </p>
          </div>
        )}
      </div>

      {/* Comments List with Reddit-style threading */}
      <div>{allComments.map((comment) => renderComment(comment, 0))}</div>

      {/* Word Learning Popup */}
      {(selectedWord || isTranslating) && (
        <WordLearningPopup
          selectedWord={selectedWord}
          isTranslating={isTranslating}
          feedbackMessage={feedbackMessage}
          userProfile={userProfile}
          userDictionary={userDictionary}
          onClose={handleClosePopup}
          onAddToDictionary={handleAddToDictionary}
        />
      )}

      {/* Grammar Check Modal */}
      {showGrammarCheck && grammarCheckResult && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowGrammarCheck(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-orange-500" />
                Grammar Suggestion
              </h3>
              <button
                onClick={() => setShowGrammarCheck(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Original Text */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Your comment:
                </p>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-gray-900">
                  {grammarCheckResult.originalText}
                </div>
              </div>

              {/* Corrected Text */}
              {grammarCheckResult.correctedText && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Suggested correction:
                  </p>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-gray-900">
                    {grammarCheckResult.correctedText}
                  </div>
                </div>
              )}

              {/* Explanation */}
              {grammarCheckResult.explanation && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Explanation:
                  </p>
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-gray-800">
                    {grammarCheckResult.explanation}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={handleUseCorrectedText}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Use Correction
                </button>
                <button
                  onClick={postCommentDirectly}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Post Anyway
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-2">
                AI-powered grammar checking by {grammarCheckResult.model}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedCommentSystem
