import { getDownloadURL, ref, uploadString } from "firebase/storage"
import { firebaseStorage } from "@/lib/firebase"
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
const COMMENT_MEDIA_COLLECTION = "commentMedia"
const DEFAULT_COMMENTS_PAGE_SIZE = 20
const MAX_COMMENTS_PAGE_SIZE = 50
const COMMENT_MAX_CONTENT_CHARS = 1200
const COMMENT_MAX_MEDIA_BYTES = 5 * 1024 * 1024
const COMMENT_ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
])

function normalizeMediaType(mediaType = "") {
  const normalized = String(mediaType || "")
    .toLowerCase()
    .trim()
  if (normalized === "image/jpg") return "image/jpeg"
  return normalized
}

function inferDataUrlMediaType(dataUrl = "") {
  if (!String(dataUrl).startsWith("data:")) return ""
  const metadata = String(dataUrl).slice(5).split(",")[0] || ""
  return normalizeMediaType(metadata.split(";")[0] || "")
}

function estimateDataUrlBytes(dataUrl = "") {
  const raw = String(dataUrl).split(",")[1] || ""
  if (!raw) return 0
  const sanitized = raw.replace(/\s/g, "")
  const paddingMatches = sanitized.match(/=+$/)
  const padding = paddingMatches ? paddingMatches[0].length : 0
  return Math.max(0, Math.floor((sanitized.length * 3) / 4 - padding))
}

function validateCommentWriteInput({ content, media } = {}) {
  const safeContent = String(content || "").trim()
  if (!safeContent) {
    return {
      success: false,
      error: "content is required",
      errorCode: "COMMENTS_INVALID_INPUT",
    }
  }

  if (safeContent.length > COMMENT_MAX_CONTENT_CHARS) {
    return {
      success: false,
      error: `content exceeds ${COMMENT_MAX_CONTENT_CHARS} characters`,
      errorCode: "COMMENTS_CONTENT_TOO_LONG",
    }
  }

  if (!media) {
    return {
      success: true,
      content: safeContent,
      media: null,
    }
  }

  if (typeof media !== "object") {
    return {
      success: false,
      error: "media must be an object",
      errorCode: "COMMENTS_MEDIA_INVALID",
    }
  }

  const hasData = typeof media?.data === "string" && media.data.trim()
  const hasUrl = typeof media?.url === "string" && media.url.trim()
  if (!hasData && !hasUrl) {
    return {
      success: false,
      error: "media requires data or url",
      errorCode: "COMMENTS_MEDIA_INVALID",
    }
  }

  const inferredType = hasData ? inferDataUrlMediaType(media.data) : ""
  const normalizedType = normalizeMediaType(media?.type || inferredType)
  if (!COMMENT_ALLOWED_MEDIA_TYPES.has(normalizedType)) {
    return {
      success: false,
      error: "media type is not supported",
      errorCode: "COMMENTS_MEDIA_INVALID",
    }
  }

  if (hasData) {
    if (!String(media.data).startsWith("data:")) {
      return {
        success: false,
        error: "media data must be a data URL",
        errorCode: "COMMENTS_MEDIA_INVALID",
      }
    }
    const sizeBytes = estimateDataUrlBytes(media.data)
    if (sizeBytes > COMMENT_MAX_MEDIA_BYTES) {
      return {
        success: false,
        error: `media exceeds ${COMMENT_MAX_MEDIA_BYTES} bytes`,
        errorCode: "COMMENTS_MEDIA_TOO_LARGE",
      }
    }
  }

  if (hasUrl && !/^https?:\/\//.test(String(media.url).trim())) {
    return {
      success: false,
      error: "media url must be http(s)",
      errorCode: "COMMENTS_MEDIA_INVALID",
    }
  }

  return {
    success: true,
    content: safeContent,
    media: {
      type: normalizedType,
      name: media?.name ? String(media.name) : null,
      data: hasData ? String(media.data) : null,
      url: hasUrl ? String(media.url).trim() : null,
    },
  }
}

function getStorageExt(mimeType = "") {
  const normalized = normalizeMediaType(mimeType)
  if (normalized.includes("png")) return "png"
  if (normalized.includes("gif")) return "gif"
  if (normalized.includes("webp")) return "webp"
  return "jpg"
}

function normalizeStoredMedia(media, downloadUrl = "") {
  if (!media || !downloadUrl) return null
  return {
    type: String(media?.type || "image/jpeg"),
    name: media?.name ? String(media.name) : null,
    url: downloadUrl,
  }
}

async function uploadCommentMedia({ media, postHash, userId, commentId }) {
  const mediaData = media?.data
  if (!mediaData || typeof mediaData !== "string") return null
  if (!mediaData.startsWith("data:")) return null

  const safePostHash = sanitizeFirestoreId(postHash, "post")
  const safeUserId = sanitizeFirestoreId(userId, "user")
  const safeCommentId = sanitizeFirestoreId(commentId, createFirestoreId())
  const ext = getStorageExt(media?.type)
  const objectPath = `${COMMENT_MEDIA_COLLECTION}/${safePostHash}/${safeUserId}/${safeCommentId}.${ext}`
  const mediaRef = ref(firebaseStorage, objectPath)

  await uploadString(mediaRef, mediaData, "data_url")
  const downloadUrl = await getDownloadURL(mediaRef)
  return normalizeStoredMedia(media, downloadUrl)
}

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
  if (!postHash || !userId || !String(content || "").trim()) {
    return {
      success: false,
      error: "postHash, userId, and content are required",
      errorCode: "COMMENTS_INVALID_INPUT",
    }
  }
  const validation = validateCommentWriteInput({ content, media })
  if (!validation.success) return validation

  try {
    const safeCommentId = buildCommentId(id)
    const persistedMedia = validation.media?.url
      ? normalizeStoredMedia(validation.media, validation.media.url)
      : await uploadCommentMedia({
          media: validation.media,
          postHash,
          userId,
          commentId: safeCommentId,
        })
    const payload = buildCommentPayload({
      id: safeCommentId,
      postHash,
      userId,
      content: validation.content,
      media: persistedMedia,
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
  if (
    !postHash ||
    !userId ||
    !parentCommentId ||
    !String(content || "").trim()
  ) {
    return {
      success: false,
      error: "postHash, userId, parentCommentId, and content are required",
      errorCode: "COMMENTS_INVALID_INPUT",
    }
  }
  const validation = validateCommentWriteInput({ content, media })
  if (!validation.success) return validation

  try {
    const safeCommentId = buildCommentId(id)
    const persistedMedia = validation.media?.url
      ? normalizeStoredMedia(validation.media, validation.media.url)
      : await uploadCommentMedia({
          media: validation.media,
          postHash,
          userId,
          commentId: safeCommentId,
        })
    const payload = buildCommentPayload({
      id: safeCommentId,
      postHash,
      userId,
      parentCommentId,
      content: validation.content,
      media: persistedMedia,
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
