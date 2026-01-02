/**
 * Firebase (Firestore) Database Service
 * Stores only user-accounting related data:
 * - user profiles + settings
 * - encrypted API credentials
 * - dictionary words
 * - saved posts
 * - flashcard progress
 * - social graph (followers/following) + blocks
 *
 * News/translated posts are NOT stored here; they live in repo cache.
 */

import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as fbLimit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'

import { firestore } from '@/lib/firebase'

function nowIso() {
  return new Date().toISOString()
}

function userDoc(userId) {
  return doc(firestore, 'users', userId)
}

function credentialsDoc(userId) {
  return doc(firestore, 'users', userId, 'private', 'credentials')
}

function dictionaryCol(userId) {
  return collection(firestore, 'users', userId, 'dictionaryWords')
}

function savedPostsCol(userId) {
  return collection(firestore, 'users', userId, 'savedPosts')
}

function collectionsCol(userId) {
  return collection(firestore, 'users', userId, 'collections')
}

function flashcardsCol(userId) {
  return collection(firestore, 'users', userId, 'flashcards')
}

function followingCol(userId) {
  return collection(firestore, 'users', userId, 'following')
}

function followersCol(userId) {
  return collection(firestore, 'users', userId, 'followers')
}

function blockingCol(userId) {
  return collection(firestore, 'users', userId, 'blocking')
}

async function deleteAllDocsInCollection(colRef) {
  const snap = await getDocs(query(colRef, fbLimit(500)))
  if (snap.empty) return

  const batch = writeBatch(firestore)
  snap.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()

  // If there were 500, there may be more
  if (snap.size === 500) {
    await deleteAllDocsInCollection(colRef)
  }
}

// ================== USER PROFILE OPERATIONS ==================

export const createUserProfile = async (userId, profileData) => {
  try {
    const payload = {
      ...profileData,
      userId,
      createdAt: profileData?.createdAt || nowIso(),
      updatedAt: nowIso(),
      // Firestore server timestamp for sorting if desired
      createdAtTs: serverTimestamp(),
      updatedAtTs: serverTimestamp(),
      // Help basic prefix-search
      nameLower: (profileData?.name || '').toLowerCase(),
      emailLower: (profileData?.email || '').toLowerCase(),
    }

    await setDoc(userDoc(userId), payload, { merge: true })
    return { success: true, data: payload }
  } catch (error) {
    console.error('Error creating user profile:', error)
    return { success: false, error: error.message }
  }
}

export const getUserProfile = async (userId) => {
  try {
    const snap = await getDoc(userDoc(userId))
    if (!snap.exists()) return { success: false, error: 'User profile not found' }
    return { success: true, data: snap.data() }
  } catch (error) {
    console.error('Error getting user profile:', error)
    return { success: false, error: error.message }
  }
}

export const updateUserProfile = async (userId, updates) => {
  try {
    const patch = {
      ...updates,
      updatedAt: nowIso(),
      updatedAtTs: serverTimestamp(),
    }

    // Maintain search helpers when name/email change
    if (typeof updates?.name === 'string') patch.nameLower = updates.name.toLowerCase()
    if (typeof updates?.email === 'string') patch.emailLower = updates.email.toLowerCase()

    await setDoc(userDoc(userId), patch, { merge: true })
    return { success: true }
  } catch (error) {
    console.error('Error updating user profile:', error)
    return { success: false, error: error.message }
  }
}

// ================== ENCRYPTED CREDENTIALS ==================

export const updateUserCredentials = async (userId, encryptedData) => {
  try {
    await setDoc(credentialsDoc(userId), {
      encryptedData,
      updatedAt: nowIso(),
      updatedAtTs: serverTimestamp(),
    }, { merge: true })

    return { success: true }
  } catch (error) {
    console.error('Error updating credentials:', error)
    return { success: false, error: error.message }
  }
}

export const getUserCredentials = async (userId) => {
  try {
    const snap = await getDoc(credentialsDoc(userId))
    if (!snap.exists()) return { success: true, data: null }
    return { success: true, data: snap.data()?.encryptedData ?? null }
  } catch (error) {
    console.error('Error getting credentials:', error)
    return { success: false, error: error.message }
  }
}

// ================== DICTIONARY ==================

export const addWordToDictionary = async (userId, wordData) => {
  try {
    const wordId = wordData?.id || crypto.randomUUID()
    const payload = {
      ...wordData,
      id: wordId,
      userId,
      language: wordData?.language || wordData?.targetLanguage || wordData?.targetLang || 'Japanese',
      dateAdded: wordData?.dateAdded || nowIso(),
      createdAt: wordData?.createdAt || nowIso(),
      updatedAt: nowIso(),
      createdAtTs: serverTimestamp(),
      updatedAtTs: serverTimestamp(),
    }

    await setDoc(doc(dictionaryCol(userId), wordId), payload, { merge: true })
    return { success: true, data: payload }
  } catch (error) {
    console.error('Error adding word to dictionary:', error)
    return { success: false, error: error.message }
  }
}

export const removeWordFromDictionary = async (userId, wordId) => {
  try {
    await deleteDoc(doc(dictionaryCol(userId), wordId))
    return { success: true }
  } catch (error) {
    console.error('Error removing word from dictionary:', error)
    return { success: false, error: error.message }
  }
}

export const getUserDictionary = async (userId, language = null) => {
  try {
    const base = dictionaryCol(userId)
    const q = language
      ? query(base, where('language', '==', language), orderBy('createdAt', 'desc'))
      : query(base, orderBy('createdAt', 'desc'))

    const snap = await getDocs(q)
    const words = snap.docs.map((d) => d.data())
    return { success: true, data: words }
  } catch (error) {
    console.error('Error getting user dictionary:', error)
    return { success: false, error: error.message }
  }
}

export const onDictionaryChange = (userId, callback, language = null) => {
  const base = dictionaryCol(userId)
  const q = language
    ? query(base, where('language', '==', language), orderBy('createdAt', 'desc'))
    : query(base, orderBy('createdAt', 'desc'))

  return onSnapshot(q, (snap) => {
    const words = snap.docs.map((d) => d.data())
    callback(words)
  })
}

// ================== FLASHCARDS ==================

export const getFlashcardProgress = async (userId) => {
  try {
    const snap = await getDocs(query(flashcardsCol(userId)))
    const progress = {}
    for (const d of snap.docs) {
      progress[d.id] = d.data()
    }
    return { success: true, data: progress }
  } catch (error) {
    console.error('Error getting flashcard progress:', error)
    return { success: false, error: error.message }
  }
}

export const saveFlashcardProgress = async (userId, wordId, progressData) => {
  try {
    await setDoc(doc(flashcardsCol(userId), wordId), {
      ...progressData,
      updatedAt: nowIso(),
      updatedAtTs: serverTimestamp(),
    }, { merge: true })

    return { success: true }
  } catch (error) {
    console.error('Error saving flashcard progress:', error)
    return { success: false, error: error.message }
  }
}

export const migrateFlashcardData = async () => {
  // Existing code references this as a one-time localStorage migration.
  // Keep as a no-op for now to avoid breaking UX.
  return { success: true }
}

// ================== SAVED POSTS ==================

export const getSavedPosts = async (userId) => {
  try {
    const q = query(savedPostsCol(userId), orderBy('savedAt', 'desc'))
    const snap = await getDocs(q)
    const posts = snap.docs.map((d) => d.data())
    return { success: true, data: posts }
  } catch (error) {
    console.error('Error getting saved posts:', error)
    return { success: false, error: error.message }
  }
}

export const savePost = async (userId, postData) => {
  try {
    const postHash = postData?.postHash || postData?.postId || postData?.id || crypto.randomUUID()
    const postId = postData?.postId || postData?.id || postHash
    const payload = {
      ...postData,
      id: postId,
      postId,
      postHash,
      userId,
      savedAt: postData?.savedAt || nowIso(),
      savedAtTs: serverTimestamp(),
      updatedAt: nowIso(),
      updatedAtTs: serverTimestamp(),
    }

    await setDoc(doc(savedPostsCol(userId), postId), payload, { merge: true })
    return { success: true, data: payload }
  } catch (error) {
    console.error('Error saving post:', error)
    return { success: false, error: error.message }
  }
}

export const removeSavedPost = async (userId, postId) => {
  try {
    await deleteDoc(doc(savedPostsCol(userId), postId))
    return { success: true }
  } catch (error) {
    console.error('Error removing saved post:', error)
    return { success: false, error: error.message }
  }
}

// ================== COLLECTIONS (FLASHCARD / DICTIONARY GROUPS) ==================

export const createCollection = async (userId, collectionData) => {
  try {
    const collectionId = collectionData?.id || crypto.randomUUID()
    const payload = {
      id: collectionId,
      userId,
      name: collectionData?.name || 'Untitled Collection',
      description: collectionData?.description || '',
      isDefault: Boolean(collectionData?.isDefault),
      wordIds: Array.isArray(collectionData?.wordIds) ? collectionData.wordIds : [],
      createdAt: collectionData?.createdAt || nowIso(),
      updatedAt: nowIso(),
      createdAtTs: serverTimestamp(),
      updatedAtTs: serverTimestamp(),
    }

    await setDoc(doc(collectionsCol(userId), collectionId), payload, { merge: true })
    return { success: true, data: payload }
  } catch (error) {
    console.error('Error creating collection:', error)
    return { success: false, error: error.message }
  }
}

export const getCollections = async (userId) => {
  try {
    const snap = await getDocs(query(collectionsCol(userId), orderBy('createdAt', 'desc')))
    const collections = snap.docs.map((d) => d.data())
    return { success: true, data: collections }
  } catch (error) {
    console.error('Error getting collections:', error)
    return { success: false, error: error.message }
  }
}

export const updateCollection = async (userId, collectionId, updates) => {
  try {
    await setDoc(doc(collectionsCol(userId), collectionId), {
      ...updates,
      updatedAt: nowIso(),
      updatedAtTs: serverTimestamp(),
    }, { merge: true })

    return { success: true }
  } catch (error) {
    console.error('Error updating collection:', error)
    return { success: false, error: error.message }
  }
}

export const deleteCollection = async (userId, collectionId) => {
  try {
    await deleteDoc(doc(collectionsCol(userId), collectionId))
    return { success: true }
  } catch (error) {
    console.error('Error deleting collection:', error)
    return { success: false, error: error.message }
  }
}

export const addWordToCollection = async (userId, collectionId, wordId) => {
  try {
    await updateDoc(doc(collectionsCol(userId), collectionId), {
      wordIds: arrayUnion(String(wordId)),
      updatedAt: nowIso(),
      updatedAtTs: serverTimestamp(),
    })
    return { success: true }
  } catch (error) {
    console.error('Error adding word to collection:', error)
    return { success: false, error: error.message }
  }
}

export const removeWordFromCollection = async (userId, collectionId, wordId) => {
  try {
    await updateDoc(doc(collectionsCol(userId), collectionId), {
      wordIds: arrayRemove(String(wordId)),
      updatedAt: nowIso(),
      updatedAtTs: serverTimestamp(),
    })
    return { success: true }
  } catch (error) {
    console.error('Error removing word from collection:', error)
    return { success: false, error: error.message }
  }
}

// ================== SOCIAL (FOLLOW/BLOCK) ==================

export const isFollowing = async (userId, targetUserId) => {
  try {
    const snap = await getDoc(doc(followingCol(userId), targetUserId))
    return { success: true, isFollowing: snap.exists() }
  } catch (error) {
    console.error('Error checking follow status:', error)
    return { success: false, error: error.message, isFollowing: false }
  }
}

export const followUser = async (userId, targetUserId) => {
  try {
    if (userId === targetUserId) return { success: false, error: 'Cannot follow yourself' }

    const batch = writeBatch(firestore)
    batch.set(doc(followingCol(userId), targetUserId), { userId, targetUserId, followedAt: nowIso() }, { merge: true })
    batch.set(doc(followersCol(targetUserId), userId), { userId: targetUserId, followerId: userId, followedAt: nowIso() }, { merge: true })
    await batch.commit()

    return { success: true }
  } catch (error) {
    console.error('Error following user:', error)
    return { success: false, error: error.message }
  }
}

export const unfollowUser = async (userId, targetUserId) => {
  try {
    const batch = writeBatch(firestore)
    batch.delete(doc(followingCol(userId), targetUserId))
    batch.delete(doc(followersCol(targetUserId), userId))
    await batch.commit()

    return { success: true }
  } catch (error) {
    console.error('Error unfollowing user:', error)
    return { success: false, error: error.message }
  }
}

export const getUserFollowers = async (userId) => {
  try {
    const snap = await getDocs(query(followersCol(userId), fbLimit(200)))
    const followerIds = snap.docs.map((d) => d.id)

    // Resolve basic user profiles
    const profiles = await Promise.all(
      followerIds.map(async (fid) => {
        const p = await getDoc(userDoc(fid))
        return p.exists() ? p.data() : { userId: fid }
      })
    )

    return { success: true, data: profiles }
  } catch (error) {
    console.error('Error getting followers:', error)
    return { success: false, error: error.message }
  }
}

export const getUserFollowing = async (userId) => {
  try {
    const snap = await getDocs(query(followingCol(userId), fbLimit(200)))
    const targetIds = snap.docs.map((d) => d.id)

    const profiles = await Promise.all(
      targetIds.map(async (tid) => {
        const p = await getDoc(userDoc(tid))
        return p.exists() ? p.data() : { userId: tid }
      })
    )

    return { success: true, data: profiles }
  } catch (error) {
    console.error('Error getting following:', error)
    return { success: false, error: error.message }
  }
}

export const removeFollower = async (userId, followerId) => {
  try {
    const batch = writeBatch(firestore)
    batch.delete(doc(followersCol(userId), followerId))
    batch.delete(doc(followingCol(followerId), userId))
    await batch.commit()

    return { success: true }
  } catch (error) {
    console.error('Error removing follower:', error)
    return { success: false, error: error.message }
  }
}

export const blockUser = async (userId, targetUserId) => {
  try {
    const batch = writeBatch(firestore)
    batch.set(doc(blockingCol(userId), targetUserId), { userId, targetUserId, blockedAt: nowIso() }, { merge: true })

    // Also sever follow relationships if present
    batch.delete(doc(followingCol(userId), targetUserId))
    batch.delete(doc(followersCol(userId), targetUserId))
    batch.delete(doc(followingCol(targetUserId), userId))
    batch.delete(doc(followersCol(targetUserId), userId))

    await batch.commit()

    return { success: true }
  } catch (error) {
    console.error('Error blocking user:', error)
    return { success: false, error: error.message }
  }
}

// ================== USER SEARCH ==================

export const searchUsers = async (searchTerm) => {
  try {
    const term = (searchTerm || '').trim().toLowerCase()
    if (term.length < 2) return { success: true, data: [] }

    // Firestore doesn't support substring search without external indexing.
    // Implement prefix search on nameLower and emailLower.
    const end = term + '\uf8ff'

    const byName = await getDocs(query(
      collection(firestore, 'users'),
      where('nameLower', '>=', term),
      where('nameLower', '<=', end),
      fbLimit(25)
    ))

    const byEmail = await getDocs(query(
      collection(firestore, 'users'),
      where('emailLower', '>=', term),
      where('emailLower', '<=', end),
      fbLimit(25)
    ))

    const merged = new Map()
    for (const d of [...byName.docs, ...byEmail.docs]) {
      const data = d.data()
      merged.set(d.id, { ...data, userId: d.id })
    }

    return { success: true, data: [...merged.values()] }
  } catch (error) {
    console.error('Error searching users:', error)
    return { success: false, error: error.message, data: [] }
  }
}

// ================== ACCOUNT DELETION (BEST EFFORT) ==================

export const deleteUserAccountData = async (userId) => {
  try {
    // Delete subcollections first
    await deleteAllDocsInCollection(dictionaryCol(userId))
    await deleteAllDocsInCollection(savedPostsCol(userId))
    await deleteAllDocsInCollection(flashcardsCol(userId))
    await deleteAllDocsInCollection(followingCol(userId))
    await deleteAllDocsInCollection(followersCol(userId))
    await deleteAllDocsInCollection(blockingCol(userId))

    // Private docs
    await deleteDoc(credentialsDoc(userId)).catch(() => {})

    // Finally delete the user profile doc
    await deleteDoc(userDoc(userId)).catch(() => {})

    return { success: true }
  } catch (error) {
    console.error('Error deleting user account data:', error)
    return { success: false, error: error.message }
  }
}

export default {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  updateUserCredentials,
  getUserCredentials,
  addWordToDictionary,
  removeWordFromDictionary,
  getUserDictionary,
  onDictionaryChange,
  getFlashcardProgress,
  saveFlashcardProgress,
  migrateFlashcardData,
  getSavedPosts,
  removeSavedPost,
  searchUsers,
  followUser,
  unfollowUser,
  isFollowing,
  getUserFollowers,
  getUserFollowing,
  removeFollower,
  blockUser,
  deleteUserAccountData,
}
