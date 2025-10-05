import {
  ArrowLeft,
  Bell,
  Camera,
  Code,
  Globe,
  Save,
  Shield,
  User,
} from "lucide-react"
import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import {
  updateUserProfile,
  updateUserCredentials,
  getUserCredentials
} from "@/services/databaseService"
import {
  encryptCredentials,
  decryptCredentials
} from "@/services/encryptionService"
import GeneralTab from "./Profile/GeneralTab"
import LearningTab from "./Profile/LearningTab"
import NotificationsTab from "./Profile/NotificationsTab"
import PrivacyTab from "./Profile/PrivacyTab"
import DeveloperTab from "./Profile/DeveloperTab"

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
    bannerImage: userProfile?.bannerImage || "",
    // Privacy settings
    profileVisibility: "public",
    showEmail: false,
    showLocation: true,
    // Notification settings
    emailNotifications: true,
    pushNotifications: true,
    commentNotifications: true,
    followNotifications: true,
    // Appearance settings
    theme: "light",
    accentColor: "orange",
    fontSize: "medium",
    // Daily goals
    dailyWordGoal: 10,
    dailyReadingGoal: 5,
    studyReminder: true,
    reminderTime: "18:00",
    // Developer mode API keys
    twitterBearerToken: "",
    instagramUsername: "",
    instagramPassword: "",
    geminiApiKey: "",
  })

  const [activeTab, setActiveTab] = useState("general")
  const [isLoading, setIsLoading] = useState(false)
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)

  // Load encrypted API credentials from Firebase on mount
  useEffect(() => {
    const loadCredentials = async () => {
      if (!currentUser) return

      try {
        // Get user's auth token for encryption/decryption
        const token = await currentUser.getIdToken()

        // Load encrypted credentials from Firebase
        const result = await getUserCredentials(currentUser.uid)

        if (result.success && result.data) {
          // Decrypt credentials
          const decrypted = await decryptCredentials(result.data, token)

          setFormData(prev => ({
            ...prev,
            twitterBearerToken: decrypted.twitterBearerToken || '',
            instagramUsername: decrypted.instagramUsername || '',
            instagramPassword: decrypted.instagramPassword || '',
            geminiApiKey: decrypted.geminiApiKey || '',
          }))

          // Also save to sessionStorage for immediate use by other components
          sessionStorage.setItem('twitterBearerToken', decrypted.twitterBearerToken || '')
          sessionStorage.setItem('instagramUsername', decrypted.instagramUsername || '')
          sessionStorage.setItem('instagramPassword', decrypted.instagramPassword || '')
          sessionStorage.setItem('geminiApiKey', decrypted.geminiApiKey || '')
        }
      } catch (error) {
        console.error('Error loading credentials:', error)
      }
    }

    loadCredentials()
  }, [currentUser])

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
        twitterBearerToken: formData.twitterBearerToken,
        instagramUsername: formData.instagramUsername,
        instagramPassword: formData.instagramPassword,
        geminiApiKey: formData.geminiApiKey,
      }

      // Encrypt sensitive credentials
      const encryptedCreds = await encryptCredentials(credentials, token)

      // Save encrypted credentials to Firebase
      await updateUserCredentials(currentUser.uid, encryptedCreds)

      // Save to sessionStorage for immediate use
      sessionStorage.setItem('twitterBearerToken', formData.twitterBearerToken)
      sessionStorage.setItem('instagramUsername', formData.instagramUsername)
      sessionStorage.setItem('instagramPassword', formData.instagramPassword)
      sessionStorage.setItem('geminiApiKey', formData.geminiApiKey)

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
        bannerImage: formData.bannerImage,
        settings: {
          notifications: {
            email: formData.emailNotifications,
            push: formData.pushNotifications,
            comments: formData.commentNotifications,
          },
          privacy: {
            profileVisibility: formData.profileVisibility,
            showEmail: formData.showEmail,
            showLocation: formData.showLocation,
          },
          appearance: {
            theme: formData.theme,
            accentColor: formData.accentColor,
            fontSize: formData.fontSize,
          },
          goals: {
            dailyWords: formData.dailyWordGoal,
            dailyReading: formData.dailyReadingGoal,
            studyReminder: formData.studyReminder,
            reminderTime: formData.reminderTime,
          }
        }
      }

      await updateUserProfile(currentUser.uid, profileUpdates)

      // Update parent component
      onProfileUpdate(formData)

      setIsLoading(false)

      // Show success message
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      setIsLoading(false)
      alert('Error saving settings. Please try again.')
    }
  }

  // Generate mock activity data for consistency graph
  const mockActivityData = {}
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    // Random activity with some days having no activity
    mockActivityData[dateStr] = Math.random() > 0.3 ? Math.floor(Math.random() * 15) : 0
  }

  const tabs = [
    { id: "general", label: "General", icon: User },
    { id: "learning", label: "Learning", icon: Globe },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "developer", label: "Developer Mode", icon: Code },
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
          <div className="relative h-48 bg-gradient-to-r from-blue-400 to-purple-500">
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
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center border-4 border-white">
                  <span className="text-3xl font-bold text-gray-700">
                    {formData.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
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
              <LearningTab formData={formData} handleInputChange={handleInputChange} mockActivityData={mockActivityData} />
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <NotificationsTab formData={formData} handleInputChange={handleInputChange} />
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

            {/* Developer Mode Tab */}
            {activeTab === "developer" && (
              <DeveloperTab formData={formData} handleInputChange={handleInputChange} />
            )}
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
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4">Manage Followers</h3>
            <div className="space-y-3">
              {["Yuki Tanaka", "Sarah Johnson", "Li Wei"].map(
                (follower, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <span>{follower}</span>
                    <div className="space-x-2">
                      <button className="text-red-500 text-sm">Remove</button>
                      <button className="text-gray-500 text-sm">Block</button>
                    </div>
                  </div>
                )
              )}
            </div>
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
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4">Manage Following</h3>
            <div className="space-y-3">
              {["Hiroshi Sato", "Hanako Yamada", "Taro Suzuki"].map(
                (following, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <span>{following}</span>
                    <button className="text-red-500 text-sm">Unfollow</button>
                  </div>
                )
              )}
            </div>
            <button
              onClick={() => setShowFollowing(false)}
              className="mt-4 w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile
