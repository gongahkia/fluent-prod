import {
  Bookmark,
  BookOpen,
  MessageCircle,
  RefreshCw,
  Settings,
  Share,
  UserCheck,
  UserPlus,
} from "lucide-react"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { handleWordClick as sharedHandleWordClick } from "../lib/wordDatabase"
import { checkApiConfiguration, fetchPosts } from "../services/newsService"
import translationService from "../services/translationService"
import vocabularyService from "../services/vocabularyService"
import EnhancedCommentSystem from "./EnhancedCommentSystem"
import LoadingSpinner from "./ui/LoadingSpinner"

const NewsFeed = ({
  selectedCountry,
  userProfile,
  onAddWordToDictionary,
  userDictionary,
}) => {
  const [showComments, setShowComments] = useState({})
  const [selectedWord, setSelectedWord] = useState(null)
  const [feedbackMessage, setFeedbackMessage] = useState(null)
  const [followingUsers, setFollowingUsers] = useState(
    new Set(["佐藤博", "高橋美咲"])
  )
  const [isTranslating, setIsTranslating] = useState(false)
  const [posts, setPosts] = useState([])
  const [processedPosts, setProcessedPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processingPosts, setProcessingPosts] = useState(false)
  const [selectedSources, setSelectedSources] = useState(["reddit"])
  const [showSettings, setShowSettings] = useState(false)
  const [apiStatus, setApiStatus] = useState({})
  const [, setCurrentPage] = useState(1)
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [showSeeMoreButton, setShowSeeMoreButton] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [activeSearchQuery, setActiveSearchQuery] = useState("")
  const searchTimeoutRef = useRef(null)
  const [expandedPosts, setExpandedPosts] = useState({})

  // Check API configuration on component mount
  useEffect(() => {
    const loadApiStatus = async () => {
      try {
        const sources = await checkApiConfiguration()
        // Convert array to object keyed by source id
        const statusMap = {}
        sources.forEach(source => {
          statusMap[source.id] = source
        })
        setApiStatus(statusMap)
      } catch (error) {
        console.error('Failed to load API status:', error)
        // Set default for reddit if API fails
        setApiStatus({
          reddit: {
            id: 'reddit',
            name: 'Reddit',
            enabled: true,
            configured: true
          }
        })
      }
    }
    loadApiStatus()
  }, [])

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // Process posts with mixed language content based on user level
  const processPostsWithMixedLanguage = useCallback(
    async (postsToProcess) => {
      if (!userProfile?.learningLevel || !postsToProcess.length) {
        return postsToProcess
      }

      setProcessingPosts(true)
      const processed = []

      for (const post of postsToProcess) {
        try {
          // Only process English content and create mixed content
          // Ensure we actually create mixed content for English posts
          const processedTitle = translationService.containsJapanese(post.title)
            ? post.title
            : await translationService.createMixedLanguageContent(
                post.title,
                userProfile.learningLevel
              )

          const processedContent =
            post.content && !translationService.containsJapanese(post.content)
              ? await translationService.createMixedLanguageContent(
                  post.content,
                  userProfile.learningLevel
                )
              : post.content

          console.log(`Mixed content created for post "${post.title}":`, {
            originalTitle: post.title,
            processedTitle: processedTitle,
            originalContent: post.content?.substring(0, 100) + "...",
            processedContent: processedContent?.substring(0, 100) + "...",
            learningLevel: userProfile.learningLevel,
          })

          processed.push({
            ...post,
            originalTitle: post.title,
            originalContent: post.content,
            title: processedTitle,
            content: processedContent,
            isMixedLanguage: true,
          })
        } catch (error) {
          console.warn("Failed to process post for mixed language:", error)
          // Fallback to original post if processing fails
          processed.push({
            ...post,
            originalTitle: post.title,
            originalContent: post.content,
            isMixedLanguage: false,
          })
        }
      }

      setProcessingPosts(false)
      return processed
    },
    [userProfile?.learningLevel]
  )

  // Load real posts from APIs
  const loadPosts = useCallback(
    async (isLoadMore = false) => {
      if (isLoadMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
        setCurrentPage(1)
        setHasMorePosts(true)
      }
      setError(null)

      try {
        const enabledSources = selectedSources.filter(
          (source) => apiStatus[source]?.enabled && apiStatus[source]?.configured
        )

        if (enabledSources.length === 0) {
          throw new Error(
            "No enabled sources available. Please check your API configuration."
          )
        }

        const realPosts = await fetchPosts({
          sources: enabledSources,
          query: 'japan',
          limit: isLoadMore ? 10 : 20, // Load 10 more posts when loading more, 20 on initial load
          shuffle: true,
          searchQuery: activeSearchQuery && activeSearchQuery.trim() ? activeSearchQuery.trim() : null,
        })

        // Ensure real posts have the necessary structure for translation
        const enhancedPosts = realPosts.map((post) => ({
          ...post,
          tags: post.tags || ["#tech", "#news"],
          difficulty: 3, // Default difficulty for real news (Advanced level)
          source: post.source || "reddit",
        }))

        if (isLoadMore) {
          // Filter out duplicates when loading more
          setPosts((prev) => {
            const existingUrls = new Set(prev.map((post) => post.url))
            const newPosts = enhancedPosts.filter(
              (post) => !existingUrls.has(post.url)
            )

            if (newPosts.length === 0) {
              setHasMorePosts(false)
              return prev
            } else {
              // Process new posts separately without depending on the callback
              if (userProfile?.learningLevel && newPosts.length > 0) {
                processPostsWithMixedLanguage(newPosts).then(
                  (processedNewPosts) => {
                    setProcessedPosts((prevProcessed) => [
                      ...prevProcessed,
                      ...processedNewPosts,
                    ])
                  }
                )
              }
              setCurrentPage((prevPage) => prevPage + 1)
              return [...prev, ...newPosts]
            }
          })
        } else {
          setPosts(enhancedPosts)
          // Process posts for mixed language content
          if (userProfile?.learningLevel && enhancedPosts.length > 0) {
            const processedPosts =
              await processPostsWithMixedLanguage(enhancedPosts)
            setProcessedPosts(processedPosts)
          } else {
            setProcessedPosts(enhancedPosts)
          }
        }
      } catch (err) {
        setError(err.message)
        console.error("Error loading posts:", err)
        // Show error instead of fallback to ensure real news only
        if (!isLoadMore) {
          setPosts([])
          setProcessedPosts([])
        }
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [
      selectedSources,
      apiStatus,
      userProfile?.learningLevel,
      processPostsWithMixedLanguage,
      activeSearchQuery,
    ]
  )

  // Load posts when sources, API status, user level, or search changes
  useEffect(() => {
    if (Object.keys(apiStatus).length > 0) {
      loadPosts()
    }
  }, [selectedSources, apiStatus, userProfile?.learningLevel, activeSearchQuery, loadPosts])

  // Scroll detection for "see more" button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.offsetHeight

      // Show "see more" button when user scrolls to bottom 200px
      const isNearBottom = scrollTop + windowHeight >= documentHeight - 200

      if (
        isNearBottom &&
        posts.length > 0 &&
        hasMorePosts &&
        !loading &&
        !loadingMore
      ) {
        setShowSeeMoreButton(true)
      } else {
        setShowSeeMoreButton(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [posts.length, hasMorePosts, loading, loadingMore])

  // Function to load more posts
  const handleLoadMore = () => {
    if (!loadingMore && hasMorePosts) {
      loadPosts(true)
      setShowSeeMoreButton(false) // Hide button after clicking
    }
  }

  // Map 1-5 levels to names
  const levelNames = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Native']
  const getLevelName = (level) => {
    return levelNames[level - 1] || 'Beginner'
  }

  const getLevelColor = (level) => {
    if (level === 1) return "bg-green-500"  // Beginner
    if (level === 2) return "bg-blue-500"   // Intermediate
    if (level === 3) return "bg-yellow-500" // Advanced
    if (level === 4) return "bg-orange-500" // Expert
    return "bg-red-500"                      // Native
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
      let wordToAdd

      if (selectedWord.showJapaneseTranslation) {
        // English word - add the Japanese translation to dictionary
        wordToAdd = {
          japanese: selectedWord.english, // Japanese translation
          hiragana: selectedWord.hiragana, // Katakana pronunciation
          english: selectedWord.japanese, // Original English word
          level: selectedWord.level,
          example: selectedWord.example,
          exampleEn: selectedWord.exampleEn,
          source: "Influent Post",
        }
      } else {
        // Japanese word - add normally
        wordToAdd = {
          japanese: selectedWord.japanese,
          hiragana: selectedWord.hiragana,
          english: selectedWord.english,
          level: selectedWord.level,
          example: selectedWord.example,
          exampleEn: selectedWord.exampleEn,
          source: "Influent Post",
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

  const handleMastered = () => {
    showFeedback("Sugoi!", "😊")
  }

  const handleFollowToggle = (authorName) => {
    setFollowingUsers((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(authorName)) {
        newSet.delete(authorName)
      } else {
        newSet.add(authorName)
      }
      return newSet
    })
  }

  const handleSourceToggle = (sourceId) => {
    setSelectedSources((prev) =>
      prev.includes(sourceId)
        ? prev.filter((id) => id !== sourceId)
        : [...prev, sourceId]
    )
  }

  const getSourceBadgeColor = (source) => {
    const colors = {
      reddit: "bg-red-500",
      newsapi: "bg-blue-500",
      guardian: "bg-blue-700",
    }
    return colors[source] || "bg-gray-500"
  }

  const handleSearch = (query) => {
    setSearchQuery(query)

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Debounce search to avoid too many API calls
    if (query.trim()) {
      setIsSearching(true)
      // Trigger search after user stops typing (800ms delay)
      searchTimeoutRef.current = setTimeout(() => {
        setActiveSearchQuery(query.trim())
        setIsSearching(false)
      }, 800)
    } else {
      // Clear search immediately if query is empty
      setActiveSearchQuery("")
      setIsSearching(false)
    }
  }

  const toggleComments = (articleId) => {
    setShowComments((prev) => ({
      ...prev,
      [articleId]: !prev[articleId],
    }))
  }

  // Get actual comment count for each article
  const getCommentCount = (articleId) => {
    const commentCounts = {
      1: 6, // Article 1 has 6 comments
      2: 6, // Article 2 has 6 comments
      3: 6, // Article 3 has 6 comments
      4: 6, // Article 4 has 6 comments
      5: 6, // Article 5 has 6 comments
      6: 6, // Article 6 has 6 comments
    }
    return commentCounts[articleId] || 0
  }

  const handleWordClick = async (word, isJapanese, context = null) => {
    await sharedHandleWordClick(
      word,
      setSelectedWord,
      isJapanese,
      context,
      null,
      setIsTranslating
    )
  }

  // Function to segment Japanese text into meaningful words/phrases
  const segmentJapaneseText = (text) => {
    // Define common Japanese word patterns and boundaries
    const wordPatterns = [
      // Multi-character words from our database (longest first)
      "地元の人だけが知る",
      "何世代にもわたって",
      "これらの",
      "family-run",
      "self-expression",
      "limited-time",
      "constantly",
      "Traditional",
      "businesses",
      "generation",
      "地元",
      "人だけが",
      "だけが",
      "知る",
      "ラーメン",
      "東京",
      "最も",
      "地区",
      "地下",
      "探索",
      "何世代",
      "にもわたって",
      "提供",
      "してきました",
      "若者",
      "creativity",
      "させています",
      "変化",
      "見られます",
      "文化",
      "伝統",
      "桜",
      "季節",
      "原宿",
      "渋谷",
      "大阪",
      "京都",
      "九州",
      "古い",
      "生活",
      "tradition",
      "elements",
      "products",
      "visitors",
      "attract",
      "Young",
      "people",
      "Tokyo",
      "modern",
      "trends",
      "fusion",
      "Sakura",
      "tourism",
      "industry",
      "massive",
      "boost",
      "Local",
      "special",
      "events",
      "hidden",
      "culture",
      "business",
      "authentic",
      "style",
      // Common particles and grammar
      "の",
      "が",
      "は",
      "を",
      "に",
      "で",
      "と",
      "も",
    ]

    const result = []
    let remaining = text

    while (remaining.length > 0) {
      let matched = false

      // Try to match longer patterns first
      for (const pattern of wordPatterns.sort((a, b) => b.length - a.length)) {
        if (remaining.startsWith(pattern)) {
          result.push({ text: pattern, isWord: true })
          remaining = remaining.slice(pattern.length)
          matched = true
          break
        }
      }

      if (!matched) {
        // If no pattern matches, take one character
        result.push({ text: remaining[0], isWord: false })
        remaining = remaining.slice(1)
      }
    }

    return result
  }

  const [translationStates, setTranslationStates] = useState({})

  // Utility to decode HTML entities and clean text
  const decodeHTMLEntities = (text) => {
    const textarea = document.createElement('textarea')
    textarea.innerHTML = text
    return textarea.value
  }

  // Parse markdown-style links and format text
  const parseMarkdownContent = (text, postId = null) => {
    if (!text) return ""

    // Decode HTML entities
    let cleaned = decodeHTMLEntities(text)

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
            {parseLineContent(quoteLine, postId)}
          </div>
        )
        return
      }

      // Regular line
      elements.push(
        <span key={`line-${lineIndex}`}>
          {parseLineContent(line, postId)}
          {lineIndex < lines.length - 1 && <br />}
        </span>
      )
    })

    return elements
  }

  // Parse inline content (links, bold, etc.) within a line - WITH clickable words
  const parseLineContent = (text, postId = null) => {
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

  // Toggle post expansion
  const togglePostExpansion = (postId) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }

  // Check if content should be truncated
  const shouldTruncateContent = (content) => {
    if (!content) return false
    const wordCount = content.split(/\s+/).length
    return wordCount > 100
  }

  // Truncate content to word limit
  const truncateContent = (content, wordLimit = 100) => {
    if (!content) return ""
    const words = content.split(/\s+/)
    if (words.length <= wordLimit) return content
    return words.slice(0, wordLimit).join(' ') + '...'
  }

  const toggleTranslation = (postId, wordIndex) => {
    const key = `${postId}-${wordIndex}`
    setTranslationStates((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const renderClickableText = (text, postId = null) => {
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

        // Determine what to show: if toggled, flip the default; if not toggled, use default
        const showJapanese = isToggled ? !wordData.showJapanese : wordData.showJapanese
        const displayText = showJapanese ? wordData.translation : wordData.original

        parts.push(
          <span
            key={`word-${wordData.index}`}
            className="cursor-pointer hover:bg-green-200 border-b-2 border-green-400 hover:border-green-600 rounded px-1 py-0.5 transition-all duration-200 font-medium bg-green-50"
            onClick={() => {
              if (postId) toggleTranslation(postId, wordData.index)
              handleWordClick(showJapanese ? wordData.translation : wordData.original, showJapanese, remainingText)
            }}
            title={
              showJapanese
                ? `🇯🇵 Japanese: Click to see English "${wordData.original}"`
                : `📚 English: Click to see Japanese "${wordData.translation}"`
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
      const hasEnglish = /[a-zA-Z]/.test(segment)

      if (hasJapanese) {
        // Use intelligent segmentation for Japanese text
        const words = segmentJapaneseText(segment)

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
                  onClick={() => handleWordClick(text, true, text)}
                  title={
                    isTranslatedWord
                      ? `🇯🇵 Translated: Click to see English "${text}"`
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

  if (!selectedCountry) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🌍</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Welcome to Influent
          </h3>
          <p className="text-gray-600">
            Discover authentic content from around the world. Starting with
            Japanese, expanding globally!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Country Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Learning Feed</h1>
            <p className="text-gray-600">
              Real news with interactive translation - Click any word to learn!
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadPosts}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
            <div className="text-4xl">🎓</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            {isSearching && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
              </div>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            {/* Sources Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                News Sources
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(apiStatus).map(([sourceId, config]) => (
                  <label
                    key={sourceId}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSources.includes(sourceId)}
                      onChange={() => handleSourceToggle(sourceId)}
                      disabled={!config.enabled || !config.hasApiKey}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span
                      className={`text-sm ${
                        !config.enabled || !config.hasApiKey
                          ? "text-gray-400"
                          : "text-gray-700"
                      }`}
                    >
                      {config.name}
                      {(!config.enabled || !config.hasApiKey) && sourceId !== 'reddit' && (
                        <span className="text-xs text-red-500 ml-1">
                          (API key needed)
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Japanese Word Learning Popup */}
      {(selectedWord || isTranslating) && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setSelectedWord(null)
            setIsTranslating(false)
          }}
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
                {/* Word Display - handles both Japanese and English words bidirectionally */}
                <div className="mb-4">
                  {selectedWord.showJapaneseTranslation ? (
                    // English word clicked -> show Japanese translation
                    <>
                      <div className="text-sm text-gray-500 mb-1">
                        English word:
                      </div>
                      <div className="text-2xl font-bold text-blue-600 mb-2">
                        {selectedWord.english}
                      </div>
                      <div className="text-sm text-gray-500 mb-1">
                        Japanese translation:
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {selectedWord.japanese}
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
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        {selectedWord.japanese}
                      </div>
                      {selectedWord.hiragana !== selectedWord.japanese && (
                        <div className="text-lg text-gray-600 mb-2">
                          {selectedWord.hiragana}
                        </div>
                      )}
                      <div className="text-sm text-gray-500 mb-1">
                        English translation:
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {selectedWord.english}
                      </div>
                    </>
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
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        📚 Vocabulary Word
                      </span>
                    )}
                    {selectedWord.wordType && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        {selectedWord.wordType}
                      </span>
                    )}
                    {selectedWord.isApiTranslated &&
                      !selectedWord.isVocabulary && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
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
                    className="w-full bg-green-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors"
                    onClick={handleMastered}
                  >
                    Mastered! ✨
                  </button>
                  <button
                    className="w-full bg-blue-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1"
                    onClick={handleAddToDictionary}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Add to My Dictionary</span>
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
                      <div className="mt-3 text-sm text-green-600 flex items-center justify-center space-x-1">
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
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Loading latest posts..." />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-700 font-medium mb-2">
            Error Loading Posts
          </div>
          <div className="text-red-600 text-sm mb-4">{error}</div>
          <button
            onClick={loadPosts}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Processing indicator */}
      {processingPosts && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            <span className="text-blue-700 text-sm font-medium">
              Creating mixed language content based on your level{" "}
              {userProfile?.learningLevel}...
            </span>
          </div>
        </div>
      )}

      {/* Posts */}
      {!loading &&
        !error &&
        (processedPosts.length > 0 ? processedPosts : posts).map((article) => (
          <div
            key={article.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
          >
            {/* Article Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-orange-700">
                      {article.author.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {article.author}
                      </span>
                      {article.verified && (
                        <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                          Verified
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {article.location || article.source} •{" "}
                      {article.time ||
                        new Date(article.publishedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleFollowToggle(article.author)}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      followingUsers.has(article.author)
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                    }`}
                  >
                    {followingUsers.has(article.author) ? (
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
                    href={article.externalUrl || article.url}
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
                  {article.isMixedLanguage && (
                    <span className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                      🇯🇵 {getLevelName(userProfile?.learningLevel || 1)}
                    </span>
                  )}
                  {article.difficulty && (
                    <span className={`${getLevelColor(article.difficulty)} text-white px-2 py-1 rounded text-xs font-medium`}>
                      {getLevelName(article.difficulty)}
                    </span>
                  )}
                  {article.source && (
                    <span
                      className={`text-white px-2 py-1 rounded text-xs font-medium ${getSourceBadgeColor(article.source)}`}
                    >
                      {apiStatus[article.source]?.name || article.source}
                    </span>
                  )}
                </div>
              </div>

              {/* Article Content */}
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  {renderClickableText(article.title, `${article.id}-title`)}
                </h2>
                <div className="text-gray-800 leading-relaxed mb-4 whitespace-pre-wrap">
                  {article.content ? (
                    <>
                      {expandedPosts[article.id] || !shouldTruncateContent(article.content) ? (
                        <div>{parseMarkdownContent(article.content, `${article.id}-content`)}</div>
                      ) : (
                        <div>{parseMarkdownContent(truncateContent(article.content), `${article.id}-content`)}</div>
                      )}
                      {shouldTruncateContent(article.content) && (
                        <button
                          onClick={() => togglePostExpansion(article.id)}
                          className="text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block"
                        >
                          {expandedPosts[article.id] ? 'See Less' : 'See More'}
                        </button>
                      )}
                    </>
                  ) : ""}
                </div>

                {article.image && (
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                )}
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {article.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Engagement Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-6">
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors">
                    <Bookmark className="w-5 h-5" />
                    <span className="text-sm font-medium">Save</span>
                  </button>
                  <button
                    onClick={() => toggleComments(article.id)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {article.comments || getCommentCount(article.id) || 0}{" "}
                      comments
                    </span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-green-500 transition-colors">
                    <Share className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {article.shares || "Share"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Enhanced Comment System */}
            {showComments[article.id] && (
              <EnhancedCommentSystem
                articleId={article.id}
                postContent={article.content}
                postTitle={article.title}
                userProfile={userProfile}
                userDictionary={userDictionary}
                onAddWordToDictionary={onAddWordToDictionary}
              />
            )}
          </div>
        ))}

      {/* See More Button - shows when user scrolls near bottom */}
      {showSeeMoreButton && hasMorePosts && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-full shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 font-medium"
          >
            {loadingMore ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>See More</span>
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
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      )}

      {/* Loading More indicator */}
      {loadingMore && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" text="Loading more posts..." />
        </div>
      )}

      {/* No more posts message */}
      {!hasMorePosts &&
        (processedPosts.length > 0 ? processedPosts : posts).length > 0 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center space-x-2 text-gray-500">
              <span className="text-2xl">🎉</span>
              <span className="font-medium">
                You've reached the end! Check back later for more posts.
              </span>
            </div>
          </div>
        )}
    </div>
  )
}

export default NewsFeed
