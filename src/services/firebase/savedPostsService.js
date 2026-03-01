import { createFirestoreId, sanitizeFirestoreId } from "./idUtils"
import {
  deleteDoc,
  doc,
  getDocs,
  nowIso,
  orderBy,
  query,
  savedPostsCol,
  serverTimestamp,
  setDoc,
  stripUndefinedDeep,
  withFirestoreReadRetry,
  withFirestoreTiming,
} from "./shared"

export const getSavedPosts = async (userId) => {
  try {
    const q = query(savedPostsCol(userId), orderBy("savedAt", "desc"))
    const snap = await withFirestoreReadRetry("get:savedPosts", () =>
      getDocs(q)
    )
    const posts = snap.docs.map((d) => d.data())
    return { success: true, data: posts }
  } catch (error) {
    if (
      error?.code === "failed-precondition" &&
      String(error?.message || "")
        .toLowerCase()
        .includes("requires an index")
    ) {
      try {
        const fallbackSnap = await withFirestoreReadRetry(
          "get:savedPosts:fallback",
          () => getDocs(query(savedPostsCol(userId)))
        )
        const posts = fallbackSnap.docs
          .map((d) => d.data())
          .sort((a, b) =>
            String(b?.savedAt || "").localeCompare(String(a?.savedAt || ""))
          )
        return { success: true, data: posts, warning: "missing-index-fallback" }
      } catch {
        return { success: true, data: [], warning: "missing-index" }
      }
    }
    console.error("Error getting saved posts:", error)
    return { success: false, error: error.message }
  }
}

export const savePost = async (userId, postData) => {
  try {
    const uuid = createFirestoreId()
    const postHashRaw =
      postData?.postHash || postData?.postId || postData?.id || uuid
    const postIdRaw = postData?.postId || postData?.id || postHashRaw

    const postHash = sanitizeFirestoreId(postHashRaw, createFirestoreId())
    const postId = sanitizeFirestoreId(postIdRaw, postHash)

    const payload = stripUndefinedDeep({
      ...postData,
      id: postId,
      postId,
      postHash,
      userId: sanitizeFirestoreId(userId, "user"),
      savedAt: postData?.savedAt || nowIso(),
      savedAtTs: serverTimestamp(),
      updatedAt: nowIso(),
      updatedAtTs: serverTimestamp(),
    })

    await withFirestoreTiming("set:savedPost", () =>
      setDoc(doc(savedPostsCol(userId), postId), payload, { merge: true })
    )
    return { success: true, data: payload }
  } catch (error) {
    console.error("Error saving post:", error)
    return { success: false, error: error.message }
  }
}

export const removeSavedPost = async (userId, postId) => {
  try {
    const safePostId = sanitizeFirestoreId(postId, "post")
    await withFirestoreTiming("delete:savedPost", () =>
      deleteDoc(doc(savedPostsCol(userId), safePostId))
    )
    return { success: true }
  } catch (error) {
    console.error("Error removing saved post:", error)
    return { success: false, error: error.message }
  }
}
