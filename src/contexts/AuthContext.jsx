import React, { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChange } from '@/services/authService'
import { getUserProfile, createUserProfile } from '@/services/databaseService'

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

  useEffect(() => {
    // Listen to authentication state changes
    const unsubscribe = onAuthStateChange(async (user) => {
      setCurrentUser(user)

      if (user) {
        // User is signed in, fetch their profile
        const profileResult = await getUserProfile(user.uid)

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
                fontSize: profileResult.data.settings?.appearance?.fontSize || 'medium'
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
          const defaultProfile = {
            name: user.displayName || user.email?.split('@')[0] || 'User',
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
                fontSize: 'medium'
              },
              goals: {
                dailyWords: 10,
                dailyReading: 5,
                studyReminder: true,
                reminderTime: '18:00'
              }
            }
          }

          await createUserProfile(user.uid, defaultProfile)
          setUserProfile(defaultProfile)
        }
      } else {
        // User is signed out
        setUserProfile(null)
      }

      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    userProfile,
    setUserProfile,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
