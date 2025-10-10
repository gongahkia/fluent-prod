import { Bookmark, Trash2, ExternalLink } from "lucide-react"
import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { getSavedPosts, removeSavedPost } from "@/services/databaseService"
import { useAuth } from "@/contexts/AuthContext"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import SinglePostView from "./SinglePostView"

const SavedPosts = ({ userProfile, onAddWordToDictionary, userDictionary }) => {
  const { currentUser } = useAuth()
  const [savedPosts, setSavedPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPost, setSelectedPost] = useState(null)
  const [sharePopup, setSharePopup] = useState(null)

  // Helper function to extract text from JSON or return plain text
  const extractText = (text) => {
    if (!text) return ''

    // Check if it's a JSON string
    try {
      if (typeof text === 'string' && text.trim().startsWith('{') && text.includes('"text"')) {
        const parsed = JSON.parse(text)
        if (parsed.text) {
          return parsed.text
        }
      }
    } catch (e) {
      // Not JSON, return as-is
    }

    return text
  }

  // Load saved posts from Firestore
  useEffect(() => {
    const loadSavedPosts = async () => {
      if (!currentUser) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const result = await getSavedPosts(currentUser.uid)
        if (result.success) {
          setSavedPosts(result.data)
        } else {
          setError(result.error)
        }
      } catch (err) {
        console.error('Error loading saved posts:', err)
        setError('Failed to load saved posts')
      } finally {
        setLoading(false)
      }
    }

    loadSavedPosts()
  }, [currentUser])

  const handleRemove = async (postId) => {
    if (!currentUser) return

    try {
      const result = await removeSavedPost(currentUser.uid, postId)
      if (result.success) {
        setSavedPosts(savedPosts.filter(post => post.id !== postId))
      } else {
        console.error('Failed to remove post:', result.error)
      }
    } catch (err) {
      console.error('Error removing post:', err)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  const handleViewPost = (post) => {
    setSelectedPost(post)
  }

  const handleSharePost = (post) => {
    const shareUrl = post.url
    const shareTitle = post.title

    setSharePopup({
      url: shareUrl,
      title: shareTitle,
      id: post.id
    })
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Link copied!')
      setSharePopup(null)
    } catch (error) {
      console.error('Failed to copy:', error)
      alert('Failed to copy link')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading saved posts..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-16">
          <div className="text-red-500 text-lg mb-4">Error loading saved posts</div>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Bookmark className="w-5 h-5 text-orange-500" />
          <h1 className="text-2xl font-bold text-gray-900">
            Saved Posts
          </h1>
        </div>
        <span className="text-sm text-gray-600">
          {savedPosts.length} {savedPosts.length === 1 ? 'post' : 'posts'} saved
        </span>
      </div>

      {/* Content */}
      <div>
        {savedPosts.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No saved posts yet</h2>
            <p className="text-gray-600">
              Posts you save will appear here for easy access later
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">
                        {extractText(post.title)}
                      </h2>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {extractText(post.content)}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>by {post.author}</span>
                        <span>•</span>
                        <span>Saved {formatDate(post.savedAt)}</span>
                      </div>
                    </div>
                    {post.image && (
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-32 h-20 object-cover rounded-lg ml-4 flex-shrink-0"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleViewPost(post)}
                      className="flex items-center space-x-2 text-sm text-gray-600 hover:text-orange-600 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View Post</span>
                    </button>
                    <button
                      onClick={() => handleRemove(post.id)}
                      className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Single Post View Modal */}
      {selectedPost && (
        <SinglePostView
          post={selectedPost}
          userProfile={userProfile}
          onAddWordToDictionary={onAddWordToDictionary}
          userDictionary={userDictionary}
          onClose={() => setSelectedPost(null)}
          onShare={handleSharePost}
          onRemove={handleRemove}
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
    </div>
  )
}

export default SavedPosts
