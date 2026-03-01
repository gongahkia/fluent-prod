import { createFirestoreId, sanitizeFirestoreId } from "./idUtils"
import { collection, doc, firestore, nowIso, serverTimestamp } from "./shared"

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
