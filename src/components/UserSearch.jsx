import { Search, UserPlus, UserCheck } from "lucide-react"
import React, { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import {
  searchUsers,
  followUser,
  unfollowUser,
  isFollowing
} from "@/services/databaseService"

const UserSearch = () => {
  const { currentUser } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [followStatus, setFollowStatus] = useState({}) // Track follow status for each user
  const [actionLoading, setActionLoading] = useState({}) // Track loading state for follow/unfollow actions

  // Search users with debounce
  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([])
        return
      }

      setLoading(true)
      try {
        const result = await searchUsers(searchQuery)
        if (result.success) {
          // Filter out current user from results
          const filteredUsers = result.data.filter(user => user.userId !== currentUser?.uid)
          setSearchResults(filteredUsers)

          // Check follow status for each user
          if (currentUser) {
            const statusChecks = {}
            for (const user of filteredUsers) {
              const followResult = await isFollowing(currentUser.uid, user.userId)
              if (followResult.success) {
                statusChecks[user.userId] = followResult.isFollowing
              }
            }
            setFollowStatus(statusChecks)
          }
        }
      } catch (error) {
        console.error('Error searching users:', error)
      } finally {
        setLoading(false)
      }
    }, 500) // 500ms debounce

    return () => clearTimeout(delaySearch)
  }, [searchQuery, currentUser])

  const handleFollowToggle = async (targetUserId) => {
    if (!currentUser) {
      alert('Please sign in to follow users')
      return
    }

    setActionLoading(prev => ({ ...prev, [targetUserId]: true }))

    try {
      const isCurrentlyFollowing = followStatus[targetUserId]

      if (isCurrentlyFollowing) {
        const result = await unfollowUser(currentUser.uid, targetUserId)
        if (result.success) {
          setFollowStatus(prev => ({ ...prev, [targetUserId]: false }))
        } else {
          alert('Failed to unfollow: ' + result.error)
        }
      } else {
        const result = await followUser(currentUser.uid, targetUserId)
        if (result.success) {
          setFollowStatus(prev => ({ ...prev, [targetUserId]: true }))
        } else {
          alert('Failed to follow: ' + result.error)
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
      alert('An error occurred')
    } finally {
      setActionLoading(prev => ({ ...prev, [targetUserId]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Find Users</h1>
            <p className="text-gray-600 text-sm">
              Search for other Fluent learners to follow
            </p>
          </div>

          {/* Search Input */}
          <div className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {loading && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                </div>
              )}
            </div>
          </div>

          {/* Search Results */}
          <div className="p-6 pt-0">
            {searchQuery.trim().length < 2 ? (
              <div className="text-center py-12 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Start typing to search for users</p>
              </div>
            ) : loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-3"></div>
                <p className="text-gray-600">Searching...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No users found matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-orange-300 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      {user.profilePictureUrl ? (
                        <img
                          src={user.profilePictureUrl}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold text-white">
                            {user.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">
                          Learning {user.targetLanguage || 'Japanese'} • Level {user.level || 1}
                        </div>
                        {user.bio && (
                          <div className="text-sm text-gray-600 mt-1 max-w-md line-clamp-1">
                            {user.bio}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleFollowToggle(user.userId)}
                      disabled={actionLoading[user.userId]}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        followStatus[user.userId]
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-orange-500 text-white hover:bg-orange-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {actionLoading[user.userId] ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      ) : followStatus[user.userId] ? (
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
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserSearch
