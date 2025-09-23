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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <span className="text-xl font-bold text-gray-900">LivePeek</span>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-600">
                  {selectedLanguage === 'spanish' ? '🇪🇸 Spain' : '🇯🇵 Japan'}
                </span>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                >
                  <option value="japanese">🇯🇵 Japanese</option>
                  <option value="spanish">🇪🇸 Spanish</option>
                </select>
              </div>

              {/* User Profile */}
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium text-gray-600">
                  {userProfile?.name || 'User'}
                </div>
                <button
                  onClick={() => setCurrentView('profile')}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-700">
                    {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </button>
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors px-3 py-1 rounded-md hover:bg-gray-50"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-8">
          <button
            onClick={() => setCurrentView('feed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              currentView === 'feed'
                ? 'bg-black text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => setCurrentView('dictionary')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
              currentView === 'dictionary'
                ? 'bg-black text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>Dictionary</span>
            <Star className="w-4 h-4 text-yellow-500" />
          </button>
          <button
            onClick={() => setCurrentView('flashcards')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
              currentView === 'flashcards'
                ? 'bg-black text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>Flashcards</span>
            <Star className="w-4 h-4 text-yellow-500" />
          </button>
        </div>

        {/* Tab Content with Animations */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${currentView === 'feed' ? 0 : currentView === 'dictionary' ? 100 : 200}%)` }}
          >
            {/* Feed Tab */}
            <div className="w-full flex-shrink-0">
              <NewsFeed selectedCountry={selectedLanguage === 'spanish' ? 'Spain' : 'Japan'} selectedLanguage={selectedLanguage} userProfile={userProfile} />
            </div>

            {/* Dictionary Tab */}
            <div className="w-full flex-shrink-0">
              <Dictionary
                onNavigateToFlashcards={() => setCurrentView('flashcards')}
                selectedLanguage={selectedLanguage}
                isEmbedded={true}
              />
            </div>

            {/* Flashcards Tab */}
            <div className="w-full flex-shrink-0">
              <Flashcards
                selectedLanguage={selectedLanguage}
                isEmbedded={true}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;

