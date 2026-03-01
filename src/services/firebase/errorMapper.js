const FIRESTORE_CODE_MAP = {
  aborted: "FIRESTORE_ABORTED",
  "already-exists": "FIRESTORE_ALREADY_EXISTS",
  cancelled: "FIRESTORE_CANCELLED",
  "data-loss": "FIRESTORE_DATA_LOSS",
  "deadline-exceeded": "FIRESTORE_DEADLINE_EXCEEDED",
  "failed-precondition": "FIRESTORE_FAILED_PRECONDITION",
  internal: "FIRESTORE_INTERNAL",
  "invalid-argument": "FIRESTORE_INVALID_ARGUMENT",
  "not-found": "FIRESTORE_NOT_FOUND",
  "out-of-range": "FIRESTORE_OUT_OF_RANGE",
  "permission-denied": "FIRESTORE_PERMISSION_DENIED",
  "resource-exhausted": "FIRESTORE_RESOURCE_EXHAUSTED",
  unauthenticated: "FIRESTORE_UNAUTHENTICATED",
  unavailable: "FIRESTORE_UNAVAILABLE",
  unimplemented: "FIRESTORE_UNIMPLEMENTED",
}

export function mapFirestoreError(error, fallbackCode = "FIRESTORE_UNKNOWN") {
  const rawCode = String(error?.code || "")
    .trim()
    .toLowerCase()
  const errorCode = FIRESTORE_CODE_MAP[rawCode] || fallbackCode
  const message = String(error?.message || "Firestore operation failed")
  return { errorCode, message, rawCode }
}
