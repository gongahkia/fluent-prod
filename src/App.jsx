import { ChevronDown } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Auth from "./components/Auth";
import DictionaryWithPractice from "./components/DictionaryWithPractice";
import NewsFeed from "./components/NewsFeed";
import Onboarding from "./components/Onboarding";
import PublicProfile from "./components/PublicProfile";
import Settings from "./components/Settings";
import SavedPosts from "./components/SavedPosts";
import AuthBlockedWarning from "./components/AuthBlockedWarning";
import MobileBottomBar from "./components/MobileBottomBar";
import LoadingScreen from "./components/ui/LoadingScreen";
import { FluentLogo } from "./components/ui/FluentLogo";
import Toast from "./components/ui/Toast";
import { useAuth } from "./contexts/AuthContext";
import {
  addWordToDictionary as addWordToDb,
  removeWordFromDictionary as removeWordFromDb,
  onDictionaryChange,
  getUserDictionary,
  updateUserProfile,
} from "./services/firebaseDatabaseService";
import { signOutUser } from "./services/authService";
import { prewarmTranslationCacheFromDictionary } from "./lib/wordDatabase";
import { addToastListener } from "./lib/toastBus";
import "./App.css";

function App() {
  const { currentUser, userProfile, setUserProfile } = useAuth();
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [showPostLoginLoading, setShowPostLoginLoading] = useState(false);
  const [showPostOnboardingLoading, setShowPostOnboardingLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentView, setCurrentView] = useState("feed"); // 'feed', 'explore', 'profile', 'settings', 'dictionary', or 'savedposts'
  const [userDictionary, setUserDictionary] = useState([]);
  const [firebaseError, setFirebaseError] = useState(null);
  const [toastState, setToastState] = useState(null);

  // Firebase ID tokens auto-refresh; no explicit session refresh needed.

  // Global toast host (used by translation errors and other non-component code)
  useEffect(() => {
    return addToastListener((detail) => {
      if (!detail?.message) return;
      setToastState({
        message: detail.message,
        icon: detail.icon,
        duration: detail.duration,
      });
    });
  }, []);

  // Handle loading screen completion
  const handleLoadingComplete = () => {
    setShowLoadingScreen(false);
  };

  // Handle post-login loading screen completion
  const handlePostLoginLoadingComplete = () => {
    setShowPostLoginLoading(false);
  };

  // Handle post-onboarding loading screen completion
  const handlePostOnboardingLoadingComplete = () => {
    setShowPostOnboardingLoading(false);
    setCurrentView("feed");
  };

  // Listen to dictionary changes in real-time (language-specific)
  useEffect(() => {
    if (!currentUser) return;

    const targetLanguage = 'Japanese'

    // Initial fetch of dictionary
    const loadDictionary = async () => {
      const result = await getUserDictionary(currentUser.id, targetLanguage);
      if (result.success) {
        setUserDictionary(result.data);
        prewarmTranslationCacheFromDictionary(result.data, targetLanguage);
      }
    };

    loadDictionary();

    // Set up real-time listener
    const unsubscribe = onDictionaryChange(
      currentUser.id,
      (words) => {
        setUserDictionary(words);
        prewarmTranslationCacheFromDictionary(words, targetLanguage);
      },
      targetLanguage, // Pass target language for correct collection
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Ensure target language is Japanese-only.
  // Migrates any legacy profiles that may still have a different target language.
  useEffect(() => {
    if (!currentUser || !userProfile) return;
    if (userProfile.targetLanguage && userProfile.targetLanguage !== 'Japanese') {
      (async () => {
        try {
          await updateUserProfile(currentUser.id, { targetLanguage: 'Japanese' });
          setUserProfile((prev) => ({ ...prev, targetLanguage: 'Japanese' }));
        } catch (error) {
          console.error('Error enforcing Japanese targetLanguage:', error);
        }
      })();
    }
  }, [currentUser, userProfile, setUserProfile]);

  // Check if user needs onboarding
  useEffect(() => {
    // Only run if we have both user and profile loaded
    if (!currentUser || !userProfile) {
      return;
    }

    // FIXED: More robust check for onboarding completion
    // Check if onboardingCompleted flag exists, or if essential onboarding fields are present
    const hasCompletedOnboarding =
      userProfile.onboardingCompleted === true ||
      (userProfile.level &&
       userProfile.targetLanguage &&
       userProfile.nativeLanguages &&
       userProfile.nativeLanguages.length > 0);

    const shouldShowOnboarding = !hasCompletedOnboarding;

    // Only update state if it actually needs to change (prevents infinite loop)
    if (showOnboarding !== shouldShowOnboarding) {
      console.log('Onboarding status changed:', {
        from: showOnboarding,
        to: shouldShowOnboarding,
        hasCompletedOnboarding
      });
      setShowOnboarding(shouldShowOnboarding);
    }
  }, [currentUser, userProfile, showOnboarding]);

  const handleAuthComplete = (authData) => {
    // Auth state is now managed by AuthContext
    // Show loading screen after successful login
    if (authData.isNewUser) {
      setShowOnboarding(true);
    } else {
      // For existing users (not new users), show post-login loading
      setShowPostLoginLoading(true);
    }
  };

  const handleOnboardingComplete = async (profile) => {
    if (currentUser) {
      // FIXED: Add onboardingCompleted flag to prevent re-triggering
      const profileWithFlag = {
        ...profile,
        onboardingCompleted: true,
        completedAt: new Date().toISOString(),
      };

      console.log('Saving onboarding profile:', profileWithFlag);

      // CRITICAL FIX: Use upsert instead of update to handle cases where profile doesn't exist yet
      // This can happen if user confirms email and gets redirected with a stale session
      const result = await updateUserProfile(currentUser.id, profileWithFlag);

      if (result.success) {
        console.log('Onboarding profile saved successfully');
        
        // Re-fetch the profile from database to ensure we have the latest data
        const { getUserProfile } = await import('./services/firebaseDatabaseService');
        const refreshedProfile = await getUserProfile(currentUser.id);
        
        if (refreshedProfile.success) {
          console.log('Profile refreshed after onboarding:', refreshedProfile.data);
          setUserProfile(refreshedProfile.data);
        } else {
          // Fallback to manual state update if re-fetch fails
          console.warn('Failed to refresh profile, using manual update');
          setUserProfile((prev) => ({ 
            ...prev, 
            ...profileWithFlag,
            email: currentUser.email
          }));
        }
        
        setShowOnboarding(false);
        // Show loading screen after onboarding completion
        setShowPostOnboardingLoading(true);
      } else {
        console.error('Failed to save onboarding profile:', result.error);
        alert('Failed to save your profile. Please try again.');
      }
    }
  };

  const handleProfileUpdate = async (updatedProfile) => {
    if (currentUser) {
      // Update user profile in Firebase
      await updateUserProfile(currentUser.id, updatedProfile);
      setUserProfile((prev) => ({ ...prev, ...updatedProfile }));
    }
    setCurrentView("feed");
  };

  const handleLogout = async () => {
    await signOutUser();
    setShowOnboarding(false);
    setCurrentView("feed");
  };

  const addWordToDictionary = async (wordData) => {
    if (!currentUser) return;

    // Japanese-only
    const targetLang = "Japanese";

    // Create word object based on language
    const newWord = {
      id: Date.now(),
      level: wordData.level || 5,
      english: wordData.english,
      example: wordData.example,
      exampleEn:
        wordData.exampleEn || `Example sentence with ${wordData.english}.`,
      source: wordData.source || "Fluent Post",
      targetLanguage: targetLang, // Add target language to word data
    };

    // Add language-specific fields
    newWord.japanese = wordData.japanese || wordData.word;
    newWord.hiragana = wordData.hiragana || wordData.reading || wordData.japanese;
    if (!wordData.example) {
      newWord.example = `${newWord.japanese}の例文です。`;
    }
    // Check if word already exists
    const exists = userDictionary.some((word) => word.japanese === newWord.japanese);
    if (exists) return;

    // Add to Firebase (Firestore)
    // The targetLanguage in newWord will be used to determine the correct collection
    const result = await addWordToDb(currentUser.id, newWord);

    // Check for Firebase errors
    if (result && !result.success && result.blocked) {
      setFirebaseError(result.errorInfo);
    }

    // Manually refresh dictionary since realtime might not be enabled
    if (result && result.success) {
      const dictResult = await getUserDictionary(currentUser.id, targetLang);
      if (dictResult.success) {
        setUserDictionary(dictResult.data);
      }
    }
  };

  const removeWordFromDictionary = async (wordId) => {
    if (!currentUser) return;

    // Remove from Firebase (Firestore)
    // Pass target language to remove from correct collection
    const targetLang = userProfile?.targetLanguage || "Japanese";
    const result = await removeWordFromDb(currentUser.id, wordId, targetLang);

    // Manually refresh dictionary since realtime might not be enabled
    if (result && result.success) {
      const dictResult = await getUserDictionary(currentUser.id, targetLang);
      if (dictResult.success) {
        setUserDictionary(dictResult.data);
      }
    }
  };

  const handleNavigation = (view) => {
    setCurrentView(view);
  };

  // Language switching removed (Japanese-only).

  // Show loading screen on initial app load
  if (showLoadingScreen) {
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} />;
  }

  // Show loading screen after successful login (for existing users)
  if (showPostLoginLoading) {
    return <LoadingScreen onLoadingComplete={handlePostLoginLoadingComplete} showText={true} />;
  }

  // Show loading screen after onboarding completion
  if (showPostOnboardingLoading) {
    return <LoadingScreen onLoadingComplete={handlePostOnboardingLoadingComplete} showText={true} />;
  }

  return (
    <>
      {toastState && (
        <Toast
          message={toastState.message}
          icon={toastState.icon}
          duration={toastState.duration}
          onClose={() => setToastState(null)}
        />
      )}
      <Routes>
        {/* Main App */}
        <Route
          path="*"
          element={
            <MainApp
              currentUser={currentUser}
              userProfile={userProfile}
              showOnboarding={showOnboarding}
              currentView={currentView}
              userDictionary={userDictionary}
              firebaseError={firebaseError}
              setCurrentView={setCurrentView}
              handleNavigation={handleNavigation}
              handleLogout={handleLogout}
              handleAuthComplete={handleAuthComplete}
              handleOnboardingComplete={handleOnboardingComplete}
              handleProfileUpdate={handleProfileUpdate}
              addWordToDictionary={addWordToDictionary}
              removeWordFromDictionary={removeWordFromDictionary}
              setFirebaseError={setFirebaseError}
            />
          }
        />
      </Routes>
    </>
  );
}

// Extracted main app logic into separate component
function MainApp({
  currentUser,
  userProfile,
  showOnboarding,
  currentView,
  userDictionary,
  firebaseError,
  setCurrentView,
  handleNavigation,
  handleLogout,
  handleAuthComplete,
  handleOnboardingComplete,
  handleProfileUpdate,
  addWordToDictionary,
  removeWordFromDictionary,
  setFirebaseError,
}) {
  // Show authentication if not authenticated
  if (!currentUser) {
    return <Auth onAuthComplete={handleAuthComplete} />;
  }

  // Show onboarding for new users
  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Show profile page (simplified public view with consistent navigation)
  if (currentView === "profile") {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <PublicProfile
          userProfile={userProfile}
          onBack={() => handleNavigation("feed")}
          onNavigateToSettings={() => handleNavigation("settings")}
        />

        <MobileBottomBar currentView={currentView} onNavigate={handleNavigation} />

        {/* Auth Blocked Warning */}
        {firebaseError && (
          <AuthBlockedWarning
            errorInfo={firebaseError}
            onDismiss={() => setFirebaseError(null)}
          />
        )}
      </div>
    );
  }

  // Show settings page (account configuration with consistent navigation)
  if (currentView === "settings") {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <Settings
          userProfile={userProfile}
          onProfileUpdate={handleProfileUpdate}
          onBack={() => handleNavigation("feed")}
          onLogout={handleLogout}
        />

        <MobileBottomBar currentView={currentView} onNavigate={handleNavigation} />

        {/* Auth Blocked Warning */}
        {firebaseError && (
          <AuthBlockedWarning
            errorInfo={firebaseError}
            onDismiss={() => setFirebaseError(null)}
          />
        )}
      </div>
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
                <div className="w-8 h-8">
                  <FluentLogo
                    variant="short"
                    className="w-full h-full"
                    alt="Fluent"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded-full border border-orange-300">
                    BETA
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-700">
                <span>{userProfile?.targetLanguage || "Japanese"}</span>
                <ChevronDown className="w-4 h-4 opacity-0" aria-hidden="true" />
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20"
      >
        {/* Render different views based on currentView */}
        {currentView === "feed" && (
          <NewsFeed
            selectedCountry="Japan"
            userProfile={userProfile}
            onAddWordToDictionary={addWordToDictionary}
            userDictionary={userDictionary}
            viewMode="feed"
          />
        )}

        {currentView === "explore" && (
          <NewsFeed
            selectedCountry="Japan"
            userProfile={userProfile}
            onAddWordToDictionary={addWordToDictionary}
            userDictionary={userDictionary}
            viewMode="explore"
          />
        )}

        {(currentView === "dictionary" || currentView === "flashcards") && (
          <DictionaryWithPractice
            userDictionary={userDictionary}
            onRemoveWord={removeWordFromDictionary}
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
      </main>

      <MobileBottomBar currentView={currentView} onNavigate={handleNavigation} />

      {/* Firebase Blocked Warning */}
      {firebaseError && (
        <AuthBlockedWarning
          errorInfo={firebaseError}
          onDismiss={() => setFirebaseError(null)}
        />
      )}
    </div>
  );
}

export default App;
