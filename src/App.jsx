import { Menu, ChevronDown } from "lucide-react"
import React, { useState, useEffect } from "react"
import Auth from "./components/Auth"
import Dictionary from "./components/Dictionary"
import Flashcards from "./components/Flashcards"
import NewsFeed from "./components/NewsFeed"
import Onboarding from "./components/Onboarding"
import Profile from "./components/Profile"
import SavedPosts from "./components/SavedPosts"
import FirebaseBlockedWarning from "./components/FirebaseBlockedWarning"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./components/ui/sheet"
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
  const [currentView, setCurrentView] = useState("feed") // 'feed', 'profile', 'dictionary', 'flashcards', or 'savedposts'
  const [userDictionary, setUserDictionary] = useState([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false)
  const [firebaseError, setFirebaseError] = useState(null)
  const isMobile = useIsMobile()

  // Listen to dictionary changes in real-time
  useEffect(() => {
    if (!currentUser) return

    const unsubscribe = onDictionaryChange(
      currentUser.uid,
      (words) => {
        setUserDictionary(words)
      },
      (error) => {
        // Handle Firebase errors in real-time listener
        console.error('Dictionary listener error:', error)
        if (error.blocked) {
          setFirebaseError(error.errorInfo)
        }
      }
    )

    return () => unsubscribe()
  }, [currentUser])

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
    const result = await addWordToDb(currentUser.uid, newWord)

    // Check for Firebase errors
    if (result && !result.success && result.blocked) {
      setFirebaseError(result.errorInfo)
    }
  }

  const removeWordFromDictionary = async (wordId) => {
    if (!currentUser) return

    // Remove from Firestore (will trigger real-time update)
    await removeWordFromDb(currentUser.uid, wordId)
  }

  const handleNavigation = (view) => {
    setCurrentView(view)
    setIsMobileMenuOpen(false)
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

  // Show authentication if not authenticated
  if (!currentUser) {
    return <Auth onAuthComplete={handleAuthComplete} />
  }

  // Show onboarding for new users
  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />
  }

  // Show dictionary page
  if (currentView === "dictionary") {
    return (
      <Dictionary
        onBack={() => handleNavigation("feed")}
        userDictionary={userDictionary}
        onRemoveWord={removeWordFromDictionary}
        userProfile={userProfile}
      />
    )
  }

  // Show flashcards page
  if (currentView === "flashcards") {
    return (
      <Flashcards
        onBack={() => handleNavigation("feed")}
        userDictionary={userDictionary}
        userProfile={userProfile}
      />
    )
  }

  // Show saved posts page
  if (currentView === "savedposts") {
    return (
      <SavedPosts
        onBack={() => handleNavigation("feed")}
      />
    )
  }

  // Show profile page
  if (currentView === "profile") {
    return (
      <Profile
        userProfile={userProfile}
        onProfileUpdate={handleProfileUpdate}
        onBack={() => handleNavigation("feed")}
      />
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

              {/* Mobile Menu Button */}
              {isMobile && (
                <Sheet
                  open={isMobileMenuOpen}
                  onOpenChange={setIsMobileMenuOpen}
                >
                  <SheetTrigger asChild>
                    <button className="p-2 hover:bg-gray-100 rounded-md">
                      <Menu className="w-5 h-5 text-gray-600" />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[280px]">
                    <SheetHeader>
                      <SheetTitle>Navigation</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col space-y-4 mt-6">
                      <button
                        onClick={() => handleNavigation("feed")}
                        className={`flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                          currentView === "feed"
                            ? "bg-blue-100 text-blue-900"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <span className="text-lg">📰</span>
                        <span className="font-medium">Learning Feed</span>
                      </button>
                      <button
                        onClick={() => handleNavigation("dictionary")}
                        className={`flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                          currentView === "dictionary"
                            ? "bg-green-100 text-green-900"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <span className="text-lg">📚</span>
                        <span className="font-medium">Dictionary</span>
                      </button>
                      <button
                        onClick={() => handleNavigation("flashcards")}
                        className={`flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                          currentView === "flashcards"
                            ? "bg-blue-100 text-blue-900"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <span className="text-lg">🃏</span>
                        <span className="font-medium">Flashcards</span>
                      </button>
                      <button
                        onClick={() => handleNavigation("savedposts")}
                        className={`flex items-center space-x-3 p-3 rounded-lg text-left transition-colors ${
                          currentView === "savedposts"
                            ? "bg-orange-100 text-orange-900"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <span className="text-lg">🔖</span>
                        <span className="font-medium">Saved Posts</span>
                      </button>
                    </div>
                  </SheetContent>
                </Sheet>
              )}
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

              {/* User Profile */}
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          </div>
        )}

        <NewsFeed
          selectedCountry="Japan"
          userProfile={userProfile}
          onAddWordToDictionary={addWordToDictionary}
          userDictionary={userDictionary}
        />
      </main>

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
