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
const ENCRYPTION_PAYLOAD_VERSION = 2

function bytesToBase64(bytes) {
  return btoa(String.fromCharCode(...bytes))
}

function base64ToBytes(value) {
  return new Uint8Array(
    atob(value)
      .split("")
      .map((c) => c.charCodeAt(0))
  )
}

function encodeVersionedPayload({ version, salt, iv, ciphertext }) {
  return btoa(
    JSON.stringify({
      v: version,
      s: bytesToBase64(salt),
      i: bytesToBase64(iv),
      d: bytesToBase64(ciphertext),
    })
  )
}

function decodeVersionedPayload(encodedPayload) {
  const decodedPayload = JSON.parse(atob(encodedPayload))
  if (
    !decodedPayload ||
    typeof decodedPayload !== "object" ||
    typeof decodedPayload.v !== "number" ||
    !decodedPayload.s ||
    !decodedPayload.i ||
    !decodedPayload.d
  ) {
    return null
  }

  return {
    version: decodedPayload.v,
    salt: base64ToBytes(decodedPayload.s),
    iv: base64ToBytes(decodedPayload.i),
    ciphertext: base64ToBytes(decodedPayload.d),
  }
}

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

const deriveLegacyTokenKey = async (userToken) => {
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
      iterations: KEY_DERIVATION_ITERATIONS,
      hash: KEY_DERIVATION_HASH,
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
}

async function tryDecryptVersionedPayload(encryptedData, stableUserId) {
  const parsedPayload = decodeVersionedPayload(encryptedData)
  if (
    !parsedPayload ||
    parsedPayload.version !== ENCRYPTION_PAYLOAD_VERSION ||
    parsedPayload.salt.length !== SALT_LENGTH ||
    parsedPayload.iv.length !== IV_LENGTH
  ) {
    return null
  }

  const key = await deriveKey(stableUserId, parsedPayload.salt)
  const decryptedData = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: parsedPayload.iv,
    },
    key,
    parsedPayload.ciphertext
  )
  return new TextDecoder().decode(decryptedData)
}

async function tryDecryptUnversionedSaltedPayload(encryptedData, stableUserId) {
  const combined = base64ToBytes(encryptedData)
  if (combined.length <= SALT_LENGTH + IV_LENGTH) return null

  const salt = combined.slice(0, SALT_LENGTH)
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH)
  const key = await deriveKey(stableUserId, salt)
  const decryptedData = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    ciphertext
  )
  return new TextDecoder().decode(decryptedData)
}

async function tryDecryptLegacyTokenPayload(encryptedData, userIdentity) {
  const token = String(userIdentity || "").trim()
  if (!token.includes(".")) return null

  const combined = base64ToBytes(encryptedData)
  if (combined.length <= IV_LENGTH) return null

  const iv = combined.slice(0, IV_LENGTH)
  const ciphertext = combined.slice(IV_LENGTH)
  const key = await deriveLegacyTokenKey(token)
  const decryptedData = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    ciphertext
  )
  return new TextDecoder().decode(decryptedData)
}

/**
 * Encrypt data using AES-GCM
 * @param {string} data - The data to encrypt
 * @param {string} userIdentity - Stable UID (or Firebase token containing UID claims)
 * @returns {Promise<string>} - Base64 encoded JSON payload with version metadata
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

    const ciphertext = new Uint8Array(encryptedData)
    return encodeVersionedPayload({
      version: ENCRYPTION_PAYLOAD_VERSION,
      salt,
      iv,
      ciphertext,
    })
  } catch (error) {
    console.error("Encryption error:", error)
    return null
  }
}

/**
 * Decrypt data using AES-GCM
 * @param {string} encryptedData - Base64 encoded JSON payload with version metadata
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

    try {
      const versioned = await tryDecryptVersionedPayload(
        encryptedData,
        stableUserId
      )
      if (versioned !== null) return versioned
    } catch {
      // fall through to migration-compatible legacy formats
    }

    try {
      const unversioned = await tryDecryptUnversionedSaltedPayload(
        encryptedData,
        stableUserId
      )
      if (unversioned !== null) return unversioned
    } catch {
      // fall through to oldest token-derived format
    }

    try {
      const legacy = await tryDecryptLegacyTokenPayload(
        encryptedData,
        userIdentity
      )
      if (legacy !== null) return legacy
      return null
    } catch {
      return null
    }
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
