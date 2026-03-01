import {
  collection,
  fbLimit,
  firestore,
  getDocs,
  query,
  where,
  withFirestoreReadRetry,
} from "./shared"

export const searchUsers = async (searchTerm) => {
  try {
    const term = (searchTerm || "").trim().toLowerCase()
    if (term.length < 2) return { success: true, data: [] }

    const end = `${term}\uf8ff`

    const byName = await withFirestoreReadRetry("searchUsers:byName", () =>
      getDocs(
        query(
          collection(firestore, "users"),
          where("nameLower", ">=", term),
          where("nameLower", "<=", end),
          fbLimit(25)
        )
      )
    )

    const byEmail = await withFirestoreReadRetry("searchUsers:byEmail", () =>
      getDocs(
        query(
          collection(firestore, "users"),
          where("emailLower", ">=", term),
          where("emailLower", "<=", end),
          fbLimit(25)
        )
      )
    )

    const merged = new Map()
    for (const d of [...byName.docs, ...byEmail.docs]) {
      const data = d.data()
      merged.set(d.id, { ...data, userId: d.id })
    }

    return { success: true, data: [...merged.values()] }
  } catch (error) {
    console.error("Error searching users:", error)
    return { success: false, error: error.message, data: [] }
  }
}
