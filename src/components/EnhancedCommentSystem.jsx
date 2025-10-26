import {
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Heart,
  MessageCircle,
  Send,
  Sparkles,
  Loader2,
  Image as ImageIcon,
  X,
} from "lucide-react"
import React, { useRef, useState } from "react"
import { handleWordClick as sharedHandleWordClick } from "../lib/wordDatabase"
import LoadingSpinner from "./ui/LoadingSpinner"

const EnhancedCommentSystem = ({
  articleId,
  postContent,
  postTitle,
  userProfile,
  userDictionary,
  onAddWordToDictionary,
}) => {
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
  const [aiModel, setAiModel] = useState('')
  const commentInputRef = useRef(null)
  const fileInputRef = useRef(null)
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [showGrammarCheck, setShowGrammarCheck] = useState(false)
  const [grammarCheckResult, setGrammarCheckResult] = useState(null)
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false)

  // Mock comments with nested structure
  const mockComments = {
    1: [
      {
        id: 1,
        user: "Yuki_Tokyo",
        content:
          "この場所は本当に本格的です！地元の人だけが知る隠れた宝石ですね。",
        likes: 24,
        avatar: "YT",
        replies: [
          {
            id: 101,
            user: "LocalGuide",
            content: "本当にそう思います！10年住んでいても新しい発見があります。",
            likes: 8,
            avatar: "LG",
            replies: []
          }
        ]
      },
      {
        id: 2,
        user: "RamenLover92",
        content:
          "先月、これらの場所の一つを訪問しました！それを経営していたおじいさんは、私の下手な日本語にとても親切で忍耐強くしてくれました。",
        likes: 18,
        avatar: "RL",
        replies: [
          {
            id: 201,
            user: "TokyoFoodie",
            content: "Family-run places have the best atmosphere! おじいさんの笑顔が忘れられません。",
            likes: 12,
            avatar: "TF",
            replies: [
              {
                id: 301,
                user: "RamenLover92",
                content: "Exactly! そういう温かさが日本の良いところですね。",
                likes: 5,
                avatar: "RL",
                replies: []
              }
            ]
          }
        ]
      },
      {
        id: 3,
        user: "FoodExplorer",
        content:
          "The ramen here is absolutely phenomenal! 世代を超えた伝統の味を感じます。",
        likes: 19,
        avatar: "FE",
        replies: []
      },
    ],
  }

  const allCommentsFlat = mockComments[articleId] || []

  // Convert flat comments to nested structure
  const buildCommentTree = (comments) => {
    return comments
  }

  const allComments = buildCommentTree([...allCommentsFlat, ...comments])

  // Fetch AI suggestions
  const fetchAISuggestions = async () => {
    setIsLoadingAI(true)
    try {
      // Get Gemini API key from sessionStorage
      const geminiApiKey = sessionStorage.getItem('geminiApiKey') || null
      const targetLanguage = userProfile?.targetLanguage || 'Japanese'

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_BASE_URL}/api/ai/comment-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postContent: postContent || 'Interesting post about the target culture.',
          postTitle: postTitle || '',
          numberOfSuggestions: 3,
          geminiApiKey,
          targetLanguage
        }),
      })

      const data = await response.json()

      if (data.suggestions) {
        setAiSuggestions(data.suggestions)
        setAiModel(data.model || 'Gemini 2.0 Flash (Free)')
      } else {
        // Fallback suggestions based on target language
        const fallbackSuggestions = targetLanguage === 'Korean' ? [
          {
            text: 'This is interesting! 더 알고 싶어요.',
            translation: 'I want to know more.'
          },
          {
            text: 'Great post! 한국어 공부에 도움이 돼요.',
            translation: 'This helps with studying Korean.'
          }
        ] : [
          {
            text: 'This is interesting! もっと知りたいです。',
            translation: 'I want to know more.'
          },
          {
            text: 'Great post! 日本語の勉強になります。',
            translation: 'This helps with studying Japanese.'
          }
        ]
        setAiSuggestions(fallbackSuggestions)
        setAiModel('Gemini 2.0 Flash (Free)')
      }
    } catch (error) {
      console.error('Failed to fetch AI suggestions:', error)
      // Fallback suggestions based on target language
      const targetLanguage = userProfile?.targetLanguage || 'Japanese'
      const fallbackSuggestions = targetLanguage === 'Korean' ? [
        {
          text: 'This looks amazing! 어디예요?',
          translation: 'Where is this?'
        },
        {
          text: 'Thanks for sharing! 공부가 돼요.',
          translation: 'This is educational.'
        }
      ] : [
        {
          text: 'This looks amazing! どこですか？',
          translation: 'Where is this?'
        },
        {
          text: 'Thanks for sharing! 勉強になります。',
          translation: 'This is educational.'
        }
      ]
      setAiSuggestions(fallbackSuggestions)
      setAiModel('Gemini 2.0 Flash (Free)')
    }
    setIsLoadingAI(false)
  }

  const handleShowAIHelp = () => {
    setShowAIHelp(!showAIHelp)
    if (!showAIHelp && aiSuggestions.length === 0) {
      fetchAISuggestions()
    }
  }

  // Word click functionality
  const handleWordClick = async (word, isJapanese, context = null) => {
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

    await sharedHandleWordClick(
      word,
      setSelectedWord,
      isJapanese,
      fullContext,
      null,
      setIsTranslating,
      userProfile?.targetLanguage || 'Japanese'
    )
  }

  const showFeedback = (message, icon) => {
    setFeedbackMessage({ message, icon })
    setTimeout(() => {
      setFeedbackMessage(null)
      setSelectedWord(null)
    }, 2000)
  }

  const handleAddToDictionary = () => {
    if (selectedWord) {
      const wordToAdd = {
        japanese: selectedWord.japanese,
        hiragana: selectedWord.hiragana,
        english: selectedWord.english,
        level: selectedWord.level,
        example: selectedWord.example,
        exampleEn: selectedWord.exampleEn,
      }

      const isAlreadyInDictionary = userDictionary.some(
        (item) =>
          item.japanese === wordToAdd.japanese ||
          item.english === wordToAdd.english
      )

      if (!isAlreadyInDictionary) {
        onAddWordToDictionary(wordToAdd)
        showFeedback("Added to dictionary! ✓", "📚")
      } else {
        showFeedback("Already in dictionary!", "📖")
      }
    }
  }

  const handleMastered = () => {
    showFeedback("Sugoi!", "😊")
  }

  const handleLikeComment = (commentId) => {
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
    setCollapsedComments(prev => {
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
    const segments = text.split(/(\s+|[。、！？])/)

    return segments.map((segment, segmentIndex) => {
      if (!segment.trim()) return <span key={segmentIndex}>{segment}</span>

      const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(
        segment
      )
      const hasKorean = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(segment)
      const hasEnglish = /[a-zA-Z]/.test(segment)

      if (hasJapanese) {
        // Japanese is target language if user is learning Japanese
        const isTargetLanguage = userProfile?.targetLanguage === 'Japanese'
        return (
          <span key={segmentIndex}>
            {segment.split("").map((char, charIndex) => (
              <span
                key={`${segmentIndex}-${charIndex}`}
                className="cursor-pointer hover:bg-yellow-200 hover:shadow-sm border-b border-transparent hover:border-orange-300 rounded px-0.5 py-0.5 transition-all duration-200 inline-block"
                onClick={() => handleWordClick(char, isTargetLanguage, text)}
                title={`Click to learn: ${char}`}
                style={{ textDecoration: "none" }}
              >
                {char}
              </span>
            ))}
          </span>
        )
      } else if (hasKorean) {
        // Korean is target language if user is learning Korean
        const isTargetLanguage = userProfile?.targetLanguage === 'Korean'
        return (
          <span key={segmentIndex}>
            <span
              className="cursor-pointer hover:bg-yellow-200 hover:shadow-sm border-b border-transparent hover:border-orange-300 rounded px-0.5 py-0.5 transition-all duration-200 inline-block"
              onClick={() => handleWordClick(segment.trim(), isTargetLanguage, text)}
              title={`Click to learn: ${segment.trim()}`}
              style={{ textDecoration: "none" }}
            >
              {segment}
            </span>
          </span>
        )
      } else if (hasEnglish) {
        return (
          <span key={segmentIndex}>
            <span
              className="cursor-pointer hover:bg-orange-100 hover:shadow-sm border-b border-transparent hover:border-orange-300 rounded px-1 py-0.5 transition-all duration-200"
              onClick={() => handleWordClick(segment.trim(), false, text)}
              title={`Click to learn: ${segment.trim()}`}
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

  const getLevelColor = (level) => {
    if (level <= 2) return "bg-amber-500"
    if (level <= 4) return "bg-yellow-500"
    if (level <= 6) return "bg-orange-500"
    return "bg-red-500"
  }

  // Handle file selection for media uploads
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      alert('File size must be less than 5MB')
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
        data: base64String
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
      fileInputRef.current.value = ''
    }
  }

  // Check grammar before posting
  const checkCommentGrammar = async () => {
    setIsCheckingGrammar(true)
    try {
      const geminiApiKey = sessionStorage.getItem('geminiApiKey') || null
      const targetLanguage = userProfile?.targetLanguage || 'Japanese'

      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_BASE_URL}/api/ai/check-grammar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentText: commentText.trim(),
          targetLanguage,
          geminiApiKey
        }),
      })

      const data = await response.json()
      setGrammarCheckResult(data)

      // Only show modal if there are errors
      if (!data.isCorrect && data.correctedText) {
        setShowGrammarCheck(true)
      } else {
        // If grammar is correct or no target language detected, post directly
        postCommentDirectly()
      }
    } catch (error) {
      console.error('Failed to check grammar:', error)
      // On error, allow posting anyway
      postCommentDirectly()
    }
    setIsCheckingGrammar(false)
  }

  // Actually post the comment (called after grammar check passes or user confirms)
  const postCommentDirectly = () => {
    setShowGrammarCheck(false)

    const newComment = {
      id: Date.now(),
      user: userProfile?.name || "Anonymous",
      content: commentText,
      likes: 0,
      avatar: userProfile?.name?.charAt(0) || "A",
      replies: [],
      media: selectedMedia ? {
        type: selectedMedia.type,
        data: selectedMedia.data,
        name: selectedMedia.name
      } : null
    }

    if (replyingTo) {
      // Add as a reply to the specified comment
      const addReply = (comments) => {
        return comments.map(comment => {
          if (comment.id === replyingTo.id) {
            return {
              ...comment,
              replies: [...comment.replies, newComment]
            }
          }
          if (comment.replies && comment.replies.length > 0) {
            return {
              ...comment,
              replies: addReply(comment.replies)
            }
          }
          return comment
        })
      }
      setComments(addReply(comments))
      setReplyingTo(null)
    } else {
      setComments([newComment, ...comments])
    }

    setCommentText("")
    handleRemoveMedia()
    setShowSuccessMessage("Comment posted successfully!")
    setTimeout(() => setShowSuccessMessage(""), 2000)
  }

  const handlePostComment = () => {
    if (commentText.trim() || selectedMedia) {
      // Check grammar before posting if there's text
      if (commentText.trim()) {
        checkCommentGrammar()
      } else {
        // If only media, post directly
        postCommentDirectly()
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

    return (
      <div key={comment.id}>
        <div className="flex">
          {/* Vertical line for threading */}
          {depth > 0 && (
            <div className="flex-shrink-0 w-8 relative">
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-300"></div>
            </div>
          )}

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
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">
                    {comment.avatar}
                  </span>
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
                        {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
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
                        onClick={() => handleReplyToComment(comment.id, comment.user)}
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

            {/* Render replies */}
            {!isCollapsed && hasReplies && (
              <div className="mt-1">
                {comment.replies.map(reply => renderComment(reply, depth + 1))}
              </div>
            )}
          </div>
        </div>
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
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-orange-700">
              {userProfile?.name?.charAt(0) || "U"}
            </span>
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
                  ✕
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
                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-orange-600 transition-colors"
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
                disabled={(!commentText.trim() && !selectedMedia) || isCheckingGrammar}
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
                <span className="text-sm text-amber-700">Generating suggestions...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 bg-white rounded border border-amber-200 hover:border-amber-300 transition-colors">
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
              💡 AI-generated suggestions to help you practice mixed-language comments
            </p>
          </div>
        )}
      </div>

      {/* Comments List with Reddit-style threading */}
      <div>
        {allComments.map((comment) => renderComment(comment, 0))}
      </div>

      {/* Word Learning Popup */}
      {(selectedWord || isTranslating) && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setSelectedWord(null)
            setIsTranslating(false)
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {isTranslating ? (
              <div className="text-center py-8">
                <LoadingSpinner size="lg" text="Translating..." />
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {selectedWord.japanese}
                  </div>
                  <div className="text-lg text-gray-600 mb-2">
                    {selectedWord.hiragana}
                  </div>
                  <div className="text-sm text-gray-500 mb-2">Meaning:</div>
                  <div className="text-xl text-amber-600 font-semibold">
                    {selectedWord.english}
                  </div>
                </div>

                {selectedWord.level && (
                  <div className="mb-4 flex items-center space-x-2">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-white text-sm font-medium ${getLevelColor(selectedWord.level)}`}
                    >
                      Level {selectedWord.level}
                    </span>
                    {selectedWord.isApiTranslated && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                        🌐 Live Translation
                      </span>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  <button
                    onClick={handleMastered}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Mastered! ✨
                  </button>
                  <button
                    onClick={handleAddToDictionary}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Add to My Dictionary
                  </button>
                </div>

                {feedbackMessage && (
                  <div className="mt-4 p-3 bg-amber-100 text-amber-800 rounded-lg text-center">
                    <span className="text-lg mr-2">{feedbackMessage.icon}</span>
                    {feedbackMessage.message}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
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
                <p className="text-sm font-medium text-gray-700 mb-1">Your comment:</p>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-gray-900">
                  {grammarCheckResult.originalText}
                </div>
              </div>

              {/* Corrected Text */}
              {grammarCheckResult.correctedText && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Suggested correction:</p>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-gray-900">
                    {grammarCheckResult.correctedText}
                  </div>
                </div>
              )}

              {/* Explanation */}
              {grammarCheckResult.explanation && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Explanation:</p>
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
