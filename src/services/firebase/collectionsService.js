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
    const collectionId = collectionData?.id || crypto.randomUUID()
    const payload = {
      id: collectionId,
      userId,
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
    await setDoc(
      doc(collectionsCol(userId), collectionId),
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
    await deleteDoc(doc(collectionsCol(userId), collectionId))
    return { success: true }
  } catch (error) {
    console.error("Error deleting collection:", error)
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
    await updateDoc(doc(collectionsCol(userId), collectionId), {
      wordIds: arrayRemove(String(wordId)),
      updatedAt: nowIso(),
      updatedAtTs: serverTimestamp(),
    })
    return { success: true }
  } catch (error) {
    console.error("Error removing word from collection:", error)
    return { success: false, error: error.message }
  }
}
