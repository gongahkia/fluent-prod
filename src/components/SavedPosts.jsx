import { ArrowLeft, Bookmark, Trash2, ExternalLink } from "lucide-react"
import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { getSavedPosts, removeSavedPost } from "@/services/databaseService"
import { useAuth } from "@/contexts/AuthContext"
import LoadingSpinner from "@/components/ui/LoadingSpinner"

const SavedPosts = ({ onBack }) => {
  const { currentUser } = useAuth()
  const [savedPosts, setSavedPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading saved posts..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="text-red-500 text-lg mb-4">Error loading saved posts</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={onBack} className="bg-orange-500 hover:bg-orange-600">
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2">
                <Bookmark className="w-5 h-5 text-orange-500" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Saved Posts
                </h1>
              </div>
            </div>
            <span className="text-sm text-gray-600">
              {savedPosts.length} {savedPosts.length === 1 ? 'post' : 'posts'} saved
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {savedPosts.length === 0 ? (
          <div className="text-center py-16">
            <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No saved posts yet</h2>
            <p className="text-gray-600">
              Posts you save will appear here for easy access later
            </p>
            <Button
              onClick={onBack}
              className="mt-6 bg-orange-500 hover:bg-orange-600"
            >
              Browse Posts
            </Button>
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
                        {post.title}
                      </h2>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                        {post.content}
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
                    <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-orange-600 transition-colors">
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
      </main>
    </div>
  )
}

export default SavedPosts
