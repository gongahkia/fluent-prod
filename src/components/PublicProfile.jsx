import {
  ArrowLeft,
  MapPin,
  Globe,
  Calendar,
  Award,
} from "lucide-react"
import React, { useState, useEffect } from "react"
import { FluentLogo } from "@/components/ui/FluentLogo"
import { useAuth } from "@/contexts/AuthContext"
import {
  getUserFollowers,
  getUserFollowing,
} from "@/services/databaseService"

const PublicProfile = ({ userProfile, onBack }) => {
  const { currentUser } = useAuth()
  const levelNames = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Native']
  const getLevelName = (level) => {
    const levelNum = parseInt(level, 10)
    return levelNames[levelNum - 1] || 'Beginner'
  }

  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)

  useEffect(() => {
    const loadSocialData = async () => {
      if (!currentUser) return

      setLoading(true)
      try {
        const [followersResult, followingResult] = await Promise.all([
          getUserFollowers(currentUser.uid),
          getUserFollowing(currentUser.uid)
        ])

        if (followersResult.success) {
          setFollowers(followersResult.data)
        }
        if (followingResult.success) {
          setFollowing(followingResult.data)
        }
      } catch (error) {
        console.error('Error loading social data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSocialData()
  }, [currentUser])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-300"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-7 h-7">
                <FluentLogo variant="short" className="w-full h-full" alt="Fluent" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Profile
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Banner and Profile Picture */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6 animate-slideInFromBottom">
          <div className="relative h-48 bg-gradient-to-r from-orange-400 to-amber-500">
            {userProfile?.bannerImage && (
              <img
                src={userProfile.bannerImage}
                alt="Profile Banner"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-start justify-between -mt-12 mb-4">
              <div className="relative">
                {userProfile?.profilePictureUrl ? (
                  <img
                    src={userProfile.profilePictureUrl}
                    alt={userProfile.name}
                    className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                    <span className="text-3xl font-bold text-white">
                      {userProfile?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{userProfile?.name || "User"}</h2>
                <p className="text-gray-600">{userProfile?.email}</p>
              </div>

              {userProfile?.bio && (
                <p className="text-gray-700">{userProfile.bio}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {userProfile?.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{userProfile.location}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Globe className="w-4 h-4" />
                  <span>Learning {userProfile?.targetLanguage || "Japanese"}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Award className="w-4 h-4" />
                  <span>{getLevelName(userProfile?.level || 3)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(userProfile?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              {/* Social Stats */}
              <div className="flex space-x-6 pt-3 border-t border-gray-200">
                <button
                  onClick={() => setShowFollowers(true)}
                  className="hover:underline transition-all duration-300"
                >
                  <span className="font-bold text-gray-900">{followers.length}</span>
                  <span className="text-gray-600 ml-1">Followers</span>
                </button>
                <button
                  onClick={() => setShowFollowing(true)}
                  className="hover:underline transition-all duration-300"
                >
                  <span className="font-bold text-gray-900">{following.length}</span>
                  <span className="text-gray-600 ml-1">Following</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Interests */}
        {userProfile?.selectedTags && userProfile.selectedTags.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-slideInFromBottom" style={{ animationDelay: '200ms' }}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {userProfile.selectedTags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Followers Modal */}
      {showFollowers && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
          onClick={() => setShowFollowers(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4">Followers</h3>
            {followers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No followers yet
              </div>
            ) : (
              <div className="space-y-3">
                {followers.map((follower) => (
                  <div
                    key={follower.userId}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-all duration-300"
                  >
                    {follower.profilePictureUrl ? (
                      <img
                        src={follower.profilePictureUrl}
                        alt={follower.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {follower.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{follower.name}</div>
                      <div className="text-xs text-gray-500">{follower.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowFollowers(false)}
              className="mt-4 w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowing && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
          onClick={() => setShowFollowing(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4">Following</h3>
            {following.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Not following anyone yet
              </div>
            ) : (
              <div className="space-y-3">
                {following.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-all duration-300"
                  >
                    {user.profilePictureUrl ? (
                      <img
                        src={user.profilePictureUrl}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowFollowing(false)}
              className="mt-4 w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PublicProfile
