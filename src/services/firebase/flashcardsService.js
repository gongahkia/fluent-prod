import {
  doc,
  flashcardsCol,
  getDocs,
  nowIso,
  query,
  serverTimestamp,
  setDoc,
  withFirestoreReadRetry,
} from "./shared"

export const getFlashcardProgress = async (userId) => {
  try {
    const snap = await withFirestoreReadRetry("get:flashcards", () =>
      getDocs(query(flashcardsCol(userId)))
    )
    const progress = {}
    for (const d of snap.docs) {
      progress[d.id] = d.data()
    }
    return { success: true, data: progress }
  } catch (error) {
    console.error("Error getting flashcard progress:", error)
    return { success: false, error: error.message }
  }
}

export const saveFlashcardProgress = async (userId, wordId, progressData) => {
  try {
    await setDoc(
      doc(flashcardsCol(userId), wordId),
      {
        ...progressData,
        updatedAt: nowIso(),
        updatedAtTs: serverTimestamp(),
      },
      { merge: true }
    )
    return { success: true }
  } catch (error) {
    console.error("Error saving flashcard progress:", error)
    return { success: false, error: error.message }
  }
}

export const migrateFlashcardData = async () => {
  return { success: true }
}
