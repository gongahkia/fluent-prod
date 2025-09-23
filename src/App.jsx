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
  const [selectedLanguage, setSelectedLanguage] = useState('japanese');

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
      />
    );
  }

  // Show flashcards page
  if (currentView === 'flashcards') {
    return (
      <Flashcards
        onBack={() => setCurrentView('feed')}
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
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-7 h-7 bg-gray-800 rounded-md flex items-center justify-center">
                  <span className="text-white font-semibold text-xs">L</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">LivePeek</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {selectedLanguage === 'spanish' ? '🇪🇸 Spain' : '🇯🇵 Japan'}
                </span>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="japanese">🇯🇵 Japanese</option>
                  <option value="spanish">🇪🇸 Spanish</option>
                </select>
              </div>
              
              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-500">
                  Welcome, <span className="font-medium text-gray-800">{userProfile?.name || 'User'}</span>
                </div>
                <button
                  onClick={() => setCurrentView('profile')}
                  className="w-7 h-7 bg-gray-100 rounded-md flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <span className="text-xs font-medium text-gray-600">
                    {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </button>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setCurrentView('feed')}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors ${
              currentView === 'feed'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => setCurrentView('dictionary')}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
              currentView === 'dictionary'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <span>Dictionary</span>
            <Star className="w-4 h-4 text-yellow-500" />
          </button>
          <button
            onClick={() => setCurrentView('flashcards')}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
              currentView === 'flashcards'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <span>Flashcards</span>
            <Star className="w-4 h-4 text-yellow-500" />
          </button>
        </div>

        <NewsFeed selectedCountry={selectedLanguage === 'spanish' ? 'Spain' : 'Japan'} selectedLanguage={selectedLanguage} userProfile={userProfile} />
      </main>
    </div>
  );
}

export default App;

