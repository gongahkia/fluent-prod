import {
  Bookmark,
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
import { savePost } from "../services/databaseService"
import { useAuth } from "../contexts/AuthContext"
import EnhancedCommentSystem from "./EnhancedCommentSystem"
import WordLearningPopup from "./NewsFeed/WordLearningPopup"
import { createRenderClickableText, parseMarkdownContent } from "./NewsFeed/renderingUtils"
import { shouldTruncateContent, truncateContent } from "./NewsFeed/utils/textParsing"
import LoadingSpinner from "./ui/LoadingSpinner"

const NewsFeed = ({
  selectedCountry,
  userProfile,
  onAddWordToDictionary,
  userDictionary,
}) => {
  const { currentUser } = useAuth()
  const [showComments, setShowComments] = useState({})
  const [selectedWord, setSelectedWord] = useState(null)
  const [feedbackMessage, setFeedbackMessage] = useState(null)
  const [followingUsers, setFollowingUsers] = useState(new Set())
  const [isTranslating, setIsTranslating] = useState(false)
  const [posts, setPosts] = useState([])
  const [processedPosts, setProcessedPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [processingPosts, setProcessingPosts] = useState(false)
  const [minPostsLoaded, setMinPostsLoaded] = useState(false)
  const [selectedSources, setSelectedSources] = useState(["reddit"])
  const [showSettings, setShowSettings] = useState(false)
  const [apiStatus, setApiStatus] = useState({})
  const [, setCurrentPage] = useState(1)
  const [hasMorePosts, setHasMorePosts] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [showSeeMoreButton, setShowSeeMoreButton] = useState(false)
  const [offset, setOffset] = useState(0)
  const [totalCachedPosts, setTotalCachedPosts] = useState(0)

  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [activeSearchQuery, setActiveSearchQuery] = useState("")
  const searchTimeoutRef = useRef(null)
  const [expandedPosts, setExpandedPosts] = useState({})
  const [savedPostIds, setSavedPostIds] = useState(new Set())
  const [savingPost, setSavingPost] = useState(null)
  const [sharePopup, setSharePopup] = useState(null)

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
        // Don't set fallback - show error instead
        setError('Failed to connect to backend API. Please ensure the server is running.')
        setLoading(false)
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
  // Now processes posts in parallel and updates state progressively
  const processPostsWithMixedLanguage = useCallback(
    async (postsToProcess, isLoadMore = false) => {
      if (!userProfile?.learningLevel || !postsToProcess.length) {
        return postsToProcess
      }

      setProcessingPosts(true)
      const targetLangCode = userProfile.targetLanguage === 'Korean' ? 'ko' : 'ja'

      // Process posts asynchronously
      const processPromises = postsToProcess.map(async (post, index) => {
        try {
          // Check if post already contains target language
          const containsTargetLang = translationService.containsTargetLanguage(post.title, targetLangCode)

          // Only process English content and create mixed content
          const processedTitle = containsTargetLang
            ? post.title
            : await translationService.createMixedLanguageContent(
                post.title,
                userProfile.learningLevel,
                targetLangCode
              )

          const processedContent =
            post.content && !translationService.containsTargetLanguage(post.content, targetLangCode)
              ? await translationService.createMixedLanguageContent(
                  post.content,
                  userProfile.learningLevel,
                  targetLangCode
                )
              : post.content

          console.log(`Mixed content created for post "${post.title}":`, {
            originalTitle: post.title,
            processedTitle: processedTitle,
            originalContent: post.content?.substring(0, 100) + "...",
            processedContent: processedContent?.substring(0, 100) + "...",
            learningLevel: userProfile.learningLevel,
          })

          const processedPost = {
            ...post,
            originalTitle: post.title,
            originalContent: post.content,
            title: processedTitle,
            content: processedContent,
            isMixedLanguage: true,
          }

          return { post: processedPost, index }
        } catch (error) {
          console.warn("Failed to process post for mixed language:", error)
          // Fallback to original post if processing fails
          const fallbackPost = {
            ...post,
            originalTitle: post.title,
            originalContent: post.content,
            isMixedLanguage: false,
          }
          return { post: fallbackPost, index }
        }
      })

      // For initial load: show first 3 ASAP, then add rest as they complete
      if (!isLoadMore) {
        const initialBatchSize = 3

        // Wait only for first 3 posts
        Promise.all(processPromises.slice(0, initialBatchSize)).then((firstResults) => {
          const firstBatch = firstResults
            .sort((a, b) => a.index - b.index)
            .map(r => r.post)

          setProcessedPosts(firstBatch)
          setMinPostsLoaded(true)
        })

        // Process remaining posts and add them progressively
        if (processPromises.length > initialBatchSize) {
          processPromises.slice(initialBatchSize).forEach((promise) => {
            promise.then((result) => {
              setProcessedPosts((prev) => [...prev, result.post])
            })
          })
        }
      } else {
        // For "load more": add posts one by one as they complete
        processPromises.forEach((promise) => {
          promise.then((result) => {
            setProcessedPosts((prev) => [...prev, result.post])
          })
        })
      }

      // Wait for all to complete before returning
      const results = await Promise.all(processPromises)
      setProcessingPosts(false)
      return results.map(r => r.post)
    },
    [userProfile?.learningLevel, userProfile?.targetLanguage]
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
        setOffset(0)
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

        // Determine query based on target language
        let defaultQuery;
        switch (userProfile?.targetLanguage) {
          case 'Korean':
            defaultQuery = 'korea';
            break;
          case 'Japanese':
            defaultQuery = 'japan';
            break;
          default:
            defaultQuery = 'japan'; // Fallback to japan for now
            break;
        }

        const initialPostLimit = 10;
        const loadMorePostLimit = 5;

        const currentOffset = isLoadMore ? offset : 0;

        // Determine target language code
        const targetLangCode = userProfile?.targetLanguage === 'Korean' ? 'ko' : 'ja';

        const result = await fetchPosts({
          sources: enabledSources,
          query: defaultQuery,
          limit: isLoadMore ? loadMorePostLimit : initialPostLimit,
          shuffle: !isLoadMore, // Only shuffle on initial load
          searchQuery: activeSearchQuery && activeSearchQuery.trim() ? activeSearchQuery.trim() : null,
          offset: currentOffset,
          userLevel: userProfile?.learningLevel || null,
          targetLang: targetLangCode
        })

        const realPosts = result.posts || []
        const metadata = result.metadata || {}

        // Update total cached posts count
        if (metadata.totalCount !== undefined) {
          setTotalCachedPosts(metadata.totalCount)
        }

        // Update hasMore based on metadata
        if (metadata.hasMore !== undefined) {
          setHasMorePosts(metadata.hasMore)
        }

        // Ensure real posts have the necessary structure for translation
        const enhancedPosts = realPosts.map((post) => ({
          ...post,
          tags: post.tags || ["#tech", "#news"],
          // difficulty is now calculated by backend
          source: post.source,
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
              setCurrentPage((prevPage) => prevPage + 1)
              // Update offset for next load
              setOffset(currentOffset + newPosts.length)
              // Add new posts directly to processed posts (no frontend processing needed)
              setProcessedPosts((prev) => [...prev, ...newPosts])
              return [...prev, ...newPosts]
            }
          })
        } else {
          setPosts(enhancedPosts)
          // Set processed posts directly (backend already processed them)
          setProcessedPosts(enhancedPosts)
          setMinPostsLoaded(true)
          // Set initial offset
          setOffset(enhancedPosts.length)
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
        // Only hide loading state if we're loading more, or if minimum posts are loaded
        if (isLoadMore) {
          setLoadingMore(false)
        }
        // For initial load, wait for minPostsLoaded to be true before hiding loading
      }
    },
    [
      selectedSources,
      apiStatus,
      userProfile?.learningLevel,
      processPostsWithMixedLanguage,
      activeSearchQuery,
      offset,
    ]
  )

  // Load posts when sources, API status, user level, or search changes
  // Use ref to track if we should reload posts
  const shouldReloadRef = useRef(true)
  const prevDepsRef = useRef({
    selectedSources: [],
    apiStatusKeys: [],
    learningLevel: null,
    activeSearchQuery: ''
  })

  useEffect(() => {
    if (Object.keys(apiStatus).length === 0) return

    // Check if dependencies actually changed
    const currentDeps = {
      selectedSources: selectedSources.join(','),
      apiStatusKeys: Object.keys(apiStatus).sort().join(','),
      learningLevel: userProfile?.learningLevel,
      activeSearchQuery
    }

    const prevDeps = prevDepsRef.current
    const depsChanged =
      currentDeps.selectedSources !== prevDeps.selectedSources ||
      currentDeps.apiStatusKeys !== prevDeps.apiStatusKeys ||
      currentDeps.learningLevel !== prevDeps.learningLevel ||
      currentDeps.activeSearchQuery !== prevDeps.activeSearchQuery

    if (depsChanged || shouldReloadRef.current) {
      loadPosts()
      prevDepsRef.current = currentDeps
      shouldReloadRef.current = false
    }
  }, [selectedSources, apiStatus, userProfile?.learningLevel, activeSearchQuery])

  // Turn off loading state when minimum posts are loaded
  useEffect(() => {
    if (minPostsLoaded && loading) {
      setLoading(false)
    }
  }, [minPostsLoaded, loading])

  // Scroll detection for "see more" button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.offsetHeight

      // Show "see more" button when user scrolls to bottom 200px
      const isNearBottom = scrollTop + windowHeight >= documentHeight - 200

      // Don't show button if user is translating/processing
      if (
        isNearBottom &&
        posts.length > 0 &&
        hasMorePosts &&
        !loading &&
        !loadingMore &&
        !processingPosts &&
        !selectedWord &&
        !isTranslating
      ) {
        setShowSeeMoreButton(true)
      } else {
        setShowSeeMoreButton(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [posts.length, hasMorePosts, loading, loadingMore, processingPosts, selectedWord, isTranslating])

  // Function to load more posts
  const handleLoadMore = () => {
    // Don't load more if user is actively translating (processing posts or has translation popup open)
    if (!loadingMore && hasMorePosts && !processingPosts && !selectedWord && !isTranslating) {
      loadPosts(true)
      setShowSeeMoreButton(false) // Hide button after clicking
    }
  }

  // Map 1-5 levels to names - needed for post difficulty badges
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
      const targetLang = userProfile?.targetLanguage || 'Japanese'
      let wordToAdd

      if (targetLang === 'Korean') {
        if (selectedWord.showKoreanTranslation) {
          // English word - add the Korean translation to dictionary
          wordToAdd = {
            korean: selectedWord.english, // Korean translation
            romanization: selectedWord.romanization,
            english: selectedWord.korean, // Original English word
            level: selectedWord.level,
            example: selectedWord.example,
            exampleEn: selectedWord.exampleEn,
            source: "Fluent Post",
          }
        } else {
          // Korean word - add normally
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
        // Japanese
        if (selectedWord.showJapaneseTranslation) {
          // English word - add the Japanese translation to dictionary
          wordToAdd = {
            japanese: selectedWord.english, // Japanese translation
            hiragana: selectedWord.hiragana, // Katakana pronunciation
            english: selectedWord.japanese, // Original English word
            level: selectedWord.level,
            example: selectedWord.example,
            exampleEn: selectedWord.exampleEn,
            source: "Fluent Post",
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

  const handleSavePost = async (article) => {
    if (!currentUser) {
      alert('Please sign in to save posts')
      return
    }

    if (savedPostIds.has(article.id)) {
      alert('Post already saved!')
      return
    }

    setSavingPost(article.id)

    try {
      const postData = {
        id: article.id,
        title: article.title,
        content: article.content,
        author: article.author,
        url: article.url,
        image: article.image,
        source: article.source,
        publishedAt: article.publishedAt,
      }

      const result = await savePost(currentUser.uid, postData)

      if (result.success) {
        setSavedPostIds(prev => new Set([...prev, article.id]))
        showFeedback('Post saved! ✓', '📌')
      } else {
        alert('Failed to save post: ' + result.error)
      }
    } catch (error) {
      console.error('Error saving post:', error)
      alert('Failed to save post')
    } finally {
      setSavingPost(null)
    }
  }

  const handleSharePost = async (article) => {
    const shareUrl = article.externalUrl || article.url
    const shareTitle = article.title

    // Show share popup
    setSharePopup({
      url: shareUrl,
      title: shareTitle,
      id: article.id
    })
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      showFeedback('Link copied! ✓', '🔗')
      setSharePopup(null)
    } catch (error) {
      console.error('Failed to copy:', error)
      alert('Failed to copy link')
    }
  }

  // Get actual comment count for each article
  const getCommentCount = (articleId) => {
    // Return 0 if no comment count available - no hardcoded values
    return 0
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

  const [translationStates, setTranslationStates] = useState({})

  // Toggle post expansion
  const togglePostExpansion = (postId) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }

  const toggleTranslation = (postId, wordIndex) => {
    const key = `${postId}-${wordIndex}`
    setTranslationStates((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  // Create renderClickableText function using the factory
  const renderClickableText = createRenderClickableText(translationStates, toggleTranslation, handleWordClick, userProfile?.targetLanguage || 'Japanese')

  if (!selectedCountry) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🌍</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Welcome to Fluent
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
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
            </button>
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

      {/* Share Popup */}
      {sharePopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Post</h3>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{sharePopup.title}</p>

            <div className="space-y-3">
              <button
                onClick={() => copyToClipboard(sharePopup.url)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Copy Link</span>
              </button>

              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(sharePopup.url)}&text=${encodeURIComponent(sharePopup.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Share on Twitter</span>
              </a>

              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(sharePopup.url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-blue-800 text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Share on Facebook</span>
              </a>

              <button
                onClick={() => setSharePopup(null)}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
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
        (processedPosts.length > 0 ? processedPosts : posts).map((article, index) => (
          <div
            key={article.id || article.url || `post-${index}`}
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
                        <div>{parseMarkdownContent(article.content, `${article.id}-content`, renderClickableText)}</div>
                      ) : (
                        <div>{parseMarkdownContent(truncateContent(article.content), `${article.id}-content`, renderClickableText)}</div>
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
                  <button
                    onClick={() => handleSavePost(article)}
                    disabled={savingPost === article.id || savedPostIds.has(article.id)}
                    className={`flex items-center space-x-2 transition-colors ${
                      savedPostIds.has(article.id)
                        ? 'text-orange-500'
                        : 'text-gray-600 hover:text-orange-500'
                    }`}
                  >
                    <Bookmark className={`w-5 h-5 ${savedPostIds.has(article.id) ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium">
                      {savingPost === article.id ? 'Saving...' : savedPostIds.has(article.id) ? 'Saved' : 'Save'}
                    </span>
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
                  <button
                    onClick={() => handleSharePost(article)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-green-500 transition-colors"
                  >
                    <Share className="w-5 h-5" />
                    <span className="text-sm font-medium">Share</span>
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
            <div className="inline-flex flex-col items-center space-y-2 text-gray-500">
              <span className="text-2xl">📚</span>
              <span className="font-medium">
                All cached posts currently displayed
              </span>
              {totalCachedPosts > 0 && (
                <span className="text-sm text-gray-400">
                  {(processedPosts.length > 0 ? processedPosts : posts).length} of {totalCachedPosts} posts shown
                </span>
              )}
            </div>
          </div>
        )}
    </div>
  )
}

export default NewsFeed
