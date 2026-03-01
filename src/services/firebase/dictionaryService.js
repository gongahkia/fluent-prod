import { mapFirestoreError } from "./errorMapper"
import { createFirestoreId, sanitizeFirestoreId } from "./idUtils"
import { validateDictionaryWritePayload } from "./schemas"
import {
  deleteDoc,
  dictionaryCol,
  doc,
  getDocs,
  nowIso,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  withFirestoreReadRetry,
  withFirestoreTiming,
  withFirestoreWrite,
} from "./shared"

export const addWordToDictionary = async (userId, wordData) => {
  try {
    const wordId = sanitizeFirestoreId(wordData?.id, createFirestoreId())

    const payload = {
      ...wordData,
      id: wordId,
      userId,
      language:
        wordData?.language ||
        wordData?.targetLanguage ||
        wordData?.targetLang ||
        "Japanese",
      dateAdded: wordData?.dateAdded || nowIso(),
      createdAt: wordData?.createdAt || nowIso(),
      updatedAt: nowIso(),
      createdAtTs: serverTimestamp(),
      updatedAtTs: serverTimestamp(),
    }
    const validatedPayload = validateDictionaryWritePayload(payload)

    await withFirestoreWrite("set:dictionaryWord", () =>
      setDoc(doc(dictionaryCol(userId), wordId), validatedPayload, {
        merge: true,
      })
    )
    return { success: true, data: validatedPayload }
  } catch (error) {
    console.error("Error adding word to dictionary:", error)
    const mapped = mapFirestoreError(error)
    return {
      success: false,
      error: mapped.message,
      errorCode: mapped.errorCode,
    }
  }
}

export const removeWordFromDictionary = async (userId, wordId) => {
  try {
    const safeWordId = sanitizeFirestoreId(wordId, "word")
    await withFirestoreWrite("delete:dictionaryWord", () =>
      deleteDoc(doc(dictionaryCol(userId), safeWordId))
    )
    return { success: true }
  } catch (error) {
    console.error("Error removing word from dictionary:", error)
    const mapped = mapFirestoreError(error)
    return {
      success: false,
      error: mapped.message,
      errorCode: mapped.errorCode,
    }
  }
}

export const getUserDictionary = async (userId, language = null) => {
  try {
    const base = dictionaryCol(userId)
    const q = language
      ? query(
          base,
          where("language", "==", language),
          orderBy("createdAt", "desc")
        )
      : query(base, orderBy("createdAt", "desc"))

    const snap = await withFirestoreTiming("get:dictionaryWords", () =>
      withFirestoreReadRetry("get:dictionaryWords", () => getDocs(q))
    )
    const words = snap.docs.map((d) => d.data())
    return { success: true, data: words }
  } catch (error) {
    if (
      error?.code === "failed-precondition" &&
      String(error?.message || "")
        .toLowerCase()
        .includes("requires an index")
    ) {
      try {
        const base = dictionaryCol(userId)
        const fallbackQuery = language
          ? query(base, where("language", "==", language))
          : query(base)
        const fallbackSnap = await withFirestoreReadRetry(
          "get:dictionaryWords:fallback",
          () => getDocs(fallbackQuery)
        )
        const words = fallbackSnap.docs
          .map((d) => d.data())
          .sort((a, b) =>
            String(b?.createdAt || "").localeCompare(String(a?.createdAt || ""))
          )
        return { success: true, data: words, warning: "missing-index-fallback" }
      } catch {
        console.warn(
          "Firestore index missing for dictionary query and fallback failed."
        )
        return { success: true, data: [], warning: "missing-index" }
      }
    }
    console.error("Error getting user dictionary:", error)
    const mapped = mapFirestoreError(error)
    return {
      success: false,
      error: mapped.message,
      errorCode: mapped.errorCode,
    }
  }
}

export const onDictionaryChange = (userId, callback, language = null) => {
  const base = dictionaryCol(userId)
  const q = language
    ? query(
        base,
        where("language", "==", language),
        orderBy("createdAt", "desc")
      )
    : query(base, orderBy("createdAt", "desc"))

  return onSnapshot(
    q,
    (snap) => {
      const words = snap.docs.map((d) => d.data())
      callback(words)
    },
    (error) => {
      if (
        error?.code === "failed-precondition" &&
        String(error?.message || "")
          .toLowerCase()
          .includes("requires an index")
      ) {
        console.warn(
          "Firestore index missing for dictionary listener; emitting empty list until index is created."
        )
        callback([])
        return
      }
      console.error("Dictionary snapshot listener error:", error)
    }
  )
}
