import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import {
  getFirebaseErrorMessage,
  isFirebaseBlocked,
  retryFirebaseOperation,
} from "@/utils/firebaseErrorHandler"

// ================== USER PROFILE OPERATIONS ==================

/**
 * Create a new user profile in Firestore
 */
export const createUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, "users", userId)
    await setDoc(userRef, {
      ...profileData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return { success: true }
  } catch (error) {
    console.error("Error creating user profile:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, "users", userId)
    const userSnap = await retryFirebaseOperation(() => getDoc(userRef))

    if (userSnap.exists()) {
      return { success: true, data: userSnap.data() }
    }
    return { success: false, error: "User profile not found" }
  } catch (error) {
    console.error("Error getting user profile:", error)

    // Check if Firebase is blocked
    if (isFirebaseBlocked(error)) {
      const errorInfo = getFirebaseErrorMessage(error)
      return {
        success: false,
        error: errorInfo.message,
        blocked: true,
        errorInfo,
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
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
    return { success: true }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Update user API credentials (encrypted)
 */
export const updateUserCredentials = async (userId, encryptedCredentials) => {
  try {
    const userRef = doc(db, "users", userId)
    await updateDoc(userRef, {
      credentials: encryptedCredentials,
      updatedAt: serverTimestamp(),
    })
    return { success: true }
  } catch (error) {
    console.error("Error updating user credentials:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get user API credentials (encrypted)
 */
export const getUserCredentials = async (userId) => {
  try {
    const userRef = doc(db, "users", userId)
    const userSnap = await getDoc(userRef)

    if (userSnap.exists() && userSnap.data().credentials) {
      return { success: true, data: userSnap.data().credentials }
    }
    return { success: true, data: null }
  } catch (error) {
    console.error("Error getting user credentials:", error)
    return { success: false, error: error.message }
  }
}

// ================== DICTIONARY OPERATIONS ==================

/**
 * Helper function to get the correct dictionary collection name based on language
 * @param {string} targetLanguage - 'Japanese' or 'Korean'
 * @returns {string} Collection name (e.g., 'dictionary_ja' or 'dictionary_ko')
 */
const getDictionaryCollectionName = (targetLanguage) => {
  const languageCode = targetLanguage === 'Korean' ? 'ko' : 'ja'
  return `dictionary_${languageCode}`
}

/**
 * Add word to user's language-specific dictionary
 * @param {string} userId - User ID
 * @param {object} wordData - Word data including targetLanguage
 */
export const addWordToDictionary = async (userId, wordData) => {
  try {
    // Determine target language from wordData or default to Japanese
    const targetLanguage = wordData.targetLanguage || 'Japanese'
    const collectionName = getDictionaryCollectionName(targetLanguage)

    const wordRef = doc(
      db,
      "users",
      userId,
      collectionName,
      wordData.id.toString()
    )
    await setDoc(wordRef, {
      ...wordData,
      targetLanguage, // Store the language with the word
      dateAdded: serverTimestamp(),
    })
    return { success: true }
  } catch (error) {
    console.error("Error adding word to dictionary:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all words from user's language-specific dictionary
 * @param {string} userId - User ID
 * @param {string} targetLanguage - 'Japanese' or 'Korean' (defaults to 'Japanese')
 */
export const getUserDictionary = async (userId, targetLanguage = 'Japanese') => {
  try {
    const collectionName = getDictionaryCollectionName(targetLanguage)
    const dictionaryRef = collection(db, "users", userId, collectionName)
    const querySnapshot = await retryFirebaseOperation(() =>
      getDocs(dictionaryRef)
    )

    const words = []
    querySnapshot.forEach((doc) => {
      words.push({ id: doc.id, ...doc.data() })
    })

    return { success: true, data: words }
  } catch (error) {
    console.error("Error getting user dictionary:", error)

    // Check if Firebase is blocked
    if (isFirebaseBlocked(error)) {
      const errorInfo = getFirebaseErrorMessage(error)
      return {
        success: false,
        error: errorInfo.message,
        blocked: true,
        errorInfo,
      }
    }

    return { success: false, error: error.message }
  }
}

/**
 * Remove word from user's language-specific dictionary
 * @param {string} userId - User ID
 * @param {string} wordId - Word ID
 * @param {string} targetLanguage - 'Japanese' or 'Korean' (defaults to 'Japanese')
 */
export const removeWordFromDictionary = async (userId, wordId, targetLanguage = 'Japanese') => {
  try {
    const collectionName = getDictionaryCollectionName(targetLanguage)
    const wordRef = doc(db, "users", userId, collectionName, wordId.toString())
    await deleteDoc(wordRef)
    return { success: true }
  } catch (error) {
    console.error("Error removing word from dictionary:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Listen to language-specific dictionary changes in real-time
 * @param {string} userId - User ID
 * @param {function} callback - Callback function
 * @param {string} targetLanguage - 'Japanese' or 'Korean' (defaults to 'Japanese')
 */
export const onDictionaryChange = (userId, callback, targetLanguage = 'Japanese') => {
  const collectionName = getDictionaryCollectionName(targetLanguage)
  const dictionaryRef = collection(db, "users", userId, collectionName)
  return onSnapshot(dictionaryRef, (snapshot) => {
    const words = []
    snapshot.forEach((doc) => {
      words.push({ id: doc.id, ...doc.data() })
    })
    callback(words)
  })
}

/**
 * Get all dictionaries for a user (both Japanese and Korean)
 * Useful for migration and admin purposes
 */
export const getAllUserDictionaries = async (userId) => {
  try {
    const jaResult = await getUserDictionary(userId, 'Japanese')
    const koResult = await getUserDictionary(userId, 'Korean')

    return {
      success: true,
      data: {
        japanese: jaResult.success ? jaResult.data : [],
        korean: koResult.success ? koResult.data : []
      }
    }
  } catch (error) {
    console.error("Error getting all user dictionaries:", error)
    return { success: false, error: error.message }
  }
}

// ================== FLASHCARD OPERATIONS ==================

/**
 * Save flashcard progress
 */
export const saveFlashcardProgress = async (userId, wordId, progressData) => {
  try {
    const flashcardRef = doc(
      db,
      "users",
      userId,
      "flashcards",
      wordId.toString()
    )
    await setDoc(flashcardRef, progressData, { merge: true })
    return { success: true }
  } catch (error) {
    console.error("Error saving flashcard progress:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all flashcard progress data
 */
export const getFlashcardProgress = async (userId) => {
  try {
    const flashcardsRef = collection(db, "users", userId, "flashcards")
    const querySnapshot = await getDocs(flashcardsRef)

    const progress = {}
    querySnapshot.forEach((doc) => {
      progress[doc.id] = doc.data()
    })

    return { success: true, data: progress }
  } catch (error) {
    console.error("Error getting flashcard progress:", error)
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
      const flashcardRef = doc(
        db,
        "users",
        userId,
        "flashcards",
        wordId.toString()
      )
      batch.set(flashcardRef, progressData, { merge: true })
    })

    await batch.commit()
    return { success: true }
  } catch (error) {
    console.error("Error batch updating flashcards:", error)
    return { success: false, error: error.message }
  }
}

// ================== SAVED POSTS OPERATIONS ==================

/**
 * Save a post
 */
export const savePost = async (userId, postData) => {
  try {
    const postRef = doc(
      db,
      "users",
      userId,
      "savedPosts",
      postData.id.toString()
    )
    await setDoc(postRef, {
      ...postData,
      savedAt: serverTimestamp(),
    })
    return { success: true }
  } catch (error) {
    console.error("Error saving post:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all saved posts
 */
export const getSavedPosts = async (userId) => {
  try {
    const postsRef = collection(db, "users", userId, "savedPosts")
    const querySnapshot = await getDocs(postsRef)

    const posts = []
    querySnapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() })
    })

    return { success: true, data: posts }
  } catch (error) {
    console.error("Error getting saved posts:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Remove a saved post
 */
export const removeSavedPost = async (userId, postId) => {
  try {
    const postRef = doc(db, "users", userId, "savedPosts", postId.toString())
    await deleteDoc(postRef)
    return { success: true }
  } catch (error) {
    console.error("Error removing saved post:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Listen to saved posts changes in real-time
 */
export const onSavedPostsChange = (userId, callback) => {
  const postsRef = collection(db, "users", userId, "savedPosts")
  return onSnapshot(postsRef, (snapshot) => {
    const posts = []
    snapshot.forEach((doc) => {
      posts.push({ id: doc.id, ...doc.data() })
    })
    callback(posts)
  })
}

// ================== FLASHCARD COLLECTIONS OPERATIONS ==================

/**
 * Create a new flashcard collection
 */
export const createCollection = async (userId, collectionData) => {
  try {
    const collectionRef = doc(collection(db, "users", userId, "collections"))
    const newCollection = {
      name: collectionData.name,
      description: collectionData.description || "",
      isDefault: collectionData.isDefault || false,
      wordIds: collectionData.wordIds || [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    await setDoc(collectionRef, newCollection)
    return { success: true, id: collectionRef.id, data: newCollection }
  } catch (error) {
    console.error("Error creating collection:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all collections for a user
 */
export const getCollections = async (userId) => {
  try {
    const collectionsRef = collection(db, "users", userId, "collections")
    const querySnapshot = await getDocs(collectionsRef)

    const collections = []
    querySnapshot.forEach((doc) => {
      collections.push({ id: doc.id, ...doc.data() })
    })

    return { success: true, data: collections }
  } catch (error) {
    console.error("Error getting collections:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get a single collection
 */
export const getCollection = async (userId, collectionId) => {
  try {
    const collectionRef = doc(db, "users", userId, "collections", collectionId)
    const collectionSnap = await getDoc(collectionRef)

    if (collectionSnap.exists()) {
      return {
        success: true,
        data: { id: collectionSnap.id, ...collectionSnap.data() },
      }
    }
    return { success: false, error: "Collection not found" }
  } catch (error) {
    console.error("Error getting collection:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Update a collection
 */
export const updateCollection = async (userId, collectionId, updates) => {
  try {
    const collectionRef = doc(db, "users", userId, "collections", collectionId)
    await updateDoc(collectionRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    })
    return { success: true }
  } catch (error) {
    console.error("Error updating collection:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete a collection
 */
export const deleteCollection = async (userId, collectionId) => {
  try {
    const collectionRef = doc(db, "users", userId, "collections", collectionId)
    await deleteDoc(collectionRef)
    return { success: true }
  } catch (error) {
    console.error("Error deleting collection:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Add word to collection
 */
export const addWordToCollection = async (userId, collectionId, wordId) => {
  try {
    const collectionRef = doc(db, "users", userId, "collections", collectionId)
    const collectionSnap = await getDoc(collectionRef)

    if (!collectionSnap.exists()) {
      return { success: false, error: "Collection not found" }
    }

    const currentWordIds = collectionSnap.data().wordIds || []
    if (currentWordIds.includes(wordId.toString())) {
      return { success: true, message: "Word already in collection" }
    }

    await updateDoc(collectionRef, {
      wordIds: [...currentWordIds, wordId.toString()],
      updatedAt: serverTimestamp(),
    })

    return { success: true }
  } catch (error) {
    console.error("Error adding word to collection:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Remove word from collection
 */
export const removeWordFromCollection = async (
  userId,
  collectionId,
  wordId
) => {
  try {
    const collectionRef = doc(db, "users", userId, "collections", collectionId)
    const collectionSnap = await getDoc(collectionRef)

    if (!collectionSnap.exists()) {
      return { success: false, error: "Collection not found" }
    }

    const currentWordIds = collectionSnap.data().wordIds || []
    const updatedWordIds = currentWordIds.filter(
      (id) => id !== wordId.toString()
    )

    await updateDoc(collectionRef, {
      wordIds: updatedWordIds,
      updatedAt: serverTimestamp(),
    })

    return { success: true }
  } catch (error) {
    console.error("Error removing word from collection:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Listen to collections changes in real-time
 */
export const onCollectionsChange = (userId, callback, errorCallback) => {
  const collectionsRef = collection(db, "users", userId, "collections")
  return onSnapshot(
    collectionsRef,
    (snapshot) => {
      const collections = []
      snapshot.forEach((doc) => {
        collections.push({ id: doc.id, ...doc.data() })
      })
      callback(collections)
    },
    (error) => {
      console.error("Collections listener error:", error)
      if (errorCallback) {
        errorCallback(error)
      }
    }
  )
}

/**
 * Get or create the default "Learning" collection
 * Auto-populated with all dictionary words
 */
export const getOrCreateLearningCollection = async (userId) => {
  try {
    // Check if Learning collection already exists
    const collectionsRef = collection(db, "users", userId, "collections")
    const q = query(collectionsRef, where("isDefault", "==", true))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      // Return existing Learning collection
      const learningDoc = querySnapshot.docs[0]
      return {
        success: true,
        data: { id: learningDoc.id, ...learningDoc.data() },
      }
    }

    // Create new Learning collection with all dictionary words
    const dictionaryResult = await getUserDictionary(userId)
    const wordIds = dictionaryResult.success
      ? dictionaryResult.data.map((word) => word.id.toString())
      : []

    const result = await createCollection(userId, {
      name: "Learning",
      description: "Customised by Fluent",
      isDefault: true,
      wordIds: wordIds,
    })

    return result
  } catch (error) {
    console.error("Error getting or creating Learning collection:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Sync Learning collection with dictionary
 * Adds any new dictionary words to the Learning collection
 */
export const syncLearningCollection = async (userId) => {
  try {
    // Get Learning collection
    const collectionsRef = collection(db, "users", userId, "collections")
    const q = query(collectionsRef, where("isDefault", "==", true))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      // Create Learning collection if it doesn't exist
      await getOrCreateLearningCollection(userId)
      return {
        success: true,
        message: "Learning collection created and synced",
      }
    }

    const learningDoc = querySnapshot.docs[0]
    const currentWordIds = learningDoc.data().wordIds || []

    // Get all dictionary words
    const dictionaryResult = await getUserDictionary(userId)
    if (!dictionaryResult.success) {
      return { success: false, error: "Failed to get dictionary" }
    }

    const allWordIds = dictionaryResult.data.map((word) => word.id.toString())

    // Find new words not in Learning collection
    const newWordIds = allWordIds.filter((id) => !currentWordIds.includes(id))

    if (newWordIds.length > 0) {
      await updateDoc(doc(db, "users", userId, "collections", learningDoc.id), {
        wordIds: [...currentWordIds, ...newWordIds],
        updatedAt: serverTimestamp(),
      })
      return {
        success: true,
        message: `Added ${newWordIds.length} new words to Learning collection`,
      }
    }

    return { success: true, message: "Learning collection already up to date" }
  } catch (error) {
    console.error("Error syncing Learning collection:", error)
    return { success: false, error: error.message }
  }
}

// ================== FOLLOWERS/FOLLOWING OPERATIONS ==================

/**
 * Follow a user
 */
export const followUser = async (currentUserId, targetUserId) => {
  try {
    if (currentUserId === targetUserId) {
      return { success: false, error: "Cannot follow yourself" }
    }

    const batch = writeBatch(db)

    // Add to current user's following list
    const followingRef = doc(db, "users", currentUserId, "following", targetUserId)
    batch.set(followingRef, {
      userId: targetUserId,
      followedAt: serverTimestamp(),
    })

    // Add to target user's followers list
    const followersRef = doc(db, "users", targetUserId, "followers", currentUserId)
    batch.set(followersRef, {
      userId: currentUserId,
      followedAt: serverTimestamp(),
    })

    // Update counts
    const currentUserRef = doc(db, "users", currentUserId)
    const targetUserRef = doc(db, "users", targetUserId)

    batch.update(currentUserRef, {
      followingCount: (await getDoc(currentUserRef)).data()?.followingCount || 0 + 1,
      updatedAt: serverTimestamp(),
    })

    batch.update(targetUserRef, {
      followersCount: (await getDoc(targetUserRef)).data()?.followersCount || 0 + 1,
      updatedAt: serverTimestamp(),
    })

    await batch.commit()
    return { success: true }
  } catch (error) {
    console.error("Error following user:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Unfollow a user
 */
export const unfollowUser = async (currentUserId, targetUserId) => {
  try {
    const batch = writeBatch(db)

    // Remove from current user's following list
    const followingRef = doc(db, "users", currentUserId, "following", targetUserId)
    batch.delete(followingRef)

    // Remove from target user's followers list
    const followersRef = doc(db, "users", targetUserId, "followers", currentUserId)
    batch.delete(followersRef)

    // Update counts
    const currentUserRef = doc(db, "users", currentUserId)
    const targetUserRef = doc(db, "users", targetUserId)

    const currentUserDoc = await getDoc(currentUserRef)
    const targetUserDoc = await getDoc(targetUserRef)

    batch.update(currentUserRef, {
      followingCount: Math.max(0, (currentUserDoc.data()?.followingCount || 0) - 1),
      updatedAt: serverTimestamp(),
    })

    batch.update(targetUserRef, {
      followersCount: Math.max(0, (targetUserDoc.data()?.followersCount || 0) - 1),
      updatedAt: serverTimestamp(),
    })

    await batch.commit()
    return { success: true }
  } catch (error) {
    console.error("Error unfollowing user:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Check if current user is following target user
 */
export const isFollowing = async (currentUserId, targetUserId) => {
  try {
    const followingRef = doc(db, "users", currentUserId, "following", targetUserId)
    const followingSnap = await getDoc(followingRef)
    return { success: true, isFollowing: followingSnap.exists() }
  } catch (error) {
    console.error("Error checking follow status:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get user's followers list with profile data
 */
export const getUserFollowers = async (userId) => {
  try {
    const followersRef = collection(db, "users", userId, "followers")
    const querySnapshot = await getDocs(followersRef)

    const followers = []
    for (const docSnap of querySnapshot.docs) {
      const followerUserId = docSnap.id
      const userProfileResult = await getUserProfile(followerUserId)
      if (userProfileResult.success) {
        followers.push({
          userId: followerUserId,
          ...userProfileResult.data,
          followedAt: docSnap.data().followedAt,
        })
      }
    }

    return { success: true, data: followers }
  } catch (error) {
    console.error("Error getting followers:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get user's following list with profile data
 */
export const getUserFollowing = async (userId) => {
  try {
    const followingRef = collection(db, "users", userId, "following")
    const querySnapshot = await getDocs(followingRef)

    const following = []
    for (const docSnap of querySnapshot.docs) {
      const followingUserId = docSnap.id
      const userProfileResult = await getUserProfile(followingUserId)
      if (userProfileResult.success) {
        following.push({
          userId: followingUserId,
          ...userProfileResult.data,
          followedAt: docSnap.data().followedAt,
        })
      }
    }

    return { success: true, data: following }
  } catch (error) {
    console.error("Error getting following:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Remove a follower
 */
export const removeFollower = async (currentUserId, followerUserId) => {
  try {
    const batch = writeBatch(db)

    // Remove from current user's followers list
    const followersRef = doc(db, "users", currentUserId, "followers", followerUserId)
    batch.delete(followersRef)

    // Remove from follower's following list
    const followingRef = doc(db, "users", followerUserId, "following", currentUserId)
    batch.delete(followingRef)

    // Update counts
    const currentUserRef = doc(db, "users", currentUserId)
    const followerUserRef = doc(db, "users", followerUserId)

    const currentUserDoc = await getDoc(currentUserRef)
    const followerUserDoc = await getDoc(followerUserRef)

    batch.update(currentUserRef, {
      followersCount: Math.max(0, (currentUserDoc.data()?.followersCount || 0) - 1),
      updatedAt: serverTimestamp(),
    })

    batch.update(followerUserRef, {
      followingCount: Math.max(0, (followerUserDoc.data()?.followingCount || 0) - 1),
      updatedAt: serverTimestamp(),
    })

    await batch.commit()
    return { success: true }
  } catch (error) {
    console.error("Error removing follower:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Search users by name or email
 */
export const searchUsers = async (searchQuery, limit = 20) => {
  try {
    const usersRef = collection(db, "users")

    // Get all users (Firestore doesn't support text search natively)
    // In production, you'd want to use Algolia or similar for better search
    const querySnapshot = await getDocs(usersRef)

    const users = []
    const lowerQuery = searchQuery.toLowerCase()

    querySnapshot.forEach((doc) => {
      const userData = doc.data()
      const userName = (userData.name || '').toLowerCase()
      const userEmail = (userData.email || '').toLowerCase()

      if (userName.includes(lowerQuery) || userEmail.includes(lowerQuery)) {
        users.push({
          userId: doc.id,
          ...userData,
        })
      }
    })

    // Limit results
    return { success: true, data: users.slice(0, limit) }
  } catch (error) {
    console.error("Error searching users:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Block a user
 */
export const blockUser = async (currentUserId, targetUserId) => {
  try {
    const batch = writeBatch(db)

    // Add to current user's blocked list
    const blockedRef = doc(db, "users", currentUserId, "blocked", targetUserId)
    batch.set(blockedRef, {
      userId: targetUserId,
      blockedAt: serverTimestamp(),
    })

    // Remove any existing follow relationships
    const followingRef = doc(db, "users", currentUserId, "following", targetUserId)
    const followersRef = doc(db, "users", currentUserId, "followers", targetUserId)
    const targetFollowingRef = doc(db, "users", targetUserId, "following", currentUserId)
    const targetFollowersRef = doc(db, "users", targetUserId, "followers", currentUserId)

    batch.delete(followingRef)
    batch.delete(followersRef)
    batch.delete(targetFollowingRef)
    batch.delete(targetFollowersRef)

    await batch.commit()
    return { success: true }
  } catch (error) {
    console.error("Error blocking user:", error)
    return { success: false, error: error.message }
  }
}

// ================== MIGRATION UTILITIES ==================

/**
 * Migrate localStorage flashcard data to Firestore
 */
export const migrateFlashcardData = async (userId) => {
  try {
    const localData = localStorage.getItem("flashcardData")
    if (!localData)
      return { success: true, message: "No local data to migrate" }

    const flashcardData = JSON.parse(localData)
    await batchUpdateFlashcards(userId, flashcardData)

    // Clear localStorage after successful migration
    localStorage.removeItem("flashcardData")

    return { success: true, message: "Flashcard data migrated successfully" }
  } catch (error) {
    console.error("Error migrating flashcard data:", error)
    return { success: false, error: error.message }
  }
}
