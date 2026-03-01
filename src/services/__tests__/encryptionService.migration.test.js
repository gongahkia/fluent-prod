import assert from "node:assert/strict"
import test from "node:test"
import { decryptData, encryptData } from "../encryptionService.js"

const ITERATIONS = 100000
const HASH = "SHA-256"

function toBase64(bytes) {
  return btoa(String.fromCharCode(...bytes))
}

async function deriveUidSaltedKey(userId, salt) {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(userId),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  )
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: ITERATIONS,
      hash: HASH,
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
}

async function deriveLegacyTokenKey(userToken) {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(userToken),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  )
  const tokenSalt = encoder.encode(userToken.substring(0, 16).padEnd(16, "0"))
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: tokenSalt,
      iterations: ITERATIONS,
      hash: HASH,
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
}

async function createLegacyUidSaltedPayload(plaintext, userId) {
  const encoder = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveUidSaltedKey(userId, salt)
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    encoder.encode(plaintext)
  )

  const ciphertext = new Uint8Array(encrypted)
  const combined = new Uint8Array(salt.length + iv.length + ciphertext.length)
  combined.set(salt, 0)
  combined.set(iv, salt.length)
  combined.set(ciphertext, salt.length + iv.length)
  return toBase64(combined)
}

async function createLegacyTokenPayload(plaintext, token) {
  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveLegacyTokenKey(token)
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    encoder.encode(plaintext)
  )

  const ciphertext = new Uint8Array(encrypted)
  const combined = new Uint8Array(iv.length + ciphertext.length)
  combined.set(iv, 0)
  combined.set(ciphertext, iv.length)
  return toBase64(combined)
}

test("encryptData + decryptData round-trip versioned payloads", async () => {
  const userId = "user-abc"
  const plaintext = "secret-value"
  const encrypted = await encryptData(plaintext, userId)

  assert.equal(typeof encrypted, "string")
  const decrypted = await decryptData(encrypted, userId)
  assert.equal(decrypted, plaintext)
})

test("decryptData migrates unversioned salted UID payloads", async () => {
  const userId = "user-migration"
  const plaintext = "legacy-salted"
  const legacyPayload = await createLegacyUidSaltedPayload(plaintext, userId)

  const decrypted = await decryptData(legacyPayload, userId)
  assert.equal(decrypted, plaintext)
})

test("decryptData migrates legacy token-derived payloads", async () => {
  const token =
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLWxlZ2FjeSIsInVpZCI6InVzZXItbGVnYWN5In0.signature"
  const plaintext = "legacy-token-payload"
  const legacyPayload = await createLegacyTokenPayload(plaintext, token)

  const decrypted = await decryptData(legacyPayload, token)
  assert.equal(decrypted, plaintext)
})
