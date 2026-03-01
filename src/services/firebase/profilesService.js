import { mapFirestoreError } from "./errorMapper"
import { sanitizeFirestoreId } from "./idUtils"
import {
  validateProfilePatchPayload,
  validateProfileWritePayload,
} from "./schemas"
import {
  credentialsDoc,
  getDoc,
  nowIso,
  serverTimestamp,
  setDoc,
  userDoc,
  withFirestoreReadRetry,
  withFirestoreTiming,
  withFirestoreWrite,
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
    const validatedPayload = validateProfileWritePayload(payload)

    await withFirestoreWrite("set:userProfile", () =>
      setDoc(userDoc(safeUserId), validatedPayload, { merge: true })
    )
    return { success: true, data: validatedPayload }
  } catch (error) {
    console.error("Error creating user profile:", error)
    const mapped = mapFirestoreError(error)
    return {
      success: false,
      error: mapped.message,
      errorCode: mapped.errorCode,
    }
  }
}

export const getUserProfile = async (userId) => {
  try {
    const snap = await withFirestoreTiming("get:userProfile", () =>
      withFirestoreReadRetry("get:userProfile", () => getDoc(userDoc(userId)))
    )
    if (!snap.exists())
      return {
        success: false,
        error: "User profile not found",
        errorCode: "FIRESTORE_NOT_FOUND",
      }
    return { success: true, data: snap.data() }
  } catch (error) {
    console.error("Error getting user profile:", error)
    const mapped = mapFirestoreError(error)
    return {
      success: false,
      error: mapped.message,
      errorCode: mapped.errorCode,
    }
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
    const validatedPatch = validateProfilePatchPayload(patch)

    await withFirestoreWrite("set:userProfilePatch", () =>
      setDoc(userDoc(userId), validatedPatch, { merge: true })
    )
    return { success: true }
  } catch (error) {
    console.error("Error updating user profile:", error)
    const mapped = mapFirestoreError(error)
    return {
      success: false,
      error: mapped.message,
      errorCode: mapped.errorCode,
    }
  }
}

export const updateUserCredentials = async (userId, encryptedData) => {
  try {
    await withFirestoreWrite("set:userCredentials", () =>
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
    const mapped = mapFirestoreError(error)
    return {
      success: false,
      error: mapped.message,
      errorCode: mapped.errorCode,
    }
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
    const mapped = mapFirestoreError(error)
    return {
      success: false,
      error: mapped.message,
      errorCode: mapped.errorCode,
    }
  }
}
