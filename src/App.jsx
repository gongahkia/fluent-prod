import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import NewsFeed from './components/NewsFeed';
import Onboarding from './components/Onboarding';
import Profile from './components/Profile';
import Dictionary from './components/Dictionary';
import Flashcards from './components/Flashcards';
import { Star } from 'lucide-react';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentView, setCurrentView] = useState('feed'); // 'feed', 'profile', 'dictionary', or 'flashcards'
  const [userProfile, setUserProfile] = useState(null);
  const [userDictionary, setUserDictionary] = useState([
    // Start with empty dictionary - users will build their own
  ]);

  const handleAuthComplete = (authData) => {
    setIsAuthenticated(true);
    setUserProfile(prev => ({ ...prev, ...authData }));
    // Show onboarding for new users, skip for returning users
    setShowOnboarding(authData.isNewUser);
  };

  const handleOnboardingComplete = (profile) => {
    setUserProfile(prev => ({ ...prev, ...profile }));
    setShowOnboarding(false);
    setCurrentView('feed');
  };

  const handleProfileUpdate = (updatedProfile) => {
    setUserProfile(prev => ({ ...prev, ...updatedProfile }));
    setCurrentView('feed');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserProfile(null);
    setShowOnboarding(false);
    setCurrentView('feed');
  };

  const addWordToDictionary = (wordData) => {
    const newWord = {
      id: Date.now(),
      japanese: wordData.japanese,
      hiragana: wordData.hiragana || wordData.japanese,
      english: wordData.english,
      level: wordData.level || 5,
      example: wordData.example || `${wordData.japanese}の例文です。`,
      exampleEn: wordData.exampleEn || `Example sentence with ${wordData.english}.`,
      source: wordData.source || "LivePeek Post",
      dateAdded: new Date().toISOString()
    };

    setUserDictionary(prev => {
      // Check if word already exists
      const exists = prev.some(word => word.japanese === newWord.japanese);
      if (exists) {
        return prev; // Don't add duplicates
      }
      return [...prev, newWord];
    });
  };

  const removeWordFromDictionary = (wordId) => {
    setUserDictionary(prev => prev.filter(word => word.id !== wordId));
  };

  // Show authentication if not authenticated
  if (!isAuthenticated) {
    return <Auth onAuthComplete={handleAuthComplete} />;
  }

  // Show onboarding for new users
  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Show dictionary page
  if (currentView === 'dictionary') {
    return (
      <Dictionary
        onBack={() => setCurrentView('feed')}
        userDictionary={userDictionary}
        onRemoveWord={removeWordFromDictionary}
      />
    );
  }

  // Show flashcards page
  if (currentView === 'flashcards') {
    return (
      <Flashcards
        onBack={() => setCurrentView('feed')}
        userDictionary={userDictionary}
      />
    );
  }

  // Show profile page
  if (currentView === 'profile') {
    return (
      <Profile 
        userProfile={userProfile}
        onProfileUpdate={handleProfileUpdate}
        onBack={() => setCurrentView('feed')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <span className="text-xl font-bold text-gray-900">LivePeek</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">🇯🇵 Japan</span>
                <select className="text-sm border border-gray-300 rounded px-2 py-1 bg-white">
                  <option value="japanese">🇯🇵 Japanese (More languages coming soon!)</option>
                </select>
              </div>
              
              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-600">
                  Welcome, <span className="font-medium text-gray-900">{userProfile?.name || 'User'}</span>
                </div>
                <button
                  onClick={() => setCurrentView('profile')}
                  className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center hover:bg-orange-200 transition-colors"
                >
                  <span className="text-sm font-medium text-orange-700">
                    {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
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
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setCurrentView('feed')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              currentView === 'feed'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => setCurrentView('dictionary')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
              currentView === 'dictionary'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>Dictionary</span>
            <Star className="w-4 h-4 text-yellow-500" />
          </button>
          <button
            onClick={() => setCurrentView('flashcards')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
              currentView === 'flashcards'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>Flashcards</span>
            <Star className="w-4 h-4 text-yellow-500" />
          </button>
        </div>

        <NewsFeed 
          selectedCountry="Japan" 
          userProfile={userProfile} 
          onAddWordToDictionary={addWordToDictionary}
          userDictionary={userDictionary}
        />
      </main>
    </div>
  );
}

export default App;

