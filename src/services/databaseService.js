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
 * Add word to user's dictionary
 */
export const addWordToDictionary = async (userId, wordData) => {
  try {
    const wordRef = doc(
      db,
      "users",
      userId,
      "dictionary",
      wordData.id.toString()
    )
    await setDoc(wordRef, {
      ...wordData,
      dateAdded: serverTimestamp(),
    })
    return { success: true }
  } catch (error) {
    console.error("Error adding word to dictionary:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Get all words from user's dictionary
 */
export const getUserDictionary = async (userId) => {
  try {
    const dictionaryRef = collection(db, "users", userId, "dictionary")
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
 * Remove word from user's dictionary
 */
export const removeWordFromDictionary = async (userId, wordId) => {
  try {
    const wordRef = doc(db, "users", userId, "dictionary", wordId.toString())
    await deleteDoc(wordRef)
    return { success: true }
  } catch (error) {
    console.error("Error removing word from dictionary:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Listen to dictionary changes in real-time
 */
export const onDictionaryChange = (userId, callback) => {
  const dictionaryRef = collection(db, "users", userId, "dictionary")
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
