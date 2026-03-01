import { mapFirestoreError } from "./errorMapper"
import { sanitizeFirestoreId } from "./idUtils"
import {
  doc,
  flashcardsCol,
  getDocs,
  nowIso,
  query,
  serverTimestamp,
  setDoc,
  withFirestoreReadRetry,
  withFirestoreWrite,
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
    const mapped = mapFirestoreError(error)
    return {
      success: false,
      error: mapped.message,
      errorCode: mapped.errorCode,
    }
  }
}

export const saveFlashcardProgress = async (userId, wordId, progressData) => {
  try {
    const safeWordId = sanitizeFirestoreId(wordId, "word")
    await withFirestoreWrite("set:flashcardProgress", () =>
      setDoc(
        doc(flashcardsCol(userId), safeWordId),
        {
          ...progressData,
          updatedAt: nowIso(),
          updatedAtTs: serverTimestamp(),
        },
        { merge: true }
      )
    )
    return { success: true }
  } catch (error) {
    console.error("Error saving flashcard progress:", error)
    const mapped = mapFirestoreError(error)
    return {
      success: false,
      error: mapped.message,
      errorCode: mapped.errorCode,
    }
  }
}

export const migrateFlashcardData = async () => {
  return { success: true }
}
