function compareCreatedAtDesc(a, b) {
  return String(b?.createdAt || "").localeCompare(String(a?.createdAt || ""))
}

function normalizeComment(comment = {}, index = 0) {
  const userLabel = String(
    comment?.user || comment?.username || comment?.displayName || "User"
  )

  return {
    ...comment,
    id: String(comment?.id || `comment-${index}`),
    user: userLabel,
    likes: Number(comment?.likesCount ?? comment?.likes ?? 0),
    avatar: comment?.avatar || userLabel.charAt(0).toUpperCase() || "U",
    profilePictureUrl: comment?.profilePictureUrl || "",
    parentCommentId: comment?.parentCommentId
      ? String(comment.parentCommentId)
      : null,
    replies: [],
  }
}

function sortTreeNewestFirst(nodes) {
  nodes.sort(compareCreatedAtDesc)
  for (const node of nodes) {
    if (Array.isArray(node.replies) && node.replies.length > 0) {
      sortTreeNewestFirst(node.replies)
    }
  }
}

export function buildPersistedCommentTree(rawComments = []) {
  const normalized = (rawComments || [])
    .map((comment, index) => normalizeComment(comment, index))
    .sort(compareCreatedAtDesc)

  const byId = new Map()
  normalized.forEach((comment) => {
    byId.set(comment.id, comment)
  })

  const roots = []
  normalized.forEach((comment) => {
    if (comment.parentCommentId && byId.has(comment.parentCommentId)) {
      byId.get(comment.parentCommentId).replies.push(comment)
    } else {
      roots.push(comment)
    }
  })

  sortTreeNewestFirst(roots)
  return roots
}
