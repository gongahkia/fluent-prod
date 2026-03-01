import { mapFirestoreError } from "./errorMapper"
import { sanitizeFirestoreId } from "./idUtils"
import {
  blockingCol,
  doc,
  fbLimit,
  firestore,
  followersCol,
  followingCol,
  getDoc,
  getDocs,
  nowIso,
  query,
  userDoc,
  withFirestoreReadRetry,
  writeBatch,
} from "./shared"

export const isFollowing = async (userId, targetUserId) => {
  try {
    const safeTargetUserId = sanitizeFirestoreId(targetUserId, "user")
    const snap = await withFirestoreReadRetry("get:isFollowing", () =>
      getDoc(doc(followingCol(userId), safeTargetUserId))
    )
    return { success: true, isFollowing: snap.exists() }
  } catch (error) {
    console.error("Error checking follow status:", error)
    const mapped = mapFirestoreError(error)
    return {
      success: false,
      error: mapped.message,
      errorCode: mapped.errorCode,
      isFollowing: false,
    }
  }
}

export const followUser = async (userId, targetUserId) => {
  try {
    const safeUserId = sanitizeFirestoreId(userId, "user")
    const safeTargetUserId = sanitizeFirestoreId(targetUserId, "user")

    if (safeUserId === safeTargetUserId)
      return { success: false, error: "Cannot follow yourself" }

    const batch = writeBatch(firestore)
    batch.set(
      doc(followingCol(safeUserId), safeTargetUserId),
      {
        userId: safeUserId,
        targetUserId: safeTargetUserId,
        followedAt: nowIso(),
      },
      { merge: true }
    )
    batch.set(
      doc(followersCol(safeTargetUserId), safeUserId),
      {
        userId: safeTargetUserId,
        followerId: safeUserId,
        followedAt: nowIso(),
      },
      { merge: true }
    )
    await batch.commit()

    return { success: true }
  } catch (error) {
    console.error("Error following user:", error)
    const mapped = mapFirestoreError(error)
    return {
      success: false,
      error: mapped.message,
      errorCode: mapped.errorCode,
    }
  }
}

export const unfollowUser = async (userId, targetUserId) => {
  try {
    const safeUserId = sanitizeFirestoreId(userId, "user")
    const safeTargetUserId = sanitizeFirestoreId(targetUserId, "user")
    const batch = writeBatch(firestore)
    batch.delete(doc(followingCol(safeUserId), safeTargetUserId))
    batch.delete(doc(followersCol(safeTargetUserId), safeUserId))
    await batch.commit()

    return { success: true }
  } catch (error) {
    console.error("Error unfollowing user:", error)
    const mapped = mapFirestoreError(error)
    return {
      success: false,
      error: mapped.message,
      errorCode: mapped.errorCode,
    }
  }
}

export const getUserFollowers = async (userId) => {
  try {
    const snap = await withFirestoreReadRetry("get:followers", () =>
      getDocs(query(followersCol(userId), fbLimit(200)))
    )
    const followerIds = snap.docs.map((d) => d.id)

    const profiles = await Promise.all(
      followerIds.map(async (fid) => {
        const p = await withFirestoreReadRetry("get:followerProfile", () =>
          getDoc(userDoc(fid))
        )
        return p.exists() ? p.data() : { userId: fid }
      })
    )

    return { success: true, data: profiles }
  } catch (error) {
    console.error("Error getting followers:", error)
    const mapped = mapFirestoreError(error)
    return {
      success: false,
      error: mapped.message,
      errorCode: mapped.errorCode,
    }
  }
}

export const getUserFollowing = async (userId) => {
  try {
    const snap = await withFirestoreReadRetry("get:following", () =>
      getDocs(query(followingCol(userId), fbLimit(200)))
    )
    const targetIds = snap.docs.map((d) => d.id)

    const profiles = await Promise.all(
      targetIds.map(async (tid) => {
        const p = await withFirestoreReadRetry("get:followingProfile", () =>
          getDoc(userDoc(tid))
        )
        return p.exists() ? p.data() : { userId: tid }
      })
    )

    return { success: true, data: profiles }
  } catch (error) {
    console.error("Error getting following:", error)
    const mapped = mapFirestoreError(error)
    return {
      success: false,
      error: mapped.message,
      errorCode: mapped.errorCode,
    }
  }
}

export const removeFollower = async (userId, followerId) => {
  try {
    const safeUserId = sanitizeFirestoreId(userId, "user")
    const safeFollowerId = sanitizeFirestoreId(followerId, "user")
    const batch = writeBatch(firestore)
    batch.delete(doc(followersCol(safeUserId), safeFollowerId))
    batch.delete(doc(followingCol(safeFollowerId), safeUserId))
    await batch.commit()

    return { success: true }
  } catch (error) {
    console.error("Error removing follower:", error)
    const mapped = mapFirestoreError(error)
    return {
      success: false,
      error: mapped.message,
      errorCode: mapped.errorCode,
    }
  }
}

export const blockUser = async (userId, targetUserId) => {
  try {
    const safeUserId = sanitizeFirestoreId(userId, "user")
    const safeTargetUserId = sanitizeFirestoreId(targetUserId, "user")
    const batch = writeBatch(firestore)
    batch.set(
      doc(blockingCol(safeUserId), safeTargetUserId),
      {
        userId: safeUserId,
        targetUserId: safeTargetUserId,
        blockedAt: nowIso(),
      },
      { merge: true }
    )

    batch.delete(doc(followingCol(safeUserId), safeTargetUserId))
    batch.delete(doc(followersCol(safeUserId), safeTargetUserId))
    batch.delete(doc(followingCol(safeTargetUserId), safeUserId))
    batch.delete(doc(followersCol(safeTargetUserId), safeUserId))

    await batch.commit()

    return { success: true }
  } catch (error) {
    console.error("Error blocking user:", error)
    const mapped = mapFirestoreError(error)
    return {
      success: false,
      error: mapped.message,
      errorCode: mapped.errorCode,
    }
  }
}
