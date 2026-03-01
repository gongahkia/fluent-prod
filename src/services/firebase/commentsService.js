import { mapFirestoreError } from "./errorMapper"
import { createFirestoreId, sanitizeFirestoreId } from "./idUtils"
import {
  collection,
  doc,
  fbLimit,
  firestore,
  getDoc,
  getDocs,
  nowIso,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  withFirestoreReadRetry,
  withFirestoreWrite,
  writeBatch,
} from "./shared"

const COMMENTS_COLLECTION = "comments"
const COMMENT_REACTIONS_SUBCOLLECTION = "reactions"
const DEFAULT_COMMENTS_PAGE_SIZE = 20
const MAX_COMMENTS_PAGE_SIZE = 50

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

export async function createReply({
  id = null,
  postHash,
  userId,
  parentCommentId,
  content,
  media = null,
} = {}) {
  const safeContent = String(content || "").trim()
  if (!postHash || !userId || !parentCommentId || !safeContent) {
    return {
      success: false,
      error: "postHash, userId, parentCommentId, and content are required",
      errorCode: "COMMENTS_INVALID_INPUT",
    }
  }

  try {
    const payload = buildCommentPayload({
      id,
      postHash,
      userId,
      parentCommentId,
      content: safeContent,
      media,
    })

    await withFirestoreWrite("set:commentReply", () =>
      setDoc(commentDoc(payload.id), payload, { merge: true })
    )
    return { success: true, data: payload }
  } catch (error) {
    console.error("Error creating comment reply:", error)
    const mapped = mapFirestoreError(error)
    return {
      success: false,
      error: mapped.message,
      errorCode: mapped.errorCode,
    }
  }
}

export async function toggleCommentLike({ commentId, userId } = {}) {
  if (!commentId || !userId) {
    return {
      success: false,
      error: "commentId and userId are required",
      errorCode: "COMMENTS_INVALID_INPUT",
    }
  }

  const safeCommentId = sanitizeFirestoreId(commentId, "comment")
  const safeUserId = sanitizeFirestoreId(userId, "user")
  const reactionRef = commentReactionDoc(safeCommentId, safeUserId)
  const parentCommentRef = commentDoc(safeCommentId)

  try {
    const [reactionSnap, commentSnap] = await Promise.all([
      withFirestoreReadRetry("get:commentReaction", () => getDoc(reactionRef)),
      withFirestoreReadRetry("get:comment", () => getDoc(parentCommentRef)),
    ])

    if (!commentSnap.exists()) {
      return {
        success: false,
        error: "Comment not found",
        errorCode: "COMMENTS_NOT_FOUND",
      }
    }

    const alreadyLiked = reactionSnap.exists()
    const currentLikes = Number(commentSnap.data()?.likesCount || 0)
    const nextLikes = alreadyLiked
      ? Math.max(0, currentLikes - 1)
      : currentLikes + 1
    const timestamp = nowIso()

    const batch = writeBatch(firestore)
    if (alreadyLiked) {
      batch.delete(reactionRef)
    } else {
      batch.set(
        reactionRef,
        {
          commentId: safeCommentId,
          userId: safeUserId,
          createdAt: timestamp,
          createdAtTs: serverTimestamp(),
        },
        { merge: true }
      )
    }
    batch.set(
      parentCommentRef,
      {
        likesCount: nextLikes,
        updatedAt: timestamp,
        updatedAtTs: serverTimestamp(),
      },
      { merge: true }
    )

    await withFirestoreWrite("toggle:commentLike", () => batch.commit())

    return {
      success: true,
      data: {
        commentId: safeCommentId,
        userId: safeUserId,
        liked: !alreadyLiked,
        likesCount: nextLikes,
      },
    }
  } catch (error) {
    console.error("Error toggling comment like:", error)
    const mapped = mapFirestoreError(error)
    return {
      success: false,
      error: mapped.message,
      errorCode: mapped.errorCode,
    }
  }
}

function normalizePageSize(pageSize) {
  const parsed = Number(pageSize)
  if (!Number.isFinite(parsed)) return DEFAULT_COMMENTS_PAGE_SIZE
  return Math.min(MAX_COMMENTS_PAGE_SIZE, Math.max(1, Math.trunc(parsed)))
}

function normalizeCursor(cursor) {
  if (typeof cursor === "string" && cursor.trim()) return cursor.trim()
  if (
    cursor &&
    typeof cursor === "object" &&
    typeof cursor.createdAt === "string" &&
    cursor.createdAt.trim()
  ) {
    return cursor.createdAt.trim()
  }
  return null
}

function paginateComments(comments, pageSize) {
  const hasMore = comments.length > pageSize
  const page = hasMore ? comments.slice(0, pageSize) : comments
  const lastComment = page[page.length - 1]
  const nextCursor = hasMore ? String(lastComment?.createdAt || "") : ""
  return {
    data: page,
    hasMore,
    nextCursor: nextCursor || null,
  }
}

export async function listCommentsByPost({
  postHash,
  cursor = null,
  pageSize = DEFAULT_COMMENTS_PAGE_SIZE,
} = {}) {
  if (!postHash) {
    return {
      success: false,
      error: "postHash is required",
      errorCode: "COMMENTS_INVALID_INPUT",
    }
  }

  const safePostHash = sanitizeFirestoreId(postHash, "post")
  const safeCursor = normalizeCursor(cursor)
  const safePageSize = normalizePageSize(pageSize)

  try {
    const constraints = [where("postHash", "==", safePostHash)]
    if (safeCursor) {
      constraints.push(where("createdAt", "<", safeCursor))
    }
    constraints.push(orderBy("createdAt", "desc"), fbLimit(safePageSize + 1))

    const commentsSnap = await withFirestoreReadRetry(
      "get:commentsByPost",
      () => getDocs(query(commentsCol(), ...constraints))
    )
    const comments = commentsSnap.docs.map((d) => d.data())
    const paginated = paginateComments(comments, safePageSize)
    return { success: true, ...paginated }
  } catch (error) {
    if (
      error?.code === "failed-precondition" &&
      String(error?.message || "")
        .toLowerCase()
        .includes("requires an index")
    ) {
      try {
        const fallbackSnap = await withFirestoreReadRetry(
          "get:commentsByPost:fallback",
          () =>
            getDocs(query(commentsCol(), where("postHash", "==", safePostHash)))
        )

        const sortedComments = fallbackSnap.docs
          .map((d) => d.data())
          .sort((a, b) =>
            String(b?.createdAt || "").localeCompare(String(a?.createdAt || ""))
          )
        const filteredComments = safeCursor
          ? sortedComments.filter(
              (comment) => String(comment?.createdAt || "") < safeCursor
            )
          : sortedComments
        const paginated = paginateComments(filteredComments, safePageSize)
        return {
          success: true,
          ...paginated,
          warning: "missing-index-fallback",
        }
      } catch {
        return {
          success: true,
          data: [],
          hasMore: false,
          nextCursor: null,
          warning: "missing-index",
        }
      }
    }

    console.error("Error listing comments by post:", error)
    const mapped = mapFirestoreError(error)
    return {
      success: false,
      error: mapped.message,
      errorCode: mapped.errorCode,
    }
  }
}

export function onCommentsChanged(postHash, callback) {
  if (!postHash || typeof callback !== "function") {
    return () => undefined
  }

  const safePostHash = sanitizeFirestoreId(postHash, "post")
  const q = query(
    commentsCol(),
    where("postHash", "==", safePostHash),
    orderBy("createdAt", "desc")
  )

  return onSnapshot(
    q,
    (snap) => {
      const comments = snap.docs.map((d) => d.data())
      callback(comments)
    },
    (error) => {
      if (
        error?.code === "failed-precondition" &&
        String(error?.message || "")
          .toLowerCase()
          .includes("requires an index")
      ) {
        console.warn(
          "Firestore index missing for comments listener; emitting empty list until index is created."
        )
        callback([])
        return
      }
      console.error("Comments snapshot listener error:", error)
    }
  )
}
