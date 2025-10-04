import {
  ArrowLeft,
  Award,
  Bell,
  Camera,
  Flame,
  Globe,
  Mail,
  Palette,
  Save,
  Shield,
  BarChart3,
  Target,
  Trash2,
  User,
  Zap,
} from "lucide-react"
import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import ConsistencyGraph from "./ConsistencyGraph"

const Profile = ({ userProfile, onProfileUpdate, onBack }) => {
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
  })

  const [activeTab, setActiveTab] = useState("general")
  const [isLoading, setIsLoading] = useState(false)
  const [showFollowers, setShowFollowers] = useState(false)
  const [showFollowing, setShowFollowing] = useState(false)

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      onProfileUpdate(formData)
      setIsLoading(false)
    }, 1000)
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
          {/* Profile Header */}
          <div className="bg-gray-50 px-6 py-8 border-b border-gray-200">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
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
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Tell others about yourself and your language learning journey..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g. New York, USA"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      placeholder="https://yourwebsite.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Learning Tab - Combined with Stats, Goals, and Appearance */}
            {activeTab === "learning" && (
              <div className="space-y-6">
                {/* Language Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Language Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Native Language
                      </label>
                      <select
                        name="nativeLanguage"
                        value={formData.nativeLanguage}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      >
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                        <option value="Chinese">Chinese</option>
                        <option value="Korean">Korean</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Learning Language
                      </label>
                      <select
                        name="targetLanguage"
                        value={formData.targetLanguage}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      >
                        <option value="Japanese">Japanese (Available now)</option>
                        <option value="Korean" disabled>
                          Korean (Coming soon)
                        </option>
                        <option value="Chinese" disabled>
                          Chinese (Coming soon)
                        </option>
                        <option value="Spanish" disabled>
                          Spanish (Coming soon)
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Level
                    </label>
                    <select
                      name="learningLevel"
                      value={formData.learningLevel}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="1">Beginner</option>
                      <option value="2">Intermediate</option>
                      <option value="3">Advanced</option>
                      <option value="4">Expert</option>
                      <option value="5">Native</option>
                    </select>
                  </div>
                </div>

                {/* Consistency Graph */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Activity</h3>
                  <ConsistencyGraph activityData={mockActivityData} />
                </div>

                {/* Achievements */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Flame className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="font-semibold text-gray-900">7 Day Streak</div>
                        <div className="text-xs text-gray-600">First week!</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Award className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="font-semibold text-gray-900">100 Words</div>
                        <div className="text-xs text-gray-600">Century club</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Zap className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="font-semibold text-gray-900">Speed Reader</div>
                        <div className="text-xs text-gray-600">10 posts/day</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                          <Globe className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="font-semibold text-gray-900">Explorer</div>
                        <div className="text-xs text-gray-600">5 sources</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Learning Stats */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Statistics</h3>
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Words Learned</span>
                          <span className="font-medium text-gray-900">847 / 1000</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-orange-500 h-2 rounded-full" style={{ width: '84.7%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Posts Read</span>
                          <span className="font-medium text-gray-900">234 / 300</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Flashcards Reviewed</span>
                          <span className="font-medium text-gray-900">1,234 / 2000</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '61.7%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Daily Goals */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Goals</h3>
                  <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Daily Word Goal
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          name="dailyWordGoal"
                          min="5"
                          max="50"
                          step="5"
                          value={formData.dailyWordGoal}
                          onChange={handleInputChange}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-lg font-semibold text-gray-900 w-12 text-center">
                          {formData.dailyWordGoal}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Learn {formData.dailyWordGoal} new words every day
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Daily Reading Goal (Posts)
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          name="dailyReadingGoal"
                          min="1"
                          max="20"
                          step="1"
                          value={formData.dailyReadingGoal}
                          onChange={handleInputChange}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-lg font-semibold text-gray-900 w-12 text-center">
                          {formData.dailyReadingGoal}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Read {formData.dailyReadingGoal} posts every day
                      </p>
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            Daily Study Reminder
                          </h3>
                          <p className="text-sm text-gray-500">
                            Get reminded to study at your preferred time
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="studyReminder"
                            checked={formData.studyReminder}
                            onChange={handleInputChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                        </label>
                      </div>

                      {formData.studyReminder && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reminder Time
                          </label>
                          <input
                            type="time"
                            name="reminderTime"
                            value={formData.reminderTime}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Appearance Settings */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h3>
                  <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Theme
                      </label>
                      <select
                        name="theme"
                        value={formData.theme}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark (Coming Soon)</option>
                        <option value="auto">Auto (Coming Soon)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Accent Color
                      </label>
                      <div className="grid grid-cols-4 gap-3">
                        {[
                          { name: 'orange', color: 'bg-orange-500' },
                          { name: 'blue', color: 'bg-blue-500' },
                          { name: 'green', color: 'bg-green-500' },
                          { name: 'purple', color: 'bg-purple-500' },
                          { name: 'pink', color: 'bg-pink-500' },
                          { name: 'red', color: 'bg-red-500' },
                          { name: 'yellow', color: 'bg-yellow-500' },
                          { name: 'gray', color: 'bg-gray-600' }
                        ].map(({ name, color }) => (
                          <button
                            key={name}
                            onClick={() => setFormData(prev => ({ ...prev, accentColor: name }))}
                            className={`h-12 ${color} rounded-lg border-2 transition-all ${
                              formData.accentColor === name ? 'border-gray-900 scale-105' : 'border-transparent'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Font Size
                      </label>
                      <select
                        name="fontSize"
                        value={formData.fontSize}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                        <option value="xlarge">Extra Large</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Email Notifications
                      </h3>
                      <p className="text-sm text-gray-500">
                        Receive notifications via email
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="emailNotifications"
                        checked={formData.emailNotifications}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Push Notifications
                      </h3>
                      <p className="text-sm text-gray-500">
                        Receive push notifications on your device
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="pushNotifications"
                        checked={formData.pushNotifications}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Comment Notifications
                      </h3>
                      <p className="text-sm text-gray-500">
                        Get notified when someone comments on your posts
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="commentNotifications"
                        checked={formData.commentNotifications}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === "stats" && (
              <div className="space-y-6">
                {/* Consistency Graph */}
                <ConsistencyGraph activityData={mockActivityData} />

                {/* Achievements */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Flame className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="font-semibold text-gray-900">7 Day Streak</div>
                      <div className="text-xs text-gray-600">First week!</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Award className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="font-semibold text-gray-900">100 Words</div>
                      <div className="text-xs text-gray-600">Century club</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Zap className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="font-semibold text-gray-900">Speed Reader</div>
                      <div className="text-xs text-gray-600">10 posts/day</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Globe className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="font-semibold text-gray-900">Explorer</div>
                      <div className="text-xs text-gray-600">5 sources</div>
                    </div>
                  </div>
                </div>

                {/* Learning Stats */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Learning Statistics</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Words Learned</span>
                        <span className="font-medium text-gray-900">847 / 1000</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-orange-500 h-2 rounded-full" style={{ width: '84.7%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Posts Read</span>
                        <span className="font-medium text-gray-900">234 / 300</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Flashcards Reviewed</span>
                        <span className="font-medium text-gray-900">1,234 / 2000</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '61.7%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Theme
                  </label>
                  <select
                    name="theme"
                    value={formData.theme}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark (Coming Soon)</option>
                    <option value="auto">Auto (Coming Soon)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accent Color
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { name: 'orange', color: 'bg-orange-500' },
                      { name: 'blue', color: 'bg-blue-500' },
                      { name: 'green', color: 'bg-green-500' },
                      { name: 'purple', color: 'bg-purple-500' },
                      { name: 'pink', color: 'bg-pink-500' },
                      { name: 'red', color: 'bg-red-500' },
                      { name: 'yellow', color: 'bg-yellow-500' },
                      { name: 'gray', color: 'bg-gray-600' }
                    ].map(({ name, color }) => (
                      <button
                        key={name}
                        onClick={() => setFormData(prev => ({ ...prev, accentColor: name }))}
                        className={`h-12 ${color} rounded-lg border-2 transition-all ${
                          formData.accentColor === name ? 'border-gray-900 scale-105' : 'border-transparent'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Font Size
                  </label>
                  <select
                    name="fontSize"
                    value={formData.fontSize}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="xlarge">Extra Large</option>
                  </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> Changes to appearance will be applied across the entire app.
                  </p>
                </div>
              </div>
            )}

            {/* Goals Tab */}
            {activeTab === "goals" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Word Goal
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      name="dailyWordGoal"
                      min="5"
                      max="50"
                      step="5"
                      value={formData.dailyWordGoal}
                      onChange={handleInputChange}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-lg font-semibold text-gray-900 w-12 text-center">
                      {formData.dailyWordGoal}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Learn {formData.dailyWordGoal} new words every day
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Reading Goal (Posts)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      name="dailyReadingGoal"
                      min="1"
                      max="20"
                      step="1"
                      value={formData.dailyReadingGoal}
                      onChange={handleInputChange}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-lg font-semibold text-gray-900 w-12 text-center">
                      {formData.dailyReadingGoal}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Read {formData.dailyReadingGoal} posts every day
                  </p>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Daily Study Reminder
                      </h3>
                      <p className="text-sm text-gray-500">
                        Get reminded to study at your preferred time
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="studyReminder"
                        checked={formData.studyReminder}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                    </label>
                  </div>

                  {formData.studyReminder && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reminder Time
                      </label>
                      <input
                        type="time"
                        name="reminderTime"
                        value={formData.reminderTime}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      />
                    </div>
                  )}
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    🎯 <strong>Stay motivated!</strong> Setting realistic goals helps you build consistent learning habits.
                  </p>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === "privacy" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Visibility
                  </label>
                  <select
                    name="profileVisibility"
                    value={formData.profileVisibility}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="public">
                      Public - Anyone can see your profile
                    </option>
                    <option value="friends">
                      Friends Only - Only friends can see your profile
                    </option>
                    <option value="private">
                      Private - Only you can see your profile
                    </option>
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Show Email Address
                      </h3>
                      <p className="text-sm text-gray-500">
                        Allow others to see your email address
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="showEmail"
                        checked={formData.showEmail}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        Show Location
                      </h3>
                      <p className="text-sm text-gray-500">
                        Allow others to see your location
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="showLocation"
                        checked={formData.showLocation}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-600"></div>
                    </label>
                  </div>
                </div>

                {/* Social Management */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Social Management</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setShowFollowers(true)}
                      className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Manage Followers
                    </button>
                    <button
                      onClick={() => setShowFollowing(true)}
                      className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Manage Following
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <button className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors">
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Delete Account</span>
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    This action cannot be undone. All your data will be
                    permanently deleted.
                  </p>
                </div>
              </div>
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
