/**
 * Admin Service
 * Provides Firebase Admin operations for managing users and data
 */

import { getFirestore } from 'firebase-admin/firestore'

// Lazy-load Firestore instance to avoid initialization issues
const getDb = () => getFirestore()

/**
 * Get all users with their profiles
 */
export const getAllUsers = async () => {
  try {
    const db = getDb()
    const usersSnapshot = await db.collection('users').get()
    const users = []

    usersSnapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      })
    })

    return users
  } catch (error) {
    console.error('Error getting all users:', error)
    throw error
  }
}

/**
 * Get a single user by ID with all their data
 */
export const getUserById = async (userId) => {
  try {
    const db = getDb()
    const userDoc = await db.collection('users').doc(userId).get()

    if (!userDoc.exists) {
      throw new Error('User not found')
    }

    return {
      id: userDoc.id,
      ...userDoc.data()
    }
  } catch (error) {
    console.error('Error getting user:', error)
    throw error
  }
}

/**
 * Update user data
 */
export const updateUser = async (userId, data) => {
  try {
    const db = getDb()
    await db.collection('users').doc(userId).update(data)
    return { success: true, message: 'User updated successfully' }
  } catch (error) {
    console.error('Error updating user:', error)
    throw error
  }
}

/**
 * Delete a user and all their sub-collections
 */
export const deleteUser = async (userId) => {
  try {
    const db = getDb()
    const batch = db.batch()

    // Delete user document
    const userRef = db.collection('users').doc(userId)
    batch.delete(userRef)

    // Delete all sub-collections
    const subCollections = [
      'dictionary_ja',
      'dictionary_ko',
      'flashcards',
      'savedPosts',
      'collections',
      'following',
      'followers',
      'blocked'
    ]

    for (const collectionName of subCollections) {
      const snapshot = await db.collection('users').doc(userId).collection(collectionName).get()
      snapshot.forEach(doc => {
        batch.delete(doc.ref)
      })
    }

    await batch.commit()
    return { success: true, message: 'User deleted successfully' }
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }
}

/**
 * Get user's dictionary entries (Japanese or Korean)
 */
export const getUserDictionary = async (userId, language = 'ja') => {
  try {
    const db = getDb()
    const collectionName = `dictionary_${language}`
    const snapshot = await db.collection('users').doc(userId).collection(collectionName).get()

    const entries = []
    snapshot.forEach(doc => {
      entries.push({
        id: doc.id,
        ...doc.data()
      })
    })

    return entries
  } catch (error) {
    console.error('Error getting dictionary:', error)
    throw error
  }
}

/**
 * Add dictionary entry
 */
export const addDictionaryEntry = async (userId, language, data) => {
  try {
    const db = getDb()
    const collectionName = `dictionary_${language}`
    const docRef = await db.collection('users').doc(userId).collection(collectionName).add(data)
    return { success: true, id: docRef.id, message: 'Dictionary entry added' }
  } catch (error) {
    console.error('Error adding dictionary entry:', error)
    throw error
  }
}

/**
 * Update dictionary entry
 */
export const updateDictionaryEntry = async (userId, language, entryId, data) => {
  try {
    const db = getDb()
    const collectionName = `dictionary_${language}`
    await db.collection('users').doc(userId).collection(collectionName).doc(entryId).update(data)
    return { success: true, message: 'Dictionary entry updated' }
  } catch (error) {
    console.error('Error updating dictionary entry:', error)
    throw error
  }
}

/**
 * Delete dictionary entry
 */
export const deleteDictionaryEntry = async (userId, language, entryId) => {
  try {
    const db = getDb()
    const collectionName = `dictionary_${language}`
    await db.collection('users').doc(userId).collection(collectionName).doc(entryId).delete()
    return { success: true, message: 'Dictionary entry deleted' }
  } catch (error) {
    console.error('Error deleting dictionary entry:', error)
    throw error
  }
}

/**
 * Get user's flashcards
 */
export const getUserFlashcards = async (userId) => {
  try {
    const db = getDb()
    const snapshot = await db.collection('users').doc(userId).collection('flashcards').get()

    const flashcards = []
    snapshot.forEach(doc => {
      flashcards.push({
        id: doc.id,
        ...doc.data()
      })
    })

    return flashcards
  } catch (error) {
    console.error('Error getting flashcards:', error)
    throw error
  }
}

/**
 * Update flashcard
 */
export const updateFlashcard = async (userId, flashcardId, data) => {
  try {
    const db = getDb()
    await db.collection('users').doc(userId).collection('flashcards').doc(flashcardId).update(data)
    return { success: true, message: 'Flashcard updated' }
  } catch (error) {
    console.error('Error updating flashcard:', error)
    throw error
  }
}

/**
 * Delete flashcard
 */
export const deleteFlashcard = async (userId, flashcardId) => {
  try {
    const db = getDb()
    await db.collection('users').doc(userId).collection('flashcards').doc(flashcardId).delete()
    return { success: true, message: 'Flashcard deleted' }
  } catch (error) {
    console.error('Error deleting flashcard:', error)
    throw error
  }
}

/**
 * Get user's saved posts
 */
export const getUserSavedPosts = async (userId) => {
  try {
    const db = getDb()
    const snapshot = await db.collection('users').doc(userId).collection('savedPosts').get()

    const posts = []
    snapshot.forEach(doc => {
      posts.push({
        id: doc.id,
        ...doc.data()
      })
    })

    return posts
  } catch (error) {
    console.error('Error getting saved posts:', error)
    throw error
  }
}

/**
 * Delete saved post
 */
export const deleteSavedPost = async (userId, postId) => {
  try {
    const db = getDb()
    await db.collection('users').doc(userId).collection('savedPosts').doc(postId).delete()
    return { success: true, message: 'Saved post deleted' }
  } catch (error) {
    console.error('Error deleting saved post:', error)
    throw error
  }
}

/**
 * Get user's collections
 */
export const getUserCollections = async (userId) => {
  try {
    const db = getDb()
    const snapshot = await db.collection('users').doc(userId).collection('collections').get()

    const collections = []
    snapshot.forEach(doc => {
      collections.push({
        id: doc.id,
        ...doc.data()
      })
    })

    return collections
  } catch (error) {
    console.error('Error getting collections:', error)
    throw error
  }
}

/**
 * Update collection
 */
export const updateCollection = async (userId, collectionId, data) => {
  try {
    const db = getDb()
    await db.collection('users').doc(userId).collection('collections').doc(collectionId).update(data)
    return { success: true, message: 'Collection updated' }
  } catch (error) {
    console.error('Error updating collection:', error)
    throw error
  }
}

/**
 * Delete collection
 */
export const deleteCollection = async (userId, collectionId) => {
  try {
    const db = getDb()
    await db.collection('users').doc(userId).collection('collections').doc(collectionId).delete()
    return { success: true, message: 'Collection deleted' }
  } catch (error) {
    console.error('Error deleting collection:', error)
    throw error
  }
}

/**
 * Get user's social connections (following, followers, blocked)
 */
export const getUserSocialConnections = async (userId) => {
  try {
    const db = getDb()
    const [followingSnap, followersSnap, blockedSnap] = await Promise.all([
      db.collection('users').doc(userId).collection('following').get(),
      db.collection('users').doc(userId).collection('followers').get(),
      db.collection('users').doc(userId).collection('blocked').get()
    ])

    const following = []
    const followers = []
    const blocked = []

    followingSnap.forEach(doc => following.push({ id: doc.id, ...doc.data() }))
    followersSnap.forEach(doc => followers.push({ id: doc.id, ...doc.data() }))
    blockedSnap.forEach(doc => blocked.push({ id: doc.id, ...doc.data() }))

    return { following, followers, blocked }
  } catch (error) {
    console.error('Error getting social connections:', error)
    throw error
  }
}

/**
 * Search users by email or name
 */
export const searchUsers = async (query) => {
  try {
    const db = getDb()
    const usersSnapshot = await db.collection('users').get()
    const users = []

    const lowerQuery = query.toLowerCase()

    usersSnapshot.forEach(doc => {
      const data = doc.data()
      const email = (data.email || '').toLowerCase()
      const name = (data.name || '').toLowerCase()

      if (email.includes(lowerQuery) || name.includes(lowerQuery)) {
        users.push({
          id: doc.id,
          ...data
        })
      }
    })

    return users
  } catch (error) {
    console.error('Error searching users:', error)
    throw error
  }
}
