/**
 * Encryption Service
 *
 * Uses Web Crypto API (AES-GCM) to encrypt sensitive user data before storing in Firebase.
 *
 * IMPORTANT SECURITY NOTES:
 * - Encryption key is derived from a stable user identifier (UID), not from rotating auth tokens
 * - Each encrypted payload uses a random salt for PBKDF2 key derivation
 * - Data is encrypted client-side before sending to Firebase
 */

const KEY_DERIVATION_ITERATIONS = 100000
const KEY_DERIVATION_HASH = "SHA-256"
const SALT_LENGTH = 16
const IV_LENGTH = 12

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null
  const parts = token.split(".")
  if (parts.length !== 3) return null

  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")
    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

function resolveStableUserId(userIdentity) {
  const rawIdentity = String(userIdentity || "").trim()
  if (!rawIdentity) return ""

  const jwtPayload = decodeJwtPayload(rawIdentity)
  const uidCandidate =
    jwtPayload?.user_id || jwtPayload?.uid || jwtPayload?.sub || ""
  return String(uidCandidate || rawIdentity).trim()
}

const deriveKey = async (userId, salt) => {
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
      iterations: KEY_DERIVATION_ITERATIONS,
      hash: KEY_DERIVATION_HASH,
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
}

/**
 * Encrypt data using AES-GCM
 * @param {string} data - The data to encrypt
 * @param {string} userIdentity - Stable UID (or Firebase token containing UID claims)
 * @returns {Promise<string>} - Base64 encoded payload: [salt][iv][ciphertext]
 */
export const encryptData = async (data, userIdentity) => {
  if (!data || !userIdentity) {
    return null
  }

  try {
    const stableUserId = resolveStableUserId(userIdentity)
    if (!stableUserId) return null

    const encoder = new TextEncoder()
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
    const key = await deriveKey(stableUserId, salt)
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))

    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      encoder.encode(data)
    )

    const combined = new Uint8Array(
      salt.length + iv.length + encryptedData.byteLength
    )
    combined.set(salt, 0)
    combined.set(iv, salt.length)
    combined.set(new Uint8Array(encryptedData), salt.length + iv.length)

    return btoa(String.fromCharCode(...combined))
  } catch (error) {
    console.error("Encryption error:", error)
    return null
  }
}

/**
 * Decrypt data using AES-GCM
 * @param {string} encryptedData - Base64 encoded payload: [salt][iv][ciphertext]
 * @param {string} userIdentity - Stable UID (or Firebase token containing UID claims)
 * @returns {Promise<string|null>} - Decrypted data
 */
export const decryptData = async (encryptedData, userIdentity) => {
  if (!encryptedData || !userIdentity) {
    return null
  }

  try {
    const stableUserId = resolveStableUserId(userIdentity)
    if (!stableUserId) return null

    const decoder = new TextDecoder()
    const combined = new Uint8Array(
      atob(encryptedData)
        .split("")
        .map((c) => c.charCodeAt(0))
    )

    if (combined.length <= SALT_LENGTH + IV_LENGTH) {
      return null
    }

    const salt = combined.slice(0, SALT_LENGTH)
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const data = combined.slice(SALT_LENGTH + IV_LENGTH)
    const key = await deriveKey(stableUserId, salt)

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      key,
      data
    )

    return decoder.decode(decryptedData)
  } catch (error) {
    console.error("Decryption error:", error)
    return null
  }
}

/**
 * Encrypt sensitive API credentials
 * @param {Object} credentials - Object containing API credentials
 * @param {string} userIdentity - Stable UID (or Firebase token containing UID claims)
 * @returns {Promise<Object>} - Object with encrypted credentials
 */
export const encryptCredentials = async (credentials, userIdentity) => {
  const encrypted = {}

  for (const [key, value] of Object.entries(credentials)) {
    if (value) {
      encrypted[key] = await encryptData(value, userIdentity)
    } else {
      encrypted[key] = null
    }
  }

  return encrypted
}

/**
 * Decrypt sensitive API credentials
 * @param {Object} encryptedCredentials - Object containing encrypted credentials
 * @param {string} userIdentity - Stable UID (or Firebase token containing UID claims)
 * @returns {Promise<Object>} - Object with decrypted credentials
 */
export const decryptCredentials = async (
  encryptedCredentials,
  userIdentity
) => {
  const decrypted = {}

  for (const [key, value] of Object.entries(encryptedCredentials)) {
    if (value) {
      decrypted[key] = await decryptData(value, userIdentity)
    } else {
      decrypted[key] = null
    }
  }

  return decrypted
}

/**
 * Check if data is encrypted (base64 check)
 */
export const isEncrypted = (data) => {
  if (!data || typeof data !== "string") return false

  try {
    return btoa(atob(data)) === data
  } catch {
    return false
  }
}
