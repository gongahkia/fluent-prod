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

const dictionaryWriteSchema = z
  .object({
    id: z.string().trim().min(1),
    userId: z.string().trim().min(1),
    language: z.string().trim().min(1).max(64),
    japanese: z.string().trim().min(1).max(500).optional(),
    english: z.string().trim().min(1).max(500).optional(),
    hiragana: z.string().max(500).nullable().optional(),
    level: z.number().int().min(1).max(10).optional(),
  })
  .passthrough()

const savedPostWriteSchema = z
  .object({
    id: z.string().trim().min(1),
    postId: z.string().trim().min(1),
    postHash: z.string().trim().min(1),
    userId: z.string().trim().min(1),
    title: z.string().max(500).optional(),
    content: z.string().max(20000).optional(),
    source: z.string().max(120).optional(),
    url: z.string().max(3000).optional(),
  })
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

export function validateDictionaryWritePayload(payload) {
  const parsed = dictionaryWriteSchema.safeParse(payload)
  if (!parsed.success) {
    throw buildSchemaError(
      "FIRESTORE_SCHEMA_DICTIONARY_WRITE",
      parsed.error.issues
    )
  }
  return parsed.data
}

export function validateSavedPostWritePayload(payload) {
  const parsed = savedPostWriteSchema.safeParse(payload)
  if (!parsed.success) {
    throw buildSchemaError(
      "FIRESTORE_SCHEMA_SAVED_POST_WRITE",
      parsed.error.issues
    )
  }
  return parsed.data
}
