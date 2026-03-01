import {
  blockingCol,
  credentialsDoc,
  deleteAllDocsInCollection,
  deleteDoc,
  dictionaryCol,
  flashcardsCol,
  followersCol,
  followingCol,
  savedPostsCol,
  userDoc,
} from "./shared"

export const deleteUserAccountData = async (userId) => {
  try {
    await deleteAllDocsInCollection(dictionaryCol(userId))
    await deleteAllDocsInCollection(savedPostsCol(userId))
    await deleteAllDocsInCollection(flashcardsCol(userId))
    await deleteAllDocsInCollection(followingCol(userId))
    await deleteAllDocsInCollection(followersCol(userId))
    await deleteAllDocsInCollection(blockingCol(userId))

    await deleteDoc(credentialsDoc(userId)).catch(() => {
      // Best effort cleanup
    })
    await deleteDoc(userDoc(userId)).catch(() => {
      // Best effort cleanup
    })

    return { success: true }
  } catch (error) {
    console.error("Error deleting user account data:", error)
    return { success: false, error: error.message }
  }
}
