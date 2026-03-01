import { mapFirestoreError } from "./errorMapper"
import { createFirestoreId, sanitizeFirestoreId } from "./idUtils"
import {
  collection,
  doc,
  firestore,
  nowIso,
  serverTimestamp,
  setDoc,
  withFirestoreWrite,
} from "./shared"

const COMMENTS_COLLECTION = "comments"
const COMMENT_REACTIONS_SUBCOLLECTION = "reactions"

export function commentsCol() {
  return collection(firestore, COMMENTS_COLLECTION)
}

export function commentDoc(commentId) {
  return doc(commentsCol(), sanitizeFirestoreId(commentId, "comment"))
}

export function commentReactionsCol(commentId) {
  return collection(commentDoc(commentId), COMMENT_REACTIONS_SUBCOLLECTION)
}

export function commentReactionDoc(commentId, userId) {
  return doc(
    commentReactionsCol(commentId),
    sanitizeFirestoreId(userId, "user")
  )
}

export function buildCommentId(commentId) {
  return sanitizeFirestoreId(commentId, createFirestoreId())
}

export function buildCommentPayload({
  id,
  postHash,
  userId,
  content,
  parentCommentId = null,
  media = null,
} = {}) {
  const safeId = buildCommentId(id)
  const safePostHash = sanitizeFirestoreId(postHash, "post")
  const safeUserId = sanitizeFirestoreId(userId, "user")
  const safeParentCommentId = parentCommentId
    ? sanitizeFirestoreId(parentCommentId, "comment")
    : null

  return {
    id: safeId,
    postHash: safePostHash,
    userId: safeUserId,
    content: String(content || "").trim(),
    parentCommentId: safeParentCommentId,
    media: media || null,
    likesCount: 0,
    repliesCount: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    createdAtTs: serverTimestamp(),
    updatedAtTs: serverTimestamp(),
  }
}

export async function createComment({
  id = null,
  postHash,
  userId,
  content,
  media = null,
} = {}) {
  const safeContent = String(content || "").trim()
  if (!postHash || !userId || !safeContent) {
    return {
      success: false,
      error: "postHash, userId, and content are required",
      errorCode: "COMMENTS_INVALID_INPUT",
    }
  }

  try {
    const payload = buildCommentPayload({
      id,
      postHash,
      userId,
      content: safeContent,
      media,
    })

    await withFirestoreWrite("set:comment", () =>
      setDoc(commentDoc(payload.id), payload, { merge: true })
    )
    return { success: true, data: payload }
  } catch (error) {
    console.error("Error creating comment:", error)
    const mapped = mapFirestoreError(error)
    return {
      success: false,
      error: mapped.message,
      errorCode: mapped.errorCode,
    }
  }
}
