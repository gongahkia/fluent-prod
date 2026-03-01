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
    const snap = await withFirestoreReadRetry("get:isFollowing", () =>
      getDoc(doc(followingCol(userId), targetUserId))
    )
    return { success: true, isFollowing: snap.exists() }
  } catch (error) {
    console.error("Error checking follow status:", error)
    return { success: false, error: error.message, isFollowing: false }
  }
}

export const followUser = async (userId, targetUserId) => {
  try {
    if (userId === targetUserId)
      return { success: false, error: "Cannot follow yourself" }

    const batch = writeBatch(firestore)
    batch.set(
      doc(followingCol(userId), targetUserId),
      { userId, targetUserId, followedAt: nowIso() },
      { merge: true }
    )
    batch.set(
      doc(followersCol(targetUserId), userId),
      { userId: targetUserId, followerId: userId, followedAt: nowIso() },
      { merge: true }
    )
    await batch.commit()

    return { success: true }
  } catch (error) {
    console.error("Error following user:", error)
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
    console.error("Error unfollowing user:", error)
    return { success: false, error: error.message }
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
    return { success: false, error: error.message }
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
    console.error("Error removing follower:", error)
    return { success: false, error: error.message }
  }
}

export const blockUser = async (userId, targetUserId) => {
  try {
    const batch = writeBatch(firestore)
    batch.set(
      doc(blockingCol(userId), targetUserId),
      { userId, targetUserId, blockedAt: nowIso() },
      { merge: true }
    )

    batch.delete(doc(followingCol(userId), targetUserId))
    batch.delete(doc(followersCol(userId), targetUserId))
    batch.delete(doc(followingCol(targetUserId), userId))
    batch.delete(doc(followersCol(targetUserId), userId))

    await batch.commit()

    return { success: true }
  } catch (error) {
    console.error("Error blocking user:", error)
    return { success: false, error: error.message }
  }
}
