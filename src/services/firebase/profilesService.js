import { sanitizeFirestoreId } from "./idUtils"
import {
  credentialsDoc,
  getDoc,
  nowIso,
  serverTimestamp,
  setDoc,
  userDoc,
  withFirestoreReadRetry,
  withFirestoreTiming,
} from "./shared"

export const createUserProfile = async (userId, profileData) => {
  try {
    const safeUserId = sanitizeFirestoreId(userId, "user")
    const payload = {
      ...profileData,
      userId: safeUserId,
      createdAt: profileData?.createdAt || nowIso(),
      updatedAt: nowIso(),
      createdAtTs: serverTimestamp(),
      updatedAtTs: serverTimestamp(),
      nameLower: (profileData?.name || "").toLowerCase(),
      emailLower: (profileData?.email || "").toLowerCase(),
    }

    await withFirestoreTiming("set:userProfile", () =>
      setDoc(userDoc(safeUserId), payload, { merge: true })
    )
    return { success: true, data: payload }
  } catch (error) {
    console.error("Error creating user profile:", error)
    return { success: false, error: error.message }
  }
}

export const getUserProfile = async (userId) => {
  try {
    const snap = await withFirestoreTiming("get:userProfile", () =>
      withFirestoreReadRetry("get:userProfile", () => getDoc(userDoc(userId)))
    )
    if (!snap.exists())
      return { success: false, error: "User profile not found" }
    return { success: true, data: snap.data() }
  } catch (error) {
    console.error("Error getting user profile:", error)
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

    if (typeof updates?.name === "string")
      patch.nameLower = updates.name.toLowerCase()
    if (typeof updates?.email === "string")
      patch.emailLower = updates.email.toLowerCase()

    await withFirestoreTiming("set:userProfilePatch", () =>
      setDoc(userDoc(userId), patch, { merge: true })
    )
    return { success: true }
  } catch (error) {
    console.error("Error updating user profile:", error)
    return { success: false, error: error.message }
  }
}

export const updateUserCredentials = async (userId, encryptedData) => {
  try {
    await withFirestoreTiming("set:userCredentials", () =>
      setDoc(
        credentialsDoc(userId),
        {
          encryptedData,
          updatedAt: nowIso(),
          updatedAtTs: serverTimestamp(),
        },
        { merge: true }
      )
    )
    return { success: true }
  } catch (error) {
    console.error("Error updating credentials:", error)
    return { success: false, error: error.message }
  }
}

export const getUserCredentials = async (userId) => {
  try {
    const snap = await withFirestoreTiming("get:userCredentials", () =>
      withFirestoreReadRetry("get:userCredentials", () =>
        getDoc(credentialsDoc(userId))
      )
    )
    if (!snap.exists()) return { success: true, data: null }
    return { success: true, data: snap.data()?.encryptedData ?? null }
  } catch (error) {
    console.error("Error getting credentials:", error)
    return { success: false, error: error.message }
  }
}
