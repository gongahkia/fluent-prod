import assert from "node:assert/strict"
import test from "node:test"
import { buildPersistedCommentTree } from "../firebase/commentsTree.js"

test("buildPersistedCommentTree nests persisted replies under parents", () => {
  const flatComments = [
    {
      id: "reply-1",
      parentCommentId: "root-1",
      content: "reply",
      createdAt: "2026-03-01T00:01:00.000Z",
    },
    {
      id: "root-1",
      content: "root",
      createdAt: "2026-03-01T00:00:00.000Z",
    },
  ]

  const tree = buildPersistedCommentTree(flatComments)
  assert.equal(tree.length, 1)
  assert.equal(tree[0].id, "root-1")
  assert.equal(tree[0].replies.length, 1)
  assert.equal(tree[0].replies[0].id, "reply-1")
})

test("buildPersistedCommentTree keeps newest-first order for roots and replies", () => {
  const flatComments = [
    {
      id: "root-old",
      content: "old root",
      createdAt: "2026-03-01T00:00:00.000Z",
    },
    {
      id: "root-new",
      content: "new root",
      createdAt: "2026-03-01T00:10:00.000Z",
    },
    {
      id: "reply-old",
      parentCommentId: "root-new",
      content: "old reply",
      createdAt: "2026-03-01T00:11:00.000Z",
    },
    {
      id: "reply-new",
      parentCommentId: "root-new",
      content: "new reply",
      createdAt: "2026-03-01T00:12:00.000Z",
    },
  ]

  const tree = buildPersistedCommentTree(flatComments)
  assert.deepEqual(
    tree.map((comment) => comment.id),
    ["root-new", "root-old"]
  )
  assert.deepEqual(
    tree[0].replies.map((comment) => comment.id),
    ["reply-new", "reply-old"]
  )
})

test("buildPersistedCommentTree keeps orphan replies as root nodes", () => {
  const flatComments = [
    {
      id: "orphan-reply",
      parentCommentId: "missing-parent",
      content: "orphan",
      createdAt: "2026-03-01T00:05:00.000Z",
    },
  ]

  const tree = buildPersistedCommentTree(flatComments)
  assert.equal(tree.length, 1)
  assert.equal(tree[0].id, "orphan-reply")
  assert.equal(tree[0].parentCommentId, "missing-parent")
  assert.deepEqual(tree[0].replies, [])
})

test("buildPersistedCommentTree normalizes persisted fields used by UI", () => {
  const flatComments = [
    {
      id: "root",
      userId: "u-1",
      displayName: "Akiko",
      likesCount: 4,
      media: {
        type: "image/png",
        url: "https://example.com/image.png",
      },
      createdAt: "2026-03-01T00:01:00.000Z",
    },
  ]

  const tree = buildPersistedCommentTree(flatComments)
  assert.equal(tree[0].user, "Akiko")
  assert.equal(tree[0].likes, 4)
  assert.equal(tree[0].avatar, "A")
  assert.equal(tree[0].media.url, "https://example.com/image.png")
})
