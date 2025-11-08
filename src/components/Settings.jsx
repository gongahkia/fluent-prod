import {
  ArrowLeft,
  Bell,
  Check,
  Globe,
  Link2,
  LogOut,
  Moon,
  Shield,
  Sun,
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
} from "@/services/databaseService"
import {
  encryptCredentials,
  decryptCredentials
} from "@/services/encryptionService"
import { signOutUser } from "@/services/authService"
import LearningTab from "./Profile/LearningTab"
import ConnectedAccountsTab from "./Profile/ConnectedAccountsTab"

const Settings = ({ userProfile, onProfileUpdate, onBack, onLogout }) => {
  const { currentUser } = useAuth()
  // FIXED: Add active tab state for tab navigation
  const [activeTab, setActiveTab] = useState("account")
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

  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // Load encrypted API credentials from Firebase on mount
  useEffect(() => {
    const loadCredentials = async () => {
      if (!currentUser) return

      try {
        const token = await currentUser.getIdToken()
        const result = await getUserCredentials(currentUser.id)

        if (result.success && result.data) {
          const decrypted = await decryptCredentials(result.data, token)

          setFormData(prev => ({
            ...prev,
            redditApiKey: decrypted.redditApiKey || '',
            geminiApiKey: decrypted.geminiApiKey || '',
          }))

          localStorage.setItem('redditApiKey', decrypted.redditApiKey || '')
          localStorage.setItem('geminiApiKey', decrypted.geminiApiKey || '')
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
      const token = await currentUser.getIdToken()

      const credentials = {
        redditApiKey: formData.redditApiKey,
        geminiApiKey: formData.geminiApiKey,
      }

      const encryptedCreds = await encryptCredentials(credentials, token)
      await updateUserCredentials(currentUser.id, encryptedCreds)

      localStorage.setItem('redditApiKey', formData.redditApiKey)
      localStorage.setItem('geminiApiKey', formData.geminiApiKey)

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
      onProfileUpdate(formData)

      setIsLoading(false)
      setShowSuccessPopup(true)
      setTimeout(() => {
        setShowSuccessPopup(false)
      }, 2000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setIsLoading(false)
      alert('Error saving settings. Please try again.')
    }
  }

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true)
  }

  const confirmLogout = async () => {
    setShowLogoutConfirm(false)
    await signOutUser()
    if (onLogout) onLogout()
  }

  const settingsSections = [
    {
      id: "account",
      title: "Account",
      icon: User,
      items: [
        {
          label: "Name",
          type: "input",
          name: "name",
          value: formData.name,
          placeholder: "Your name",
        },
        {
          label: "Email",
          type: "input",
          name: "email",
          value: formData.email,
          placeholder: "your@email.com",
          disabled: true,
          help: "Email cannot be changed"
        },
        {
          label: "Bio",
          type: "textarea",
          name: "bio",
          value: formData.bio,
          placeholder: "Tell others about yourself and your language learning journey...",
        },
        {
          label: "Location",
          type: "input",
          name: "location",
          value: formData.location,
          placeholder: "e.g. New York, USA",
        },
        {
          label: "Website",
          type: "input",
          name: "website",
          value: formData.website,
          placeholder: "https://yourwebsite.com",
        },
        {
          label: "Profile Picture URL",
          type: "input",
          name: "profilePictureUrl",
          value: formData.profilePictureUrl,
          placeholder: "https://example.com/profile.jpg",
          help: "Enter a URL for your profile picture"
        },
        {
          label: "Banner Image URL",
          type: "input",
          name: "bannerImage",
          value: formData.bannerImage,
          placeholder: "https://example.com/banner.jpg",
          help: "Enter a URL for your profile banner image"
        },
      ]
    },
    {
      id: "learning",
      title: "Learning Preferences",
      icon: Globe,
      component: <LearningTab formData={formData} handleInputChange={handleInputChange} />
    },
    {
      id: "connections",
      title: "Connected Services",
      icon: Link2,
      component: <ConnectedAccountsTab formData={formData} handleInputChange={handleInputChange} />
    },
    {
      id: "notifications",
      title: "Notifications",
      icon: Bell,
      items: [
        {
          label: "Email Notifications",
          type: "checkbox",
          name: "emailNotifications",
          checked: formData.emailNotifications,
          help: "Receive email updates about your learning progress"
        },
        {
          label: "Push Notifications",
          type: "checkbox",
          name: "pushNotifications",
          checked: formData.pushNotifications,
          help: "Get notified about daily goals and streaks"
        },
        {
          label: "Comment Notifications",
          type: "checkbox",
          name: "commentNotifications",
          checked: formData.commentNotifications,
          help: "Notifications when someone replies to your comments"
        },
      ]
    },
    {
      id: "privacy",
      title: "Privacy & Security",
      icon: Shield,
      items: [
        {
          label: "Profile Visibility",
          type: "select",
          name: "profileVisibility",
          value: formData.profileVisibility,
          options: [
            { value: "public", label: "Public - Anyone can see your profile" },
            { value: "friends", label: "Friends Only - Only friends can see your profile" },
            { value: "private", label: "Private - Only you can see your profile" },
          ],
          help: "Control who can see your profile"
        },
      ]
    },
    {
      id: "appearance",
      title: "Appearance",
      icon: formData.theme === "dark" ? Moon : Sun,
      items: [
        {
          label: "Theme",
          type: "select",
          name: "theme",
          value: formData.theme,
          options: [
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
            { value: "auto", label: "Auto" },
          ],
        },
        {
          label: "Font Size",
          type: "select",
          name: "fontSize",
          value: formData.fontSize,
          options: [
            { value: "small", label: "Small" },
            { value: "medium", label: "Medium" },
            { value: "large", label: "Large" },
            { value: "xlarge", label: "Extra Large" },
          ],
        },
      ]
    },
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
                className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-300"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-7 h-7">
                <FluentLogo variant="short" className="w-full h-full" alt="Fluent" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Settings
              </h1>
            </div>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700 text-white transition-all duration-300"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <span>Save Changes</span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* FIXED: Added tab navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-2 sm:space-x-8" aria-label="Settings tabs">
            {settingsSections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveTab(section.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      activeTab === section.id
                        ? "border-orange-500 text-orange-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{section.title}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <div className="space-y-6">
          {/* FIXED: Only render the active tab's content */}
          {settingsSections
            .filter(section => section.id === activeTab)
            .map((section) => {
            const Icon = section.icon
            return (
              <div key={section.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-semibold text-gray-900">{section.title}</h2>
                  </div>
                </div>

                <div className="p-6">
                  {section.component ? (
                    section.component
                  ) : (
                    <div className="space-y-4">
                      {section.items?.map((item, index) => (
                        <div key={index} className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">
                            {item.label}
                          </label>
                          {item.type === "input" && (
                            <input
                              type="text"
                              name={item.name}
                              value={item.value}
                              onChange={handleInputChange}
                              placeholder={item.placeholder}
                              disabled={item.disabled}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-300"
                            />
                          )}
                          {item.type === "textarea" && (
                            <textarea
                              name={item.name}
                              value={item.value}
                              onChange={handleInputChange}
                              placeholder={item.placeholder}
                              rows="3"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300"
                            />
                          )}
                          {item.type === "checkbox" && (
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                name={item.name}
                                checked={item.checked}
                                onChange={handleInputChange}
                                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 transition-all duration-300"
                              />
                              <label className="ml-3 text-sm text-gray-600">
                                {item.help}
                              </label>
                            </div>
                          )}
                          {item.type === "select" && (
                            <select
                              name={item.name}
                              value={item.value}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300"
                            >
                              {item.options?.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          )}
                          {item.help && item.type !== "checkbox" && (
                            <p className="text-xs text-gray-500">{item.help}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Logout Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-all duration-300 font-medium"
              >
                <LogOut className="w-5 h-5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center animate-scaleIn">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Settings Saved!
            </h3>
            <p className="text-gray-600">
              Your changes have been saved successfully.
            </p>
          </div>
        </div>
      )}

      {/* Logout Confirmation */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 animate-scaleIn">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Log Out?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to log out of your account?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 font-medium"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Settings
