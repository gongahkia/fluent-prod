import {
  arrayRemove,
  arrayUnion,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  limit as fbLimit,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore"
import { firestore } from "@/lib/firebase"
import { sanitizeFirestoreId } from "./idUtils"
import { withFirestoreWriteRetry } from "./retry"

export {
  arrayRemove,
  arrayUnion,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  fbLimit,
  firestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
}

export function nowIso() {
  return new Date().toISOString()
}

export async function withFirestoreTiming(operation, fn) {
  const startedAt = Date.now()
  try {
    return await fn()
  } finally {
    const durationMs = Date.now() - startedAt
    console.log("[FirestoreTiming]", { operation, durationMs })
  }
}

export async function withFirestoreWrite(operation, fn) {
  return withFirestoreTiming(operation, () =>
    withFirestoreWriteRetry(operation, fn)
  )
}

function isTransientReadError(error) {
  const code = String(error?.code || "")
  return (
    code === "aborted" ||
    code === "deadline-exceeded" ||
    code === "internal" ||
    code === "resource-exhausted" ||
    code === "unavailable"
  )
}

export async function withFirestoreReadRetry(operation, fn, maxRetries = 2) {
  let attempt = 0
  while (attempt <= maxRetries) {
    try {
      return await fn()
    } catch (error) {
      if (!isTransientReadError(error) || attempt >= maxRetries) throw error
      const delayMs = 150 * 2 ** attempt
      console.warn("[FirestoreRetry]", {
        operation,
        attempt: attempt + 1,
        delayMs,
        code: error?.code,
      })
      await new Promise((resolve) => setTimeout(resolve, delayMs))
      attempt += 1
    }
  }
}

export function stripUndefinedDeep(value) {
  if (value === undefined) return undefined
  if (value === null) return null

  if (Array.isArray(value)) {
    return value
      .map((v) => stripUndefinedDeep(v))
      .filter((v) => v !== undefined)
  }

  if (typeof value === "object") {
    const out = {}
    for (const [key, v] of Object.entries(value)) {
      const cleaned = stripUndefinedDeep(v)
      if (cleaned !== undefined) out[key] = cleaned
    }
    return out
  }

  return value
}

export function userDoc(userId) {
  return doc(firestore, "users", sanitizeFirestoreId(userId, "user"))
}

export function credentialsDoc(userId) {
  return doc(
    firestore,
    "users",
    sanitizeFirestoreId(userId, "user"),
    "private",
    "credentials"
  )
}

export function dictionaryCol(userId) {
  return collection(
    firestore,
    "users",
    sanitizeFirestoreId(userId, "user"),
    "dictionaryWords"
  )
}

export function savedPostsCol(userId) {
  return collection(
    firestore,
    "users",
    sanitizeFirestoreId(userId, "user"),
    "savedPosts"
  )
}

export function collectionsCol(userId) {
  return collection(
    firestore,
    "users",
    sanitizeFirestoreId(userId, "user"),
    "collections"
  )
}

export function flashcardsCol(userId) {
  return collection(
    firestore,
    "users",
    sanitizeFirestoreId(userId, "user"),
    "flashcards"
  )
}

export function followingCol(userId) {
  return collection(
    firestore,
    "users",
    sanitizeFirestoreId(userId, "user"),
    "following"
  )
}

export function followersCol(userId) {
  return collection(
    firestore,
    "users",
    sanitizeFirestoreId(userId, "user"),
    "followers"
  )
}

export function blockingCol(userId) {
  return collection(
    firestore,
    "users",
    sanitizeFirestoreId(userId, "user"),
    "blocking"
  )
}

export async function deleteAllDocsInCollection(colRef) {
  const snap = await getDocs(query(colRef, fbLimit(500)))
  if (snap.empty) return

  const batch = writeBatch(firestore)
  snap.docs.forEach((d) => {
    batch.delete(d.ref)
  })
  await batch.commit()

  if (snap.size === 500) {
    await deleteAllDocsInCollection(colRef)
  }
}
