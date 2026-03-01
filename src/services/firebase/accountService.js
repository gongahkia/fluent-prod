import { mapFirestoreError } from "./errorMapper"
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
  withFirestoreWrite,
} from "./shared"

export const deleteUserAccountData = async (userId) => {
  try {
    await withFirestoreWrite("delete:dictionaryWords", () =>
      deleteAllDocsInCollection(dictionaryCol(userId))
    )
    await withFirestoreWrite("delete:savedPosts", () =>
      deleteAllDocsInCollection(savedPostsCol(userId))
    )
    await withFirestoreWrite("delete:flashcards", () =>
      deleteAllDocsInCollection(flashcardsCol(userId))
    )
    await withFirestoreWrite("delete:following", () =>
      deleteAllDocsInCollection(followingCol(userId))
    )
    await withFirestoreWrite("delete:followers", () =>
      deleteAllDocsInCollection(followersCol(userId))
    )
    await withFirestoreWrite("delete:blocking", () =>
      deleteAllDocsInCollection(blockingCol(userId))
    )

    await withFirestoreWrite("delete:credentials", () =>
      deleteDoc(credentialsDoc(userId))
    ).catch(() => {
      // Best effort cleanup
    })
    await withFirestoreWrite("delete:userProfile", () =>
      deleteDoc(userDoc(userId))
    ).catch(() => {
      // Best effort cleanup
    })

    return { success: true }
  } catch (error) {
    console.error("Error deleting user account data:", error)
    const mapped = mapFirestoreError(error)
    return {
      success: false,
      error: mapped.message,
      errorCode: mapped.errorCode,
    }
  }
}
