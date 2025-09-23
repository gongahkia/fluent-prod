import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, Mail, User, Globe, Bell, Shield, Trash2, Save, Award, Target, Calendar, TrendingUp, Clock, Flame, BookOpen, Brain, Languages, Settings } from 'lucide-react';

const Profile = ({ userProfile, onProfileUpdate, onBack }) => {
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    bio: userProfile?.bio || '',
    nativeLanguage: userProfile?.nativeLanguages?.[0] || 'English',
    targetLanguage: userProfile?.targetLanguage || 'Japanese',
    learningLevel: userProfile?.level || '5',
    location: userProfile?.location || '',
    website: userProfile?.website || '',
    // Learning settings
    studyGoal: 'Intermediate',
    dailyGoal: '15',
    studyReminders: true,
    weeklyGoal: '5',
    difficultyPreference: 'Progressive',
    // Privacy settings
    profileVisibility: 'public',
    showEmail: false,
    showLocation: true,
    showProgress: true,
    showActivity: true,
    // Notification settings
    emailNotifications: true,
    pushNotifications: true,
    commentNotifications: true,
    followNotifications: true,
    studyReminders: true,
    streakReminders: true,
    weeklyReports: true
  });

  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [showSavedPosts, setShowSavedPosts] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      onProfileUpdate(formData);
      setIsLoading(false);
    }, 1000);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: User },
    { id: 'learning', label: 'Learning', icon: Brain },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'goals', label: 'Goals & Streaks', icon: Target },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notion-style Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-gray-500" />
                <h1 className="text-sm font-medium text-gray-900">Profile Settings</h1>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-xs px-3 py-1.5"
            >
              {isLoading ? (
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving</span>
                </div>
              ) : (
                <>
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Notion-style Profile Header */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
          <div className="px-6 py-6">
            <div className="flex items-start space-x-4">
              <div className="relative">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl font-semibold text-blue-600">
                    {formData.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-colors">
                  <Camera className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900">{formData.name || 'Your Name'}</h2>
                <p className="text-sm text-gray-500">{formData.email}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1 text-xs text-gray-600">
                    <Languages className="w-3 h-3" />
                    <span>{formData.targetLanguage}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-600">
                    <Award className="w-3 h-3" />
                    <span>Level {formData.learningLevel}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-600">
                    <Flame className="w-3 h-3 text-orange-500" />
                    <span>7 day streak</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notion-style Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-3 px-3 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content with Sliding Animation */}
          <div className="relative overflow-hidden min-h-[600px]">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateX(-${
                  activeTab === 'general' ? 0 :
                  activeTab === 'learning' ? 100 :
                  activeTab === 'progress' ? 200 :
                  activeTab === 'goals' ? 300 :
                  activeTab === 'notifications' ? 400 : 500
                }%)`
              }}
            >
              {/* Debug Info */}
              <div className="fixed top-4 right-4 bg-red-500 text-white p-2 rounded text-xs z-50">
                Active: {activeTab} | Transform: {activeTab === 'general' ? 0 : activeTab === 'learning' ? 100 : activeTab === 'progress' ? 200 : activeTab === 'goals' ? 300 : activeTab === 'notifications' ? 400 : 500}%
              </div>
              {/* General Tab */}
              <div className="w-full flex-shrink-0 p-6">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Tell others about yourself and your language learning journey..."
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">
                        Location
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="e.g. New York, USA"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">
                        Website
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="https://yourwebsite.com"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Management */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Social & Content</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      onClick={() => setShowFollowers(true)}
                      className="flex items-center justify-center px-4 py-2.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4 mr-2 text-gray-500" />
                      Followers
                    </button>
                    <button
                      onClick={() => setShowFollowing(true)}
                      className="flex items-center justify-center px-4 py-2.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4 mr-2 text-gray-500" />
                      Following
                    </button>
                    <button
                      onClick={() => setShowSavedPosts(true)}
                      className="flex items-center justify-center px-4 py-2.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <BookOpen className="w-4 h-4 mr-2 text-gray-500" />
                      Saved Posts
                    </button>
                  </div>
                </div>

                {/* Quick Settings Overview */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Settings Overview</h3>

                  {/* Learning Section */}
                  <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center">
                        <Brain className="w-4 h-4 mr-2 text-blue-600" />
                        Learning
                      </h4>
                      <button
                        onClick={() => setActiveTab('learning')}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Manage →
                      </button>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Goal: {formData.studyGoal}</div>
                      <div>Daily Target: {formData.dailyGoal} minutes</div>
                      <div>Difficulty: {formData.difficultyPreference}</div>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-green-50 to-green-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                        Progress
                      </h4>
                      <button
                        onClick={() => setActiveTab('progress')}
                        className="text-xs text-green-600 hover:text-green-800"
                      >
                        View Details →
                      </button>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Current Level: {formData.learningLevel}</div>
                      <div>This Week: 87 minutes studied</div>
                      <div>Current Streak: 5 days</div>
                    </div>
                  </div>

                  {/* Goals & Streaks Section */}
                  <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center">
                        <Target className="w-4 h-4 mr-2 text-orange-600" />
                        Goals & Streaks
                      </h4>
                      <button
                        onClick={() => setActiveTab('goals')}
                        className="text-xs text-orange-600 hover:text-orange-800"
                      >
                        Manage →
                      </button>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Daily Goal: {formData.dailyGoal} minutes</div>
                      <div>Weekly Goal: {formData.weeklyGoal} hours</div>
                      <div>Best Streak: 15 days</div>
                    </div>
                  </div>

                  {/* Notifications Section */}
                  <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center">
                        <Bell className="w-4 h-4 mr-2 text-purple-600" />
                        Notifications
                      </h4>
                      <button
                        onClick={() => setActiveTab('notifications')}
                        className="text-xs text-purple-600 hover:text-purple-800"
                      >
                        Configure →
                      </button>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Email: {formData.emailNotifications ? 'Enabled' : 'Disabled'}</div>
                      <div>Push: {formData.pushNotifications ? 'Enabled' : 'Disabled'}</div>
                      <div>Study Reminders: {formData.studyReminders ? 'On' : 'Off'}</div>
                    </div>
                  </div>

                  {/* Privacy Section */}
                  <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center">
                        <Shield className="w-4 h-4 mr-2 text-gray-600" />
                        Privacy
                      </h4>
                      <button
                        onClick={() => setActiveTab('privacy')}
                        className="text-xs text-gray-600 hover:text-gray-800"
                      >
                        Manage →
                      </button>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Profile: {formData.profileVisibility === 'public' ? 'Public' : 'Private'}</div>
                      <div>Progress Visible: {formData.showProgress ? 'Yes' : 'No'}</div>
                      <div>Email Visible: {formData.showEmail ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Learning Tab */}
              <div className="w-full flex-shrink-0 p-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Language Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">
                        Native Language
                      </label>
                      <select
                        name="nativeLanguage"
                        value={formData.nativeLanguage}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
                      >
                        <option value="English">🇺🇸 English</option>
                        <option value="Spanish">🇪🇸 Spanish</option>
                        <option value="French">🇫🇷 French</option>
                        <option value="German">🇩🇪 German</option>
                        <option value="Chinese">🇨🇳 Chinese</option>
                        <option value="Korean">🇰🇷 Korean</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">
                        Learning Language
                      </label>
                      <select
                        name="targetLanguage"
                        value={formData.targetLanguage}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
                      >
                        <option value="Japanese">🇯🇵 Japanese</option>
                        <option value="Spanish">🇪🇸 Spanish</option>
                        <option value="Korean" disabled>🇰🇷 Korean (Coming soon)</option>
                        <option value="Chinese" disabled>🇨🇳 Chinese (Coming soon)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">
                        Current Level
                      </label>
                      <select
                        name="learningLevel"
                        value={formData.learningLevel}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
                      >
                        <option value="1">A1 - Beginner</option>
                        <option value="2">A2 - Elementary</option>
                        <option value="3">B1 - Intermediate</option>
                        <option value="4">B2 - Upper Intermediate</option>
                        <option value="5">C1 - Advanced</option>
                        <option value="6">C2 - Proficient</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">
                        Learning Goal
                      </label>
                      <select
                        name="studyGoal"
                        value={formData.studyGoal}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
                      >
                        <option value="Casual">Casual Learning</option>
                        <option value="Regular">Regular Practice</option>
                        <option value="Serious">Serious Study</option>
                        <option value="Intensive">Intensive Learning</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Learning Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">
                        Difficulty Preference
                      </label>
                      <select
                        name="difficultyPreference"
                        value={formData.difficultyPreference}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
                      >
                        <option value="Easy">Focus on easier content</option>
                        <option value="Progressive">Progressive difficulty</option>
                        <option value="Challenging">Challenge me more</option>
                        <option value="Mixed">Mixed difficulty levels</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">
                        Content Types (Multi-select)
                      </label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {['News', 'Culture', 'Food', 'Travel', 'Technology', 'Sports'].map((type) => (
                          <span
                            key={type}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md cursor-pointer hover:bg-blue-200 transition-colors"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Tab */}
              <div className="w-full flex-shrink-0 p-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Learning Statistics</h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">Total Study Time</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-800">47h 23m</div>
                      <div className="text-xs text-blue-600">This month: 12h 45m</div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-green-50 to-green-100">
                      <div className="flex items-center space-x-2 mb-2">
                        <BookOpen className="w-4 h-4 text-green-600" />
                        <span className="text-xs font-medium text-green-700">Words Learned</span>
                      </div>
                      <div className="text-2xl font-bold text-green-800">342</div>
                      <div className="text-xs text-green-600">This week: +24</div>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100">
                      <div className="flex items-center space-x-2 mb-2">
                        <Flame className="w-4 h-4 text-orange-600" />
                        <span className="text-xs font-medium text-orange-700">Current Streak</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-800">7 days</div>
                      <div className="text-xs text-orange-600">Best: 21 days</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Weekly Progress</h3>
                  <div className="space-y-3">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                      <div key={day} className="flex items-center space-x-3">
                        <span className="text-xs font-medium text-gray-600 w-8">{day}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.random() * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 w-12">{Math.floor(Math.random() * 60)}min</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Achievements</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { icon: '🔥', title: 'Week Warrior', desc: '7 day streak' },
                      { icon: '📚', title: 'Word Master', desc: '300+ words' },
                      { icon: '⭐', title: 'First Steps', desc: 'Completed onboarding' },
                      { icon: '🎯', title: 'Goal Getter', desc: 'Met weekly goal' },
                    ].map((achievement, index) => (
                      <div key={index} className="p-3 border border-gray-200 rounded-lg text-center hover:bg-gray-50 transition-colors">
                        <div className="text-lg mb-1">{achievement.icon}</div>
                        <div className="text-xs font-medium text-gray-900">{achievement.title}</div>
                        <div className="text-xs text-gray-500">{achievement.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Goals & Streaks Tab */}
              <div className="w-full flex-shrink-0 p-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Daily Goals</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">
                        Daily Study Time (minutes)
                      </label>
                      <select
                        name="dailyGoal"
                        value={formData.dailyGoal}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
                      >
                        <option value="5">5 minutes</option>
                        <option value="10">10 minutes</option>
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">1 hour</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-600">
                        Weekly Study Days
                      </label>
                      <select
                        name="weeklyGoal"
                        value={formData.weeklyGoal}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
                      >
                        <option value="3">3 days per week</option>
                        <option value="4">4 days per week</option>
                        <option value="5">5 days per week</option>
                        <option value="6">6 days per week</option>
                        <option value="7">Every day</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Study Reminders</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Daily Study Reminder</div>
                        <div className="text-xs text-gray-500">Get reminded to study every day</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="studyReminders"
                          checked={formData.studyReminders}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Streak Reminders</div>
                        <div className="text-xs text-gray-500">Don't break your streak!</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="streakReminders"
                          checked={formData.streakReminders}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Streak Status</h3>
                  <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <Flame className="w-6 h-6 text-orange-500" />
                      <div>
                        <div className="text-lg font-bold text-orange-800">7 Day Streak!</div>
                        <div className="text-sm text-orange-600">Keep it up! Only 3 more days to reach 10.</div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      {Array.from({ length: 7 }, (_, i) => (
                        <div key={i} className="w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center">
                          <Flame className="w-3 h-3 text-white" />
                        </div>
                      ))}
                      {Array.from({ length: 3 }, (_, i) => (
                        <div key={i} className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                          <Flame className="w-3 h-3 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notifications Tab */}
              <div className="w-full flex-shrink-0 p-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">General Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Email Notifications</div>
                        <div className="text-xs text-gray-500">Receive notifications via email</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="emailNotifications"
                          checked={formData.emailNotifications}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Push Notifications</div>
                        <div className="text-xs text-gray-500">Receive push notifications on your device</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="pushNotifications"
                          checked={formData.pushNotifications}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Comment Notifications</div>
                        <div className="text-xs text-gray-500">Get notified when someone comments on your posts</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="commentNotifications"
                          checked={formData.commentNotifications}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Learning Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Weekly Progress Reports</div>
                        <div className="text-xs text-gray-500">Get weekly summaries of your learning progress</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="weeklyReports"
                          checked={formData.weeklyReports}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div>
                        <div className="text-sm font-medium text-gray-900">New Content Alerts</div>
                        <div className="text-xs text-gray-500">Be notified when new content is available in your language</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="contentAlerts"
                          checked={true}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Privacy Tab */}
              <div className="w-full flex-shrink-0 p-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Profile Privacy</h3>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-600">
                      Profile Visibility
                    </label>
                    <select
                      name="profileVisibility"
                      value={formData.profileVisibility}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors"
                    >
                      <option value="public">🌍 Public - Anyone can see your profile</option>
                      <option value="friends">👥 Friends Only - Only friends can see your profile</option>
                      <option value="private">🔒 Private - Only you can see your profile</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Information Sharing</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Show Email Address</div>
                        <div className="text-xs text-gray-500">Allow others to see your email address</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="showEmail"
                          checked={formData.showEmail}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Show Location</div>
                        <div className="text-xs text-gray-500">Allow others to see your location</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="showLocation"
                          checked={formData.showLocation}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Show Learning Progress</div>
                        <div className="text-xs text-gray-500">Display your streaks and achievements publicly</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="showProgress"
                          checked={formData.showProgress}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                      <div>
                        <div className="text-sm font-medium text-gray-900">Show Activity Status</div>
                        <div className="text-xs text-gray-500">Let others see when you're online and active</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="showActivity"
                          checked={formData.showActivity}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Account Management</h3>
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <button className="flex items-center space-x-2 text-red-700 hover:text-red-800 transition-colors">
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">Delete Account</span>
                    </button>
                    <p className="text-xs text-red-600 mt-2">
                      This action cannot be undone. All your data, including learning progress, dictionary, and saved posts will be permanently deleted.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Followers Modal */}
      {showFollowers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowFollowers(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Manage Followers</h3>
            <div className="space-y-3">
              {['Yuki Tanaka', 'Sarah Johnson', 'Li Wei'].map((follower, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <span>{follower}</span>
                  <div className="space-x-2">
                    <button className="text-red-500 text-sm">Remove</button>
                    <button className="text-gray-500 text-sm">Block</button>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setShowFollowers(false)}
              className="mt-4 w-full bg-orange-500 text-white py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowFollowing(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Manage Following</h3>
            <div className="space-y-3">
              {['Hiroshi Sato', 'Hanako Yamada', 'Taro Suzuki'].map((following, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <span>{following}</span>
                  <button className="text-red-500 text-sm">Unfollow</button>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setShowFollowing(false)}
              className="mt-4 w-full bg-orange-500 text-white py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Saved Posts Modal */}
      {showSavedPosts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowSavedPosts(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">Saved Posts</h3>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-medium">地元の人だけが知る hidden ラーメン店</h4>
                <p className="text-sm text-gray-600 mt-1">東京の最も busy な地区で地下の food culture を探索...</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">by 田中雪</span>
                  <button className="text-red-500 text-sm">Remove</button>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <h4 className="font-medium">Tokyo の新しい digital art museum が一般公開</h4>
                <p className="text-sm text-gray-600 mt-1">Interactive な digital art 展示は、traditional な日本の美学...</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">by 佐藤博</span>
                  <button className="text-red-500 text-sm">Remove</button>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowSavedPosts(false)}
              className="mt-4 w-full bg-orange-500 text-white py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
              </div>
              </div>
              </div>
              </div>
              </div>
              </div>
    </div>
  );
};

export default Profile;

