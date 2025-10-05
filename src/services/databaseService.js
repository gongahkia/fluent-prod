import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { isFirebaseBlocked, getFirebaseErrorMessage, retryFirebaseOperation } from '@/utils/firebaseErrorHandler'

// ================== USER PROFILE OPERATIONS ==================

/**
 * Create a new user profile in Firestore
 */
export const createUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, 'users', userId)
    await setDoc(userRef, {
      ...profileData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    return { success: true }
  } catch (error) {
    console.error('Error creating user profile:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await retryFirebaseOperation(() => getDoc(userRef))

    if (userSnap.exists()) {
      return { success: true, data: userSnap.data() }
    }
    return { success: false, error: 'User profile not found' }
  } catch (error) {
    console.error('Error getting user profile:', error)

    // Check if Firebase is blocked
    if (isFirebaseBlocked(error)) {
      const errorInfo = getFirebaseErrorMessage(error)
      return {
        success: false,
        error: errorInfo.message,
        blocked: true,
        errorInfo
      }
    }

    return { success: false, error: error.message }
  }
}

/**
 * Update user profile in Firestore
 * Note: Sensitive API credentials should be encrypted before calling this function
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    })
    return { success: true }
  } catch (error) {
    console.error('Error updating user profile:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update user API credentials (encrypted)
 */
export const updateUserCredentials = async (userId, encryptedCredentials) => {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      credentials: encryptedCredentials,
      updatedAt: serverTimestamp()
    })
    return { success: true }
  } catch (error) {
    console.error('Error updating user credentials:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get user API credentials (encrypted)
 */
export const getUserCredentials = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists() && userSnap.data().credentials) {
      return { success: true, data: userSnap.data().credentials }
    }
    return { success: true, data: null }
  } catch (error) {
    console.error('Error getting user credentials:', error)
    return { success: false, error: error.message }
  }
}

// ================== DICTIONARY OPERATIONS ==================

/**
 * Add word to user's dictionary
 */
export const addWordToDictionary = async (userId, wordData) => {
  try {
    const wordRef = doc(db, 'users', userId, 'dictionary', wordData.id.toString())
    await setDoc(wordRef, {
      ...wordData,
      dateAdded: serverTimestamp()
    })
    return { success: true }
  } catch (error) {
    console.error('Error adding word to dictionary:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all words from user's dictionary
 */
export const getUserDictionary = async (userId) => {
  try {
    const dictionaryRef = collection(db, 'users', userId, 'dictionary')
    const querySnapshot = await retryFirebaseOperation(() => getDocs(dictionaryRef))

    const words = []
    querySnapshot.forEach((doc) => {
      words.push({ id: doc.id, ...doc.data() })
    })

    return { success: true, data: words }
  } catch (error) {
    console.error('Error getting user dictionary:', error)

    // Check if Firebase is blocked
    if (isFirebaseBlocked(error)) {
      const errorInfo = getFirebaseErrorMessage(error)
      return {
        success: false,
        error: errorInfo.message,
        blocked: true,
        errorInfo
      }
    }

    return { success: false, error: error.message }
  }
}

/**
 * Remove word from user's dictionary
 */
export const removeWordFromDictionary = async (userId, wordId) => {
  try {
    const wordRef = doc(db, 'users', userId, 'dictionary', wordId.toString())
    await deleteDoc(wordRef)
    return { success: true }
  } catch (error) {
    console.error('Error removing word from dictionary:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Listen to dictionary changes in real-time
 */
export const onDictionaryChange = (userId, callback) => {
  const dictionaryRef = collection(db, 'users', userId, 'dictionary')
  return onSnapshot(dictionaryRef, (snapshot) => {
    const words = []
    snapshot.forEach((doc) => {
      words.push({ id: doc.id, ...doc.data() })
    })
    callback(words)
  })
}

// ================== FLASHCARD OPERATIONS ==================

/**
 * Save flashcard progress
 */
export const saveFlashcardProgress = async (userId, wordId, progressData) => {
  try {
    const flashcardRef = doc(db, 'users', userId, 'flashcards', wordId.toString())
    await setDoc(flashcardRef, progressData, { merge: true })
    return { success: true }
  } catch (error) {
    console.error('Error saving flashcard progress:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all flashcard progress data
 */
export const getFlashcardProgress = async (userId) => {
  try {
    const flashcardsRef = collection(db, 'users', userId, 'flashcards')
    const querySnapshot = await getDocs(flashcardsRef)

    const progress = {}
    querySnapshot.forEach((doc) => {
      progress[doc.id] = doc.data()
    })

    return { success: true, data: progress }
  } catch (error) {
    console.error('Error getting flashcard progress:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Batch update flashcard progress
 */
export const batchUpdateFlashcards = async (userId, updates) => {
  try {
    const batch = writeBatch(db)

    Object.entries(updates).forEach(([wordId, progressData]) => {
      const flashcardRef = doc(db, 'users', userId, 'flashcards', wordId.toString())
      batch.set(flashcardRef, progressData, { merge: true })
    })

    await batch.commit()
    return { success: true }
  } catch (error) {
    console.error('Error batch updating flashcards:', error)
    return { success: false, error: error.message }
  }
}

// ================== SAVED POSTS OPERATIONS ==================

/**
 * Save a post
 */
export const savePost = async (userId, postData) => {
  try {
    const postRef = doc(db, 'users', userId, 'savedPosts', postData.id.toString())
    await setDoc(postRef, {
      ...postData,
      savedAt: serverTimestamp()
    })
    return { success: true }
  } catch (error) {
    console.error('Error saving post:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all saved posts
 */
export const getSavedPosts = async (userId) => {
  try {
    const postsRef = collection(db, 'users', userId, 'savedPosts')
    const querySnapshot = await getDocs(postsRef)

    const posts = []
    querySnapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() })
    })

    return { success: true, data: posts }
  } catch (error) {
    console.error('Error getting saved posts:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Remove a saved post
 */
export const removeSavedPost = async (userId, postId) => {
  try {
    const postRef = doc(db, 'users', userId, 'savedPosts', postId.toString())
    await deleteDoc(postRef)
    return { success: true }
  } catch (error) {
    console.error('Error removing saved post:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Listen to saved posts changes in real-time
 */
export const onSavedPostsChange = (userId, callback) => {
  const postsRef = collection(db, 'users', userId, 'savedPosts')
  return onSnapshot(postsRef, (snapshot) => {
    const posts = []
    snapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() })
    })
    callback(posts)
  })
}

// ================== MIGRATION UTILITIES ==================

/**
 * Migrate localStorage flashcard data to Firestore
 */
export const migrateFlashcardData = async (userId) => {
  try {
    const localData = localStorage.getItem('flashcardData')
    if (!localData) return { success: true, message: 'No local data to migrate' }

    const flashcardData = JSON.parse(localData)
    await batchUpdateFlashcards(userId, flashcardData)

    // Clear localStorage after successful migration
    localStorage.removeItem('flashcardData')

    return { success: true, message: 'Flashcard data migrated successfully' }
  } catch (error) {
    console.error('Error migrating flashcard data:', error)
    return { success: false, error: error.message }
  }
}
