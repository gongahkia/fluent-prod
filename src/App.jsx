import { ChevronDown } from "lucide-react"
import React, { useState, useEffect } from "react"
import { Routes, Route } from "react-router-dom"
import Auth from "./components/Auth"
import Dictionary from "./components/Dictionary"
import Flashcards from "./components/Flashcards"
import NewsFeed from "./components/NewsFeed"
import Onboarding from "./components/Onboarding"
import Profile from "./components/Profile"
import SavedPosts from "./components/SavedPosts"
import UserSearch from "./components/UserSearch"
import FirebaseBlockedWarning from "./components/FirebaseBlockedWarning"
import MobileBottomBar from "./components/MobileBottomBar"
import RedditCallback from "./pages/RedditCallback"
import { useIsMobile } from "./hooks/use-mobile"
import { useAuth } from "./contexts/AuthContext"
import {
  addWordToDictionary as addWordToDb,
  removeWordFromDictionary as removeWordFromDb,
  onDictionaryChange,
  updateUserProfile
} from "./services/databaseService"
import { signOutUser } from "./services/authService"
import "./App.css"

function App() {
  const { currentUser, userProfile, setUserProfile } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [currentView, setCurrentView] = useState("feed") // 'feed', 'profile', 'dictionary', 'flashcards', 'savedposts', or 'users'
  const [userDictionary, setUserDictionary] = useState([])
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [firebaseError, setFirebaseError] = useState(null)
  const isMobile = useIsMobile()

  // Listen to dictionary changes in real-time (language-specific)
  useEffect(() => {
    if (!currentUser || !userProfile?.targetLanguage) return

    const unsubscribe = onDictionaryChange(
      currentUser.uid,
      (words) => {
        setUserDictionary(words)
      },
      userProfile.targetLanguage // Pass target language for correct collection
    )

    return () => unsubscribe()
  }, [currentUser, userProfile?.targetLanguage])

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLanguageDropdown && !event.target.closest('.language-dropdown')) {
        setShowLanguageDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showLanguageDropdown])

  // Check if user needs onboarding
  useEffect(() => {
    if (currentUser && userProfile) {
      // Show onboarding if user doesn't have a level set (new user)
      const needsOnboarding = !userProfile.level || userProfile.level === undefined
      setShowOnboarding(needsOnboarding)
    }
  }, [currentUser, userProfile])

  const handleAuthComplete = (authData) => {
    // Auth state is now managed by AuthContext
    // This function is kept for compatibility but doesn't need to do much
    if (authData.isNewUser) {
      setShowOnboarding(true)
    }
  }

  const handleOnboardingComplete = async (profile) => {
    if (currentUser) {
      // Update user profile in Firestore
      await updateUserProfile(currentUser.uid, profile)
      setUserProfile((prev) => ({ ...prev, ...profile }))
    }
    setShowOnboarding(false)
    setCurrentView("feed")
  }

  const handleProfileUpdate = async (updatedProfile) => {
    if (currentUser) {
      // Update user profile in Firestore
      await updateUserProfile(currentUser.uid, updatedProfile)
      setUserProfile((prev) => ({ ...prev, ...updatedProfile }))
    }
    setCurrentView("feed")
  }

  const handleLogout = async () => {
    await signOutUser()
    setShowOnboarding(false)
    setCurrentView("feed")
  }

  const addWordToDictionary = async (wordData) => {
    if (!currentUser) return

    // Determine target language
    const targetLang = userProfile?.targetLanguage || 'Japanese'

    // Create word object based on language
    const newWord = {
      id: Date.now(),
      level: wordData.level || 5,
      english: wordData.english,
      example: wordData.example,
      exampleEn: wordData.exampleEn || `Example sentence with ${wordData.english}.`,
      source: wordData.source || "Fluent Post",
      targetLanguage: targetLang, // Add target language to word data
    }

    // Add language-specific fields
    if (targetLang === 'Japanese') {
      newWord.japanese = wordData.japanese || wordData.word
      newWord.hiragana = wordData.hiragana || wordData.reading || wordData.japanese
      if (!wordData.example) {
        newWord.example = `${newWord.japanese}の例文です。`
      }
      // Check if word already exists
      const exists = userDictionary.some((word) => word.japanese === newWord.japanese)
      if (exists) return
    } else if (targetLang === 'Korean') {
      newWord.korean = wordData.korean || wordData.word
      newWord.romanization = wordData.romanization || wordData.reading || ''
      if (!wordData.example) {
        newWord.example = `${newWord.korean}의 예문입니다.`
      }
      // Check if word already exists
      const exists = userDictionary.some((word) => word.korean === newWord.korean)
      if (exists) return
    }

    // Add to Firestore (will trigger real-time update)
    // The targetLanguage in newWord will be used to determine the correct collection
    const result = await addWordToDb(currentUser.uid, newWord)

    // Check for Firebase errors
    if (result && !result.success && result.blocked) {
      setFirebaseError(result.errorInfo)
    }
  }

  const removeWordFromDictionary = async (wordId) => {
    if (!currentUser) return

    // Remove from Firestore (will trigger real-time update)
    // Pass target language to remove from correct collection
    const targetLang = userProfile?.targetLanguage || 'Japanese'
    await removeWordFromDb(currentUser.uid, wordId, targetLang)
  }

  const handleNavigation = (view) => {
    setCurrentView(view)
  }

  const handleLanguageChange = async (newLanguage) => {
    if (!currentUser) return

    try {
      await updateUserProfile(currentUser.uid, { targetLanguage: newLanguage })
      setUserProfile((prev) => ({ ...prev, targetLanguage: newLanguage }))
      setShowLanguageDropdown(false)
    } catch (error) {
      console.error('Error updating language:', error)
    }
  }

  // Handle Reddit OAuth callback route first (before auth checks)
  return (
    <Routes>
      {/* Reddit OAuth Callback */}
      <Route path="/auth/reddit/callback" element={<RedditCallback />} />

      {/* Main App */}
      <Route path="*" element={<MainApp
        currentUser={currentUser}
        userProfile={userProfile}
        showOnboarding={showOnboarding}
        currentView={currentView}
        userDictionary={userDictionary}
        showLanguageDropdown={showLanguageDropdown}
        firebaseError={firebaseError}
        isMobile={isMobile}
        setShowLanguageDropdown={setShowLanguageDropdown}
        setCurrentView={setCurrentView}
        handleLanguageChange={handleLanguageChange}
        handleNavigation={handleNavigation}
        handleLogout={handleLogout}
        handleAuthComplete={handleAuthComplete}
        handleOnboardingComplete={handleOnboardingComplete}
        handleProfileUpdate={handleProfileUpdate}
        addWordToDictionary={addWordToDictionary}
        removeWordFromDictionary={removeWordFromDictionary}
        setFirebaseError={setFirebaseError}
      />} />
    </Routes>
  )
}

// Extracted main app logic into separate component
function MainApp({
  currentUser, userProfile, showOnboarding, currentView, userDictionary,
  showLanguageDropdown, firebaseError, isMobile, setShowLanguageDropdown,
  setCurrentView, handleLanguageChange, handleNavigation, handleLogout,
  handleAuthComplete, handleOnboardingComplete, handleProfileUpdate,
  addWordToDictionary, removeWordFromDictionary, setFirebaseError
}) {
  // Show authentication if not authenticated
  if (!currentUser) {
    return <Auth onAuthComplete={handleAuthComplete} />
  }

  // Show onboarding for new users
  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  // Show profile page (full takeover with navbar but no tab bar)
  if (currentView === "profile") {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header - same as main layout */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <img
                    src="/fluent-logo.png"
                    alt="Fluent Logo"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold text-gray-900">
                      Fluent
                    </span>
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full border border-orange-300">
                      BETA
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Language Dropdown */}
                <div className="relative language-dropdown">
                  <button
                    onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700"
                  >
                    <span>
                      {userProfile?.targetLanguage === 'Korean' ? '🇰🇷' : '🇯🇵'} {userProfile?.targetLanguage || 'Japanese'}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showLanguageDropdown && (
                    <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[150px]">
                      <button
                        onClick={() => handleLanguageChange('Japanese')}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center space-x-2 ${
                          userProfile?.targetLanguage === 'Japanese' ? 'bg-gray-50 text-gray-900 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <span>🇯🇵 Japanese</span>
                      </button>
                      <button
                        onClick={() => handleLanguageChange('Korean')}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center space-x-2 ${
                          userProfile?.targetLanguage === 'Korean' ? 'bg-gray-50 text-gray-900 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <span>🇰🇷 Korean</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* User Profile - Hidden on mobile (Profile view) */}
                {!isMobile && (
                  <div className="flex items-center space-x-3">
                    <div className="text-sm text-gray-600">
                      Welcome,{" "}
                      <span className="font-medium text-gray-900">
                        {userProfile?.name || "User"}
                      </span>
                    </div>
                    <button
                      onClick={() => handleNavigation("profile")}
                      className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center hover:bg-orange-200 transition-colors"
                    >
                      <span className="text-sm font-medium text-orange-700">
                        {userProfile?.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                )}

                {/* Mobile logout button - Profile view */}
                {isMobile && (
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-2 py-1"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Profile Content */}
        <div className={isMobile ? 'pb-20' : ''}>
          <Profile
            userProfile={userProfile}
            onProfileUpdate={handleProfileUpdate}
            onBack={() => handleNavigation("feed")}
          />
        </div>

        {/* Mobile Bottom Navigation Bar */}
        {isMobile && (
          <MobileBottomBar
            currentView={currentView}
            onNavigate={handleNavigation}
          />
        )}

        {/* Firebase Blocked Warning */}
        {firebaseError && (
          <FirebaseBlockedWarning
            errorInfo={firebaseError}
            onDismiss={() => setFirebaseError(null)}
          />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img
                  src="/fluent-logo.png"
                  alt="Fluent Logo"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold text-gray-900">
                    Fluent
                  </span>
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full border border-orange-300">
                    BETA
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Language Dropdown */}
              <div className="relative language-dropdown">
                <button
                  onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700"
                >
                  <span>
                    {userProfile?.targetLanguage === 'Korean' ? '🇰🇷' : '🇯🇵'} {userProfile?.targetLanguage || 'Japanese'}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {showLanguageDropdown && (
                  <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[150px]">
                    <button
                      onClick={() => handleLanguageChange('Japanese')}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center space-x-2 ${
                        userProfile?.targetLanguage === 'Japanese' ? 'bg-gray-50 text-gray-900 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span>🇯🇵 Japanese</span>
                    </button>
                    <button
                      onClick={() => handleLanguageChange('Korean')}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors flex items-center space-x-2 ${
                        userProfile?.targetLanguage === 'Korean' ? 'bg-gray-50 text-gray-900 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span>🇰🇷 Korean</span>
                    </button>
                  </div>
                )}
              </div>

              {/* User Profile - Hidden on mobile (Main view) */}
              {!isMobile && (
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-600">
                    Welcome,{" "}
                    <span className="font-medium text-gray-900">
                      {userProfile?.name || "User"}
                    </span>
                  </div>
                  <button
                    onClick={() => handleNavigation("profile")}
                    className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
                  >
                    <span className="text-sm font-medium text-blue-700">
                      {userProfile?.name?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}

              {/* Mobile logout button - Main view */}
              {isMobile && (
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors px-2 py-1"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isMobile ? 'pb-20' : ''}`}>
        {/* Navigation Tabs - Hidden on mobile */}
        {!isMobile && (
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => handleNavigation("feed")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                currentView === "feed"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Learning Feed
            </button>
            <button
              onClick={() => handleNavigation("dictionary")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
                currentView === "dictionary"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>Dictionary</span>
            </button>
            <button
              onClick={() => handleNavigation("flashcards")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
                currentView === "flashcards"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>Flashcards</span>
            </button>
            <button
              onClick={() => handleNavigation("savedposts")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                currentView === "savedposts"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Saved Posts
            </button>
            <button
              onClick={() => handleNavigation("users")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                currentView === "users"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Find Users
            </button>
          </div>
        )}

        {/* Render different views based on currentView */}
        {currentView === "feed" && (
          <NewsFeed
            selectedCountry="Japan"
            userProfile={userProfile}
            onAddWordToDictionary={addWordToDictionary}
            userDictionary={userDictionary}
          />
        )}

        {currentView === "dictionary" && (
          <Dictionary
            userDictionary={userDictionary}
            onRemoveWord={removeWordFromDictionary}
            userProfile={userProfile}
          />
        )}

        {currentView === "flashcards" && (
          <Flashcards
            userDictionary={userDictionary}
            userProfile={userProfile}
          />
        )}

        {currentView === "savedposts" && (
          <SavedPosts
            userProfile={userProfile}
            onAddWordToDictionary={addWordToDictionary}
            userDictionary={userDictionary}
          />
        )}

        {currentView === "users" && <UserSearch />}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      {isMobile && (
        <MobileBottomBar
          currentView={currentView}
          onNavigate={handleNavigation}
        />
      )}

      {/* Firebase Blocked Warning */}
      {firebaseError && (
        <FirebaseBlockedWarning
          errorInfo={firebaseError}
          onDismiss={() => setFirebaseError(null)}
        />
      )}
    </div>
  )
}

export default App
