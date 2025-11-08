import {
  ArrowLeft,
  Camera,
  Check,
  Globe,
  Link2,
  LogOut,
  Save,
  Shield,
  User,
} from "lucide-react"
import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { FluentLogo } from "@/components/ui/FluentLogo"
import { useAuth } from "@/contexts/AuthContext"
import {
  updateUserProfile,
  updateUserCredentials,
  getUserCredentials,
  getUserFollowers,
  getUserFollowing,
  removeFollower,
  unfollowUser,
  blockUser
} from "@/services/databaseService"
import { signOutUser } from "@/services/authService"
import {
  encryptCredentials,
  decryptCredentials
} from "@/services/encryptionService"
import GeneralTab from "./Profile/GeneralTab"
import LearningTab from "./Profile/LearningTab"
import PrivacyTab from "./Profile/PrivacyTab"
import ConnectedAccountsTab from "./Profile/ConnectedAccountsTab"

const Profile = ({ userProfile, onProfileUpdate, onBack }) => {
  const { currentUser } = useAuth()
  // Map 1-5 levels to names
  const levelNames = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Native']
  const getLevelName = (level) => {
    const levelNum = parseInt(level, 10)
    return levelNames[levelNum - 1] || 'Beginner'
  }

  const [formData, setFormData] = useState({
    name: userProfile?.name || "",
    email: userProfile?.email || "",
    bio: userProfile?.bio || "",
    nativeLanguage: userProfile?.nativeLanguages?.[0] || "English",
    targetLanguage: userProfile?.targetLanguage || "Japanese",
    learningLevel: userProfile?.level || "3",
    location: userProfile?.location || "",
    website: userProfile?.website || "",
    profilePictureUrl: userProfile?.profilePictureUrl || "",
    bannerImage: userProfile?.bannerImage || "",
    selectedTags: userProfile?.selectedTags || [],
    // Privacy settings
    profileVisibility: userProfile?.settings?.privacy?.profileVisibility || "public",
    // Notification settings
    emailNotifications: userProfile?.settings?.notifications?.email ?? true,
    pushNotifications: userProfile?.settings?.notifications?.push ?? true,
    commentNotifications: userProfile?.settings?.notifications?.comments ?? true,
    // Appearance settings
    theme: userProfile?.settings?.appearance?.theme || "light",
    fontSize: userProfile?.settings?.appearance?.fontSize || "medium",
    // API keys
    redditApiKey: "",
    geminiApiKey: "",
  })

  const [activeTab, setActiveTab] = useState("general")
  const [isLoading, setIsLoading] = useState(false)
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [loadingFollowers, setLoadingFollowers] = useState(false)
  const [loadingFollowing, setLoadingFollowing] = useState(false)

  // Load encrypted API credentials from Firebase on mount
  useEffect(() => {
    const loadCredentials = async () => {
      if (!currentUser) return

      try {
        // Get user's auth token for encryption/decryption
        const token = await currentUser.getIdToken()

        // Load encrypted credentials from Firebase
        const result = await getUserCredentials(currentUser.id)

        if (result.success && result.data) {
          // Decrypt credentials
          const decrypted = await decryptCredentials(result.data, token)

          setFormData(prev => ({
            ...prev,
            redditApiKey: decrypted.redditApiKey || '',
            geminiApiKey: decrypted.geminiApiKey || '',
          }))

          // Also save to localStorage for immediate use by other components
          localStorage.setItem('redditApiKey', decrypted.redditApiKey || '')
          localStorage.setItem('geminiApiKey', decrypted.geminiApiKey || '')
        }
      } catch (error) {
        console.error('Error loading credentials:', error)
      }
    }

    loadCredentials()
  }, [currentUser])

  // Load followers when modal is opened
  useEffect(() => {
    const loadFollowers = async () => {
      if (!currentUser || !showFollowers) return

      setLoadingFollowers(true)
      try {
        const result = await getUserFollowers(currentUser.id)
        if (result.success) {
          setFollowers(result.data)
        } else {
          console.error('Error loading followers:', result.error)
        }
      } catch (error) {
        console.error('Error loading followers:', error)
      } finally {
        setLoadingFollowers(false)
      }
    }

    loadFollowers()
  }, [currentUser, showFollowers])

  // Load following when modal is opened
  useEffect(() => {
    const loadFollowing = async () => {
      if (!currentUser || !showFollowing) return

      setLoadingFollowing(true)
      try {
        const result = await getUserFollowing(currentUser.id)
        if (result.success) {
          setFollowing(result.data)
        } else {
          console.error('Error loading following:', result.error)
        }
      } catch (error) {
        console.error('Error loading following:', error)
      } finally {
        setLoadingFollowing(false)
      }
    }

    loadFollowing()
  }, [currentUser, showFollowing])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSave = async () => {
    if (!currentUser) return

    setIsLoading(true)

    try {
      // Get user's auth token for encryption
      const token = await currentUser.getIdToken()

      // Separate sensitive credentials from regular profile data
      const credentials = {
        redditApiKey: formData.redditApiKey,
        geminiApiKey: formData.geminiApiKey,
      }

      // Encrypt sensitive credentials
      const encryptedCreds = await encryptCredentials(credentials, token)

      // Save encrypted credentials to Firebase
      await updateUserCredentials(currentUser.id, encryptedCreds)

      // Save to localStorage for immediate use
      localStorage.setItem('redditApiKey', formData.redditApiKey)
      localStorage.setItem('geminiApiKey', formData.geminiApiKey)

      // Save regular profile settings to Firebase
      const profileUpdates = {
        name: formData.name,
        email: formData.email,
        bio: formData.bio,
        nativeLanguage: formData.nativeLanguage,
        targetLanguage: formData.targetLanguage,
        level: parseInt(formData.learningLevel),
        location: formData.location,
        website: formData.website,
        profilePictureUrl: formData.profilePictureUrl,
        bannerImage: formData.bannerImage,
        selectedTags: formData.selectedTags,
        settings: {
          notifications: {
            email: formData.emailNotifications,
            push: formData.pushNotifications,
            comments: formData.commentNotifications,
          },
          privacy: {
            profileVisibility: formData.profileVisibility,
          },
          appearance: {
            theme: formData.theme,
            fontSize: formData.fontSize,
          }
        }
      }

      await updateUserProfile(currentUser.id, profileUpdates)

      // Update parent component
      onProfileUpdate(formData)

      setIsLoading(false)

      // Show success popup
      setShowSuccessPopup(true)
      setTimeout(() => {
        setShowSuccessPopup(false)
      }, 2000)
    } catch (error) {
      console.error('Error saving profile:', error)
      setIsLoading(false)
      alert('Error saving settings. Please try again.')
    }
  }

  const handleRemoveFollower = async (followerUserId) => {
    if (!currentUser) return

    try {
      const result = await removeFollower(currentUser.id, followerUserId)
      if (result.success) {
        // Remove from local state
        setFollowers(prev => prev.filter(f => f.userId !== followerUserId))
        alert('Follower removed successfully')
      } else {
        alert('Failed to remove follower: ' + result.error)
      }
    } catch (error) {
      console.error('Error removing follower:', error)
      alert('Failed to remove follower')
    }
  }

  const handleUnfollow = async (targetUserId) => {
    if (!currentUser) return

    try {
      const result = await unfollowUser(currentUser.id, targetUserId)
      if (result.success) {
        // Remove from local state
        setFollowing(prev => prev.filter(f => f.userId !== targetUserId))
        alert('Unfollowed successfully')
      } else {
        alert('Failed to unfollow: ' + result.error)
      }
    } catch (error) {
      console.error('Error unfollowing:', error)
      alert('Failed to unfollow')
    }
  }

  const handleBlockUser = async (targetUserId) => {
    if (!currentUser) return

    const confirmed = window.confirm('Are you sure you want to block this user? This will remove all follow relationships.')
    if (!confirmed) return

    try {
      const result = await blockUser(currentUser.id, targetUserId)
      if (result.success) {
        // Remove from both lists
        setFollowers(prev => prev.filter(f => f.userId !== targetUserId))
        setFollowing(prev => prev.filter(f => f.userId !== targetUserId))
        alert('User blocked successfully')
      } else {
        alert('Failed to block user: ' + result.error)
      }
    } catch (error) {
      console.error('Error blocking user:', error)
      alert('Failed to block user')
    }
  }

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      try {
        const result = await signOutUser()
        if (result.success) {
          // Clear local storage
          localStorage.clear()
          // Redirect will happen automatically via auth state change
          window.location.href = '/'
        } else {
          alert('Failed to log out: ' + result.error)
        }
      } catch (error) {
        console.error('Error logging out:', error)
        alert('Failed to log out')
      }
    }
  }

  const tabs = [
    { id: "general", label: "General", icon: User },
    { id: "learning", label: "Learning", icon: Globe },
    { id: "connections", label: "Connected Accounts", icon: Link2 },
    { id: "privacy", label: "Privacy", icon: Shield },
  ]

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
              <div className="w-7 h-7">
                <FluentLogo variant="short" className="w-full h-full" alt="Fluent" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Profile Settings
              </h1>
            </div>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Banner Image */}
          <div className="relative h-48 bg-gradient-to-r from-orange-400 to-amber-500">
            {formData.bannerImage && (
              <img
                src={formData.bannerImage}
                alt="Profile Banner"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Profile Header */}
          <div className="bg-gray-50 px-6 py-8 border-b border-gray-200 -mt-12">
            <div className="flex items-center space-x-6">
              <div className="relative">
                {formData.profilePictureUrl ? (
                  <img
                    src={formData.profilePictureUrl}
                    alt={formData.name}
                    className="w-24 h-24 rounded-full border-4 border-white object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center border-4 border-white">
                    <span className="text-3xl font-bold text-gray-700">
                      {formData.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-gray-900">
                <h2 className="text-2xl font-bold">{formData.name}</h2>
                <p className="text-gray-600">{formData.email}</p>
                <p className="text-gray-500 text-sm mt-1">
                  Learning {formData.targetLanguage} • {getLevelName(formData.learningLevel)}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? "border-gray-900 text-gray-900"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* General Tab */}
            {activeTab === "general" && (
              <GeneralTab formData={formData} handleInputChange={handleInputChange} />
            )}

            {/* Learning Tab */}
            {activeTab === "learning" && (
              <LearningTab formData={formData} handleInputChange={handleInputChange} />
            )}

            {/* Connected Accounts Tab */}
            {activeTab === "connections" && (
              <ConnectedAccountsTab formData={formData} handleInputChange={handleInputChange} />
            )}

            {/* Privacy Tab */}
            {activeTab === "privacy" && (
              <PrivacyTab
                formData={formData}
                handleInputChange={handleInputChange}
                setShowFollowers={setShowFollowers}
                setShowFollowing={setShowFollowing}
              />
            )}
          </div>

          {/* Danger Zone */}
          <div className="border-t border-gray-200 px-6 py-6 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Account Actions</h3>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors border border-red-200"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Followers Modal */}
      {showFollowers && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowFollowers(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4">Manage Followers</h3>
            {loadingFollowers ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading followers...</p>
              </div>
            ) : followers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No followers yet
              </div>
            ) : (
              <div className="space-y-3">
                {followers.map((follower) => (
                  <div
                    key={follower.userId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {follower.profilePictureUrl ? (
                        <img
                          src={follower.profilePictureUrl}
                          alt={follower.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-700">
                            {follower.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{follower.name}</div>
                        <div className="text-xs text-gray-500">{follower.email}</div>
                      </div>
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleRemoveFollower(follower.userId)}
                        className="text-red-500 text-sm hover:text-red-700"
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => handleBlockUser(follower.userId)}
                        className="text-gray-500 text-sm hover:text-gray-700"
                      >
                        Block
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowFollowers(false)}
              className="mt-4 w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowing && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowFollowing(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4">Manage Following</h3>
            {loadingFollowing ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading following...</p>
              </div>
            ) : following.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Not following anyone yet
              </div>
            ) : (
              <div className="space-y-3">
                {following.map((user) => (
                  <div
                    key={user.userId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {user.profilePictureUrl ? (
                        <img
                          src={user.profilePictureUrl}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-gray-700">
                            {user.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnfollow(user.userId)}
                      className="text-red-500 text-sm hover:text-red-700"
                    >
                      Unfollow
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowFollowing(false)}
              className="mt-4 w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Settings Saved!
            </h3>
            <p className="text-gray-600">
              Your profile has been updated successfully.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
