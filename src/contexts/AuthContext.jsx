import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { onAuthStateChange, signOutUser } from '@/services/authService'
import { getUserProfile, createUserProfile } from '@/services/firebaseDatabaseService'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isGuest, setIsGuest] = useState(false)
  const loadedUserIdRef = useRef(null)

  const signInAsGuest = () => {
    const guestUser = {
      id: "guest",
      uid: "guest",
      name: "Guest",
      isGuest: true,
    }
    setCurrentUser(guestUser)
    setUserProfile({
      name: "Guest",
      isGuest: true,
      settings: {
        appearance: { theme: localStorage.getItem("fluent:theme") || "light" },
      },
    })
    setIsGuest(true)
    setLoading(false)
  }

  const signOut = async () => {
    if (isGuest) {
      setCurrentUser(null)
      setUserProfile(null)
      setIsGuest(false)
      // Since we're not reloading the page, explicitly set loading to true and then false 
      // to ensure all downstream components re-render correctly after guest sign-out.
      setLoading(true)
      setTimeout(() => setLoading(false), 0)
    } else {
      await signOutUser()
    }
  }

  useEffect(() => {
    if (isGuest) return

    // Listen to authentication state changes
    const unsubscribe = onAuthStateChange(async (user) => {
      // Firebase uses user.uid; the existing app uses currentUser.id in many places.
      // Attach id for compatibility.
      if (user && !user.id) {
        // eslint-disable-next-line no-param-reassign
        user.id = user.uid
      }

      setCurrentUser(user)

      if (user) {
        // Only fetch profile if we haven't already loaded it for this user
        // This prevents infinite re-renders from auth state changes
        if (loadedUserIdRef.current === user.id) {
          setLoading(false)
          return
        }

        loadedUserIdRef.current = user.id

        // User is signed in, fetch their profile
        const profileResult = await getUserProfile(user.id)

        if (profileResult.success) {
          // Merge user profile with any missing default values
          const profile = {
            ...profileResult.data,
            // Ensure settings exist with defaults
            settings: {
              notifications: {
                email: profileResult.data.settings?.notifications?.email ?? true,
                push: profileResult.data.settings?.notifications?.push ?? true,
                comments: profileResult.data.settings?.notifications?.comments ?? true
              },
              privacy: {
                profileVisibility: profileResult.data.settings?.privacy?.profileVisibility || 'public',
                showEmail: profileResult.data.settings?.privacy?.showEmail ?? false,
                showLocation: profileResult.data.settings?.privacy?.showLocation ?? true
              },
              appearance: {
                theme: profileResult.data.settings?.appearance?.theme || 'light',
                accentColor: profileResult.data.settings?.appearance?.accentColor || 'orange',
              },
              goals: {
                dailyWords: profileResult.data.settings?.goals?.dailyWords || 10,
                dailyReading: profileResult.data.settings?.goals?.dailyReading || 5,
                studyReminder: profileResult.data.settings?.goals?.studyReminder ?? true,
                reminderTime: profileResult.data.settings?.goals?.reminderTime || '18:00'
              }
            }
          }
          setUserProfile(profile)
        } else {
          // Profile doesn't exist, create a minimal profile
          // DO NOT set level - this should only be set after onboarding
          // Default customization values (previously from onboarding step 4)
          const displayName = user.user_metadata?.display_name ||
                              user.user_metadata?.name ||
                              user.email?.split('@')[0] ||
                              'User'

          const defaultProfile = {
            name: displayName,
            email: user.email,
            bio: '',
            location: '',
            website: '',
            bannerImage: '',
            settings: {
              notifications: {
                email: true,
                push: true,
                comments: true
              },
              privacy: {
                profileVisibility: 'public',
                showEmail: false,
                showLocation: true
              },
              appearance: {
                theme: 'light',
                accentColor: 'orange',
              },
              goals: {
                dailyWords: 10,
                dailyReading: 5,
                studyReminder: true,
                reminderTime: '18:00'
              }
            }
          }

          console.log('Creating new user profile for:', user.id, user.email)
          const createResult = await createUserProfile(user.id, defaultProfile)
          if (createResult.success) {
            console.log('User profile created successfully')
            setUserProfile(defaultProfile)
          } else {
            // Profile creation failed (possibly duplicate)
            // Try to fetch existing profile again
            console.warn('Profile creation failed, attempting to fetch existing profile:', createResult.error)
            const retryResult = await getUserProfile(user.id)
            if (retryResult.success) {
              console.log('Successfully fetched existing profile on retry')
              setUserProfile(retryResult.data)
            } else {
              // Still failed - set a minimal profile to prevent infinite loops
              console.error('Failed to fetch or create profile, using minimal profile')
              setUserProfile({
                ...defaultProfile,
                onboardingCompleted: false // Explicitly set to false
              })
            }
          }
        }
      } else {
        // User is signed out
        setUserProfile(null)
        loadedUserIdRef.current = null
      }

      setLoading(false)
    })

    return unsubscribe
  }, [isGuest])

  const value = {
    currentUser,
    userProfile,
    setUserProfile,
    loading,
    isGuest,
    signInAsGuest,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
