import { Menu } from "lucide-react"
import React, { useState } from "react"
import Auth from "./components/Auth"
import Dictionary from "./components/Dictionary"
import Flashcards from "./components/Flashcards"
import NewsFeed from "./components/NewsFeed"
import Onboarding from "./components/Onboarding"
import Profile from "./components/Profile"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./components/ui/sheet"
import { useIsMobile } from "./hooks/use-mobile"
import "./App.css"

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [currentView, setCurrentView] = useState("feed") // 'feed', 'profile', 'dictionary', or 'flashcards'
  const [userProfile, setUserProfile] = useState(null)
  const [userDictionary, setUserDictionary] = useState([
    // Start with empty dictionary - users will build their own
  ])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isMobile = useIsMobile()

  const handleAuthComplete = (authData) => {
    setIsAuthenticated(true)
    setUserProfile((prev) => ({ ...prev, ...authData }))
    // Show onboarding for new users, skip for returning users
    setShowOnboarding(authData.isNewUser)
  }

  const handleOnboardingComplete = (profile) => {
    setUserProfile((prev) => ({ ...prev, ...profile }))
    setShowOnboarding(false)
    setCurrentView("feed")
  }

  const handleProfileUpdate = (updatedProfile) => {
    setUserProfile((prev) => ({ ...prev, ...updatedProfile }))
    setCurrentView("feed")
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUserProfile(null)
    setShowOnboarding(false)
    setCurrentView("feed")
  }

  const addWordToDictionary = (wordData) => {
    const newWord = {
      id: Date.now(),
      japanese: wordData.japanese,
      hiragana: wordData.hiragana || wordData.japanese,
      english: wordData.english,
      level: wordData.level || 5,
      example: wordData.example || `${wordData.japanese}の例文です。`,
      exampleEn:
        wordData.exampleEn || `Example sentence with ${wordData.english}.`,
      source: wordData.source || "Influent Post",
      dateAdded: new Date().toISOString(),
    }

    setUserDictionary((prev) => {
      // Check if word already exists
      const exists = prev.some((word) => word.japanese === newWord.japanese)
      if (exists) {
        return prev // Don't add duplicates
      }
      return [...prev, newWord]
    })
  }

  const removeWordFromDictionary = (wordId) => {
    setUserDictionary((prev) => prev.filter((word) => word.id !== wordId))
  }

  const handleNavigation = (view) => {
    setCurrentView(view)
    setIsMobileMenuOpen(false)
  }

  // Show authentication if not authenticated
  if (!isAuthenticated) {
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
      />
    )
  }

  // Show flashcards page
  if (currentView === "flashcards") {
    return (
      <Flashcards
        onBack={() => handleNavigation("feed")}
        userDictionary={userDictionary}
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
                  src="/influent-logo.png"
                  alt="Influent Logo"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-xl font-bold text-gray-900">
                  Influent
                </span>
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
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">🇯🇵 Japan</span>
                <select className="text-sm border border-gray-300 rounded px-2 py-1 bg-white">
                  <option value="japanese">
                    🇯🇵 Japanese
                  </option>
                </select>
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
          </div>
        )}

        <NewsFeed
          selectedCountry="Japan"
          userProfile={userProfile}
          onAddWordToDictionary={addWordToDictionary}
          userDictionary={userDictionary}
        />
      </main>
    </div>
  )
}

export default App
