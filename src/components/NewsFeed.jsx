import {
  Bookmark,
  Globe,
  MessageCircle,
  RefreshCw,
  Share,
  UserCheck,
  UserPlus,
  MoreVertical,
} from "lucide-react"
import React, { useCallback, useEffect, useRef, useState } from "react"
import { handleWordClick as sharedHandleWordClick } from "../lib/wordDatabase"
import { checkApiConfiguration, fetchPosts } from "../services/newsService"
import translationService from "../services/translationService"
import { savePost, getSavedPosts } from "../services/firebaseDatabaseService"
import { useAuth } from "../contexts/AuthContext"
import EnhancedCommentSystem from "./EnhancedCommentSystem"
import WordLearningPopup from "./NewsFeed/WordLearningPopup"
import PostSettingsModal from "./PostSettingsModal"
import { createRenderClickableText, parseMarkdownContent } from "./NewsFeed/renderingUtils"
import { shouldTruncateContent, truncateContent } from "./NewsFeed/utils/textParsing"
import LoadingSpinner from "./ui/LoadingSpinner"
import { FeedSkeleton } from "./ui/skeleton"

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
  const [subscribedSources, setSubscribedSources] = useState(new Set())
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
  const [settingsModalPost, setSettingsModalPost] = useState(null)
  const [hiddenPosts, setHiddenPosts] = useState(new Set())
  const [isSearching, setIsSearching] = useState(false)
  const [activeSearchQuery, setActiveSearchQuery] = useState("")
  const searchTimeoutRef = useRef(null)
  const [expandedPosts, setExpandedPosts] = useState({})
  const [savedPostIds, setSavedPostIds] = useState(new Set())
  const [savingPost, setSavingPost] = useState(null)

  // Check API configuration on component mount
  // Load saved posts on mount
  useEffect(() => {
    const loadSavedPosts = async () => {
      if (!currentUser) return

      try {
        const result = await getSavedPosts(currentUser.id)
        if (result.success) {
          const savedIds = new Set(result.data.map(post => post.postHash || post.postId || post.id))
          setSavedPostIds(savedIds)
        }
      } catch (error) {
        console.error('Failed to load saved posts:', error)
      }
    }

    loadSavedPosts()
  }, [currentUser])

  useEffect(() => {
    if (import.meta.env.VITE_NEWS_MODE === 'cache') {
      // No backend in cache mode
      return
    }

    const loadApiStatus = async (retryCount = 0) => {
      const MAX_RETRIES = 3
      const RETRY_DELAY = 2000 // 2 seconds

      try {
        const sources = await checkApiConfiguration()
        // Convert array to object keyed by source id
        const statusMap = {}
        sources.forEach(source => {
          statusMap[source.id] = source
        })
        setApiStatus(statusMap)
        console.log('API configuration loaded successfully:', statusMap)
      } catch (error) {
        console.error(`Failed to load API status (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, error)

        // Retry logic - backend might still be starting up
        if (retryCount < MAX_RETRIES) {
          console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`)
          setTimeout(() => loadApiStatus(retryCount + 1), RETRY_DELAY)
        } else {
          // All retries exhausted - show error
          setError('Failed to connect to backend API. Please ensure the server is running.')
          setLoading(false)
        }
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
  // OPTIMIZATION: Backend now pre-processes posts, so we just use them directly
  const processPostsWithMixedLanguage = useCallback(
    async (postsToProcess, isLoadMore = false) => {
      if (!postsToProcess.length) {
        return postsToProcess
      }

      // Check if posts are already pre-processed by backend (have isMixedLanguage flag)
      const alreadyProcessed = postsToProcess.some(post => post.isMixedLanguage === true)
      
      if (alreadyProcessed) {
        console.log('Using pre-processed posts from backend cache')
        setProcessingPosts(false)
        setMinPostsLoaded(true)
        return postsToProcess
      }

      // Fallback: Process on frontend if backend didn't pre-process
      // This maintains backward compatibility
      if (!userProfile?.learningLevel) {
        setMinPostsLoaded(true)
        return postsToProcess
      }

      console.warn('Posts not pre-processed by backend, processing on frontend (slower)')
      setProcessingPosts(true)
      const targetLangCode = 'ja'

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
          const fallbackPost = {
            ...post,
            originalTitle: post.title,
            originalContent: post.content,
            isMixedLanguage: false,
          }
          return { post: fallbackPost, index }
        }
      })

      // Wait for all to complete
      const results = await Promise.all(processPromises)
      setProcessingPosts(false)
      setMinPostsLoaded(true)
      return results.map(r => r.post)
    },
    [userProfile?.learningLevel, userProfile?.targetLanguage]
  )

  // Load real posts from APIs
  const loadPosts = useCallback(
    async (isLoadMore = false) => {
      const isCacheMode = import.meta.env.VITE_NEWS_MODE === 'cache'

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
        // Cache mode doesn't use backend/API status checks.
        const enabledSources = isCacheMode
          ? selectedSources
          : selectedSources.filter(
              (source) => apiStatus[source]?.enabled && apiStatus[source]?.configured
            )

        if (!isCacheMode && enabledSources.length === 0) {
          throw new Error(
            "No enabled sources available. Please check your API configuration."
          )
        }

        if (import.meta.env.DEV) {
          console.log('[NewsFeed] loadPosts start', {
            mode: isCacheMode ? 'cache' : 'api',
            isLoadMore,
            enabledSources,
            selectedSources,
            offset: isLoadMore ? offset : 0,
            targetLanguage: userProfile?.targetLanguage || null,
            learningLevel: userProfile?.learningLevel || null,
            activeSearchQuery,
          })
        }

        // Japanese-only
        const defaultQuery = 'japan'

        // Load 50 posts initially, then 25 more each time
        const initialPostLimit = 50;
        const loadMorePostLimit = 25;

        const currentOffset = isLoadMore ? offset : 0;

        // Determine target language code
        const targetLangCode = 'ja';

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

        if (import.meta.env.DEV) {
          console.log('[NewsFeed] fetchPosts result', {
            mode: isCacheMode ? 'cache' : 'api',
            postsCount: result?.posts?.length || 0,
            totalCount: result?.metadata?.totalCount,
            hasMore: result?.metadata?.hasMore,
            cacheUrl: result?.metadata?.cacheUrl,
            cacheSha256: result?.metadata?.cacheSha256,
          })
        }

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
      userProfile?.targetLanguage,
      processPostsWithMixedLanguage,
      activeSearchQuery,
      offset,
    ]
  )

  // Load posts when sources, API status, user level, target language, or search changes
  // Use ref to track if we should reload posts
  const shouldReloadRef = useRef(true)
  const prevDepsRef = useRef({
    selectedSources: [],
    apiStatusKeys: [],
    learningLevel: null,
    targetLanguage: null,
    activeSearchQuery: ''
  })

  useEffect(() => {
    const isCacheMode = import.meta.env.VITE_NEWS_MODE === 'cache'
    if (!isCacheMode && Object.keys(apiStatus).length === 0) return

    // Check if dependencies actually changed
    const currentDeps = {
      selectedSources: selectedSources.join(','),
      apiStatusKeys: isCacheMode ? 'cache-mode' : Object.keys(apiStatus).sort().join(','),
      learningLevel: userProfile?.learningLevel,
      targetLanguage: userProfile?.targetLanguage,
      activeSearchQuery
    }

    const prevDeps = prevDepsRef.current
    const depsChanged =
      currentDeps.selectedSources !== prevDeps.selectedSources ||
      currentDeps.apiStatusKeys !== prevDeps.apiStatusKeys ||
      currentDeps.learningLevel !== prevDeps.learningLevel ||
      currentDeps.targetLanguage !== prevDeps.targetLanguage ||
      currentDeps.activeSearchQuery !== prevDeps.activeSearchQuery

    if (depsChanged || shouldReloadRef.current) {
      if (import.meta.env.DEV) {
        console.log('[NewsFeed] deps change -> loadPosts', {
          mode: isCacheMode ? 'cache' : 'api',
          depsChanged,
          currentDeps,
        })
      }
      // Log language change for debugging
      if (currentDeps.targetLanguage !== prevDeps.targetLanguage && prevDeps.targetLanguage) {
        console.log(`Language changed: ${prevDeps.targetLanguage} -> ${currentDeps.targetLanguage}`)
        // Clear posts immediately on language change for better UX
        setPosts([])
        setProcessedPosts([])
      }
      
      console.log('Dependencies changed, reloading posts:', {
        targetLanguage: currentDeps.targetLanguage,
        learningLevel: currentDeps.learningLevel
      })
      loadPosts()
      prevDepsRef.current = currentDeps
      shouldReloadRef.current = false
    }
  }, [selectedSources, apiStatus, userProfile?.learningLevel, userProfile?.targetLanguage, activeSearchQuery, loadPosts])

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
        // English word - add the Japanese translation to dictionary
        wordToAdd = {
          japanese: selectedWord.english,
          hiragana: selectedWord.hiragana,
          english: selectedWord.japanese,
          level: selectedWord.level,
          example: selectedWord.example,
          exampleEn: selectedWord.exampleEn,
          source: "Fluent Post",
          postHash: selectedWord.postHash || null,
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
          postHash: selectedWord.postHash || null,
        }
      }

      const exists = userDictionary.some((word) => word.japanese === wordToAdd.japanese)

      if (!exists) {
        onAddWordToDictionary(wordToAdd)
        showFeedback("Saved Word!", "")
      } else {
        showFeedback("Already saved!", "")
      }
    }
  }

  const handleMastered = () => {
    showFeedback("Sugoi!", "")
  }

  const handleSourceSubscribeToggle = (sourceName) => {
    setSubscribedSources((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sourceName)) {
        newSet.delete(sourceName)
        // Optionally: Save to Firebase or localStorage
        showFeedback(`Unsubscribed from ${sourceName}`, '')
      } else {
        newSet.add(sourceName)
        // Optionally: Save to Firebase or localStorage
        showFeedback(`Subscribed to ${sourceName}`, '')
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
      newsapi: "bg-orange-500",
      guardian: "bg-orange-700",
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
        postHash: article.postHash || article.id,
        postId: article.postHash || article.id,
        title: article.title,
        content: article.content,
        author: article.author,
        url: article.url,
        image: article.image,
        source: article.source,
        publishedAt: article.publishedAt,
      }

      const result = await savePost(currentUser.id, postData)

      if (result.success) {
        setSavedPostIds(prev => new Set([...prev, article.id]))
        showFeedback('Post saved!', '')
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

    // Try native share API first (mobile-friendly)
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          url: shareUrl
        })
        showFeedback('Post shared!', '')
      } catch (error) {
        // User cancelled or error - ignore
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error)
          // Fallback to clipboard
          copyToClipboard(shareUrl)
        }
      }
    } else {
      // Fallback: copy to clipboard
      copyToClipboard(shareUrl)
    }
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      showFeedback('Link copied to clipboard!', '')
    } catch (error) {
      console.error('Failed to copy:', error)
      showFeedback('Failed to copy link', '')
    }
  }

  const handleOpenSettings = (post) => {
    setSettingsModalPost(post)
  }

  const handleCloseSettings = () => {
    setSettingsModalPost(null)
  }

  const handleNotInterested = (postId) => {
    setHiddenPosts(prev => new Set([...prev, postId]))
    setSettingsModalPost(null)
  }

  const handleReportPost = (postId) => {
    console.log('Post reported:', postId)
    // In a real app, this would send a report to the backend
  }

  // Get actual comment count for each article
  const getCommentCount = (articleId) => {
    // Return 0 if no comment count available - no hardcoded values
    return 0
  }

  const handleWordClick = async (word, isJapanese, context = null, event = null) => {
    // Capture click position if event is provided
    const clickPosition = event ? {
      x: event.clientX,
      y: event.clientY,
      elementRect: event.target.getBoundingClientRect()
    } : null

    await sharedHandleWordClick(
      word,
      setSelectedWord,
      isJapanese,
      context,
      null,
      setIsTranslating,
      userProfile?.targetLanguage || 'Japanese',
      clickPosition
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
            <Globe className="w-8 h-8 text-orange-600" aria-hidden="true" />
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
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
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
        />
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
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
            <span className="text-orange-700 text-sm font-medium">
              Creating mixed language content based on your level{" "}
              {userProfile?.learningLevel}...
            </span>
          </div>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && !error && (
        <FeedSkeleton count={5} />
      )}

      {/* Posts - Unified Feed with Separator Lines */}
      {!loading && !error && (processedPosts.length > 0 || posts.length > 0) && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {(processedPosts.length > 0 ? processedPosts : posts)
          .filter(article => !hiddenPosts.has(article.id))
          .map((article, index) => (
          <div key={article.id || article.url || `post-${index}`}>
            {/* Article Container - No borders, clean layout */}
            <div className="p-6">
              {/* Top Row: @username, timestamp, and action buttons */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-600 text-sm font-medium">
                    @{article.author || 'user'}
                  </span>
                  <span className="text-gray-400 text-sm">•</span>
                  <span className="text-gray-500 text-sm">
                    {article.time || new Date(article.publishedAt).toLocaleDateString()}
                  </span>
                </div>
                {/* Action buttons - right side */}
                <div className="flex items-center space-x-2">
                  {/* 3-dot menu */}
                  <button
                    onClick={() => handleOpenSettings(article)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Post options"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-600" />
                  </button>
                  {/* Save button */}
                  <button
                    onClick={() => handleSavePost(article)}
                    disabled={savingPost === article.id}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    title={savedPostIds.has(article.id) ? "Already saved" : "Save post"}
                  >
                    {savedPostIds.has(article.id) ? (
                      <Bookmark className="w-5 h-5 text-orange-600 fill-current" />
                    ) : (
                      <Bookmark className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Article Content - Enhanced typography and smooth expansion */}
              <div className="mb-4">
                {/* Combined Text Block with improved hierarchy */}
                {(() => {
                  const titleText = article.title || '';
                  const contentText = article.content || '';
                  const combinedText = titleText + (titleText && contentText ? '. ' : '') + contentText;
                  const combinedId = `${article.id}-combined`;
                  const shouldTruncate = shouldTruncateContent(combinedText);
                  const isExpanded = expandedPosts[article.id];

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
                          <span className="post-title">
                            {parseMarkdownContent(titleText, `${combinedId}-title`, renderClickableText)}
                          </span>
                        )}
                        {/* Content portion */}
                        {contentText && (
                          <span>
                            {titleText && '. '}
                            {parseMarkdownContent(contentText, `${combinedId}-content`, renderClickableText)}
                          </span>
                        )}
                        {!titleText && !contentText && parseMarkdownContent(combinedText, combinedId, renderClickableText)}
                      </div>
                      {shouldTruncate && (
                        <button
                          onClick={() => togglePostExpansion(article.id)}
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

                {article.image && (
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-64 object-cover rounded-lg mt-4 transition-all duration-300 hover:shadow-lg"
                  />
                )}
              </div>

              {/* Bottom Row: View Comments (left) and "Open in Reddit" (right) */}
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => toggleComments(article.id)}
                    className="flex items-center space-x-1.5 text-gray-600 hover:text-orange-600 transition-colors text-sm font-medium"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>View Comments ({article.comments || getCommentCount(article.id) || 0})</span>
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  {/* Open in Reddit */}
                  <a
                    href={article.externalUrl || article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors text-sm font-medium"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Enhanced Comment System */}
            {showComments[article.id] && (
              <div className="border-t border-gray-200">
                <EnhancedCommentSystem
                  articleId={article.id}
                  postContent={article.content}
                  postTitle={article.title}
                  userProfile={userProfile}
                  userDictionary={userDictionary}
                  onAddWordToDictionary={onAddWordToDictionary}
                />
              </div>
            )}

            {/* Separator Line between posts (not after last post) */}
            {index < (processedPosts.length > 0 ? processedPosts : posts).length - 1 && (
              <div className="border-b border-gray-200"></div>
            )}
          </div>
        ))}
        </div>
      )}

      {/* See More Button - DISABLED: All posts shown at once */}
      {/* Loading More indicator - DISABLED: All posts shown at once */}

      {/* No more posts message */}
      {!loading && !error && (processedPosts.length > 0 ? processedPosts : posts).length > 0 && (
          <div className="text-center py-8 animate-fadeIn">
            <div className="inline-flex flex-col items-center space-y-2 text-gray-500">
              <span className="font-medium">
                No more posts.
              </span>
              <span className="text-sm text-gray-400">
                All {(processedPosts.length > 0 ? processedPosts : posts).length} posts have been loaded.
              </span>
            </div>
          </div>
        )}

      {/* Post Settings Modal */}
      {settingsModalPost && (
        <PostSettingsModal
          post={settingsModalPost}
          onClose={handleCloseSettings}
          onNotInterested={handleNotInterested}
          onReport={handleReportPost}
        />
      )}
    </div>
  )
}

export default NewsFeed
