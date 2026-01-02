/**
 * Firebase Authentication Service
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  updatePassword as fbUpdatePassword,
  updateProfile,
  onAuthStateChanged,
  sendEmailVerification,
} from 'firebase/auth'

import { firebaseAuth } from '@/lib/firebase'

/**
 * Register a new user with email and password
 */
export const registerWithEmail = async (email, password, displayName) => {
  try {
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password)

    if (displayName && displayName.trim().length > 0) {
      await updateProfile(cred.user, { displayName: displayName.trim() })
    }

    // Match prior UX: app shows confirmation UI after registration
    await sendEmailVerification(cred.user).catch(() => {})

    return { success: true, user: cred.user, isNewUser: true }
  } catch (error) {
    console.error('Error registering user:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Sign in with email and password
 */
export const signInWithEmail = async (email, password) => {
  try {
    const cred = await signInWithEmailAndPassword(firebaseAuth, email, password)
    return { success: true, user: cred.user, isNewUser: false }
  } catch (error) {
    console.error('Error signing in:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Sign in with Google OAuth
 */
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider()
    const cred = await signInWithPopup(firebaseAuth, provider)
    return { success: true, user: cred.user, isNewUser: false }
  } catch (error) {
    console.error('Error signing in with Google:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Sign out the current user
 */
export const signOutUser = async () => {
  try {
    await signOut(firebaseAuth)
    return { success: true }
  } catch (error) {
    console.error('Error signing out:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(firebaseAuth, email)
    return { success: true }
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Update user password
 */
export const updatePassword = async (newPassword) => {
  try {
    if (!firebaseAuth.currentUser) {
      return { success: false, error: 'Not signed in' }
    }
    await fbUpdatePassword(firebaseAuth.currentUser, newPassword)
    return { success: true }
  } catch (error) {
    console.error('Error updating password:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Update user profile metadata
 */
export const updateUserMetadata = async (metadata) => {
  try {
    if (!firebaseAuth.currentUser) {
      return { success: false, error: 'Not signed in' }
    }

    // Firebase user metadata is limited; map common fields
    const updates = {}
    if (typeof metadata?.display_name === 'string') updates.displayName = metadata.display_name
    if (typeof metadata?.name === 'string') updates.displayName = metadata.name
    if (typeof metadata?.photoURL === 'string') updates.photoURL = metadata.photoURL

    await updateProfile(firebaseAuth.currentUser, updates)
    return { success: true, user: firebaseAuth.currentUser }
  } catch (error) {
    console.error('Error updating user metadata:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Listen to authentication state changes
 */
export const onAuthStateChange = (callback) => {
  const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
    callback(user || null)
  })

  return unsubscribe
};

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  try {
    return firebaseAuth.currentUser
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Get current session
 */
export const getCurrentSession = async () => {
  try {
    const user = firebaseAuth.currentUser
    if (!user) return null
    const token = await user.getIdToken().catch(() => null)
    return { user, access_token: token }
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
};

/**
 * Refresh session
 */
export const refreshSession = async () => {
  try {
    const user = firebaseAuth.currentUser
    if (!user) return { success: false, error: 'Not signed in' }
    await user.getIdToken(true)
    return { success: true }
  } catch (error) {
    console.error('Error refreshing session:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
