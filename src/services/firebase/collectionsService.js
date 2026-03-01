import { createFirestoreId, sanitizeFirestoreId } from "./idUtils"
import {
  arrayRemove,
  arrayUnion,
  collectionsCol,
  deleteDoc,
  doc,
  getDocs,
  nowIso,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  withFirestoreReadRetry,
} from "./shared"

export const createCollection = async (userId, collectionData) => {
  try {
    const collectionId = sanitizeFirestoreId(
      collectionData?.id,
      createFirestoreId()
    )
    const payload = {
      id: collectionId,
      userId: sanitizeFirestoreId(userId, "user"),
      name: collectionData?.name || "Untitled Collection",
      description: collectionData?.description || "",
      isDefault: Boolean(collectionData?.isDefault),
      wordIds: Array.isArray(collectionData?.wordIds)
        ? collectionData.wordIds
        : [],
      createdAt: collectionData?.createdAt || nowIso(),
      updatedAt: nowIso(),
      createdAtTs: serverTimestamp(),
      updatedAtTs: serverTimestamp(),
    }

    await setDoc(doc(collectionsCol(userId), collectionId), payload, {
      merge: true,
    })
    return { success: true, data: payload }
  } catch (error) {
    console.error("Error creating collection:", error)
    return { success: false, error: error.message }
  }
}

export const getCollections = async (userId) => {
  try {
    const snap = await withFirestoreReadRetry("get:collections", () =>
      getDocs(query(collectionsCol(userId), orderBy("createdAt", "desc")))
    )
    const collections = snap.docs.map((d) => d.data())
    return { success: true, data: collections }
  } catch (error) {
    console.error("Error getting collections:", error)
    return { success: false, error: error.message }
  }
}

export const updateCollection = async (userId, collectionId, updates) => {
  try {
    const safeCollectionId = sanitizeFirestoreId(collectionId, "collection")
    await setDoc(
      doc(collectionsCol(userId), safeCollectionId),
      {
        ...updates,
        updatedAt: nowIso(),
        updatedAtTs: serverTimestamp(),
      },
      { merge: true }
    )
    return { success: true }
  } catch (error) {
    console.error("Error updating collection:", error)
    return { success: false, error: error.message }
  }
}

export const deleteCollection = async (userId, collectionId) => {
  try {
    const safeCollectionId = sanitizeFirestoreId(collectionId, "collection")
    await deleteDoc(doc(collectionsCol(userId), safeCollectionId))
    return { success: true }
  } catch (error) {
    console.error("Error deleting collection:", error)
    return { success: false, error: error.message }
  }
}

export const addWordToCollection = async (userId, collectionId, wordId) => {
  try {
    const safeCollectionId = sanitizeFirestoreId(collectionId, "collection")
    const safeWordId = sanitizeFirestoreId(wordId, "word")
    await updateDoc(doc(collectionsCol(userId), safeCollectionId), {
      wordIds: arrayUnion(safeWordId),
      updatedAt: nowIso(),
      updatedAtTs: serverTimestamp(),
    })
    return { success: true }
  } catch (error) {
    console.error("Error adding word to collection:", error)
    return { success: false, error: error.message }
  }
}

export const removeWordFromCollection = async (
  userId,
  collectionId,
  wordId
) => {
  try {
    const safeCollectionId = sanitizeFirestoreId(collectionId, "collection")
    const safeWordId = sanitizeFirestoreId(wordId, "word")
    await updateDoc(doc(collectionsCol(userId), safeCollectionId), {
      wordIds: arrayRemove(safeWordId),
      updatedAt: nowIso(),
      updatedAtTs: serverTimestamp(),
    })
    return { success: true }
  } catch (error) {
    console.error("Error removing word from collection:", error)
    return { success: false, error: error.message }
  }
}
