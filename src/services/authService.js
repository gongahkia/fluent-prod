import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

// Create a new user account with email and password
export const registerWithEmail = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)

    // Update user profile with display name
    if (displayName) {
      await updateProfile(userCredential.user, {
        displayName: displayName
      })
    }

    return {
      success: true,
      user: userCredential.user,
      isNewUser: true
    }
  } catch (error) {
    console.error('Error registering user:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Sign in with email and password
export const signInWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    return {
      success: true,
      user: userCredential.user,
      isNewUser: false
    }
  } catch (error) {
    console.error('Error signing in:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)

    // Check if this is a new user
    const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime

    return {
      success: true,
      user: result.user,
      isNewUser: isNewUser
    }
  } catch (error) {
    console.error('Error signing in with Google:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Sign out
export const signOutUser = async () => {
  try {
    await signOut(auth)
    return { success: true }
  } catch (error) {
    console.error('Error signing out:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Send password reset email
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email)
    return { success: true }
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Listen to auth state changes
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback)
}

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser
}
