import { z } from "zod"

const profileWriteSchema = z
  .object({
    userId: z.string().trim().min(1),
    name: z.string().trim().min(1).max(120).optional(),
    email: z.string().trim().email().optional(),
    bio: z.string().max(1000).optional(),
    location: z.string().max(160).optional(),
    website: z.string().max(500).optional(),
    profilePictureUrl: z.string().max(2000).optional(),
    bannerImage: z.string().max(2000).optional(),
    targetLanguage: z.string().max(64).optional(),
    level: z.number().int().min(1).max(5).optional(),
  })
  .passthrough()

const profilePatchSchema = profileWriteSchema
  .omit({ userId: true })
  .partial()
  .passthrough()

function buildSchemaError(errorCode, issues) {
  const error = new Error("Invalid Firestore payload")
  error.code = errorCode
  error.issues = issues
  return error
}

export function validateProfileWritePayload(payload) {
  const parsed = profileWriteSchema.safeParse(payload)
  if (!parsed.success) {
    throw buildSchemaError(
      "FIRESTORE_SCHEMA_PROFILE_WRITE",
      parsed.error.issues
    )
  }
  return parsed.data
}

export function validateProfilePatchPayload(payload) {
  const parsed = profilePatchSchema.safeParse(payload)
  if (!parsed.success) {
    throw buildSchemaError(
      "FIRESTORE_SCHEMA_PROFILE_PATCH",
      parsed.error.issues
    )
  }
  return parsed.data
}
