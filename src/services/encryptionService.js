/**
 * Encryption Service
 *
 * Uses Web Crypto API (AES-GCM) to encrypt sensitive user data before storing in Firebase.
 * This follows industry standards for client-side encryption.
 *
 * IMPORTANT SECURITY NOTES:
 * - Encryption key is derived from the user's Firebase auth token
 * - Each user has their own unique encryption key
 * - Data is encrypted client-side before sending to Firebase
 * - Firebase Firestore rules ensure users can only access their own data
 * - Even if Firestore is compromised, encrypted data cannot be read without the key
 */

/**
 * Derive an encryption key from the user's Firebase auth token
 * This ensures each user has a unique encryption key
 */
const deriveKey = async (userToken) => {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(userToken),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )

  // Use PBKDF2 with a salt to derive the actual encryption key
  // Salt is derived from the user token for consistency
  const salt = encoder.encode(userToken.substring(0, 16).padEnd(16, '0'))

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypt data using AES-GCM
 * @param {string} data - The data to encrypt
 * @param {string} userToken - User's Firebase auth token (used to derive key)
 * @returns {Promise<string>} - Base64 encoded encrypted data with IV
 */
export const encryptData = async (data, userToken) => {
  if (!data || !userToken) {
    return null
  }

  try {
    const encoder = new TextEncoder()
    const key = await deriveKey(userToken)

    // Generate a random initialization vector (IV)
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Encrypt the data
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encoder.encode(data)
    )

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(encryptedData), iv.length)

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined))
  } catch (error) {
    console.error('Encryption error:', error)
    return null
  }
}

/**
 * Decrypt data using AES-GCM
 * @param {string} encryptedData - Base64 encoded encrypted data with IV
 * @param {string} userToken - User's Firebase auth token (used to derive key)
 * @returns {Promise<string>} - Decrypted data
 */
export const decryptData = async (encryptedData, userToken) => {
  if (!encryptedData || !userToken) {
    return null
  }

  try {
    const decoder = new TextDecoder()
    const key = await deriveKey(userToken)

    // Convert from base64
    const combined = new Uint8Array(
      atob(encryptedData).split('').map(c => c.charCodeAt(0))
    )

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12)
    const data = combined.slice(12)

    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    )

    return decoder.decode(decryptedData)
  } catch (error) {
    console.error('Decryption error:', error)
    return null
  }
}

/**
 * Encrypt sensitive API credentials
 * @param {Object} credentials - Object containing API credentials
 * @param {string} userToken - User's Firebase auth token
 * @returns {Promise<Object>} - Object with encrypted credentials
 */
export const encryptCredentials = async (credentials, userToken) => {
  const encrypted = {}

  for (const [key, value] of Object.entries(credentials)) {
    if (value) {
      encrypted[key] = await encryptData(value, userToken)
    } else {
      encrypted[key] = null
    }
  }

  return encrypted
}

/**
 * Decrypt sensitive API credentials
 * @param {Object} encryptedCredentials - Object containing encrypted credentials
 * @param {string} userToken - User's Firebase auth token
 * @returns {Promise<Object>} - Object with decrypted credentials
 */
export const decryptCredentials = async (encryptedCredentials, userToken) => {
  const decrypted = {}

  for (const [key, value] of Object.entries(encryptedCredentials)) {
    if (value) {
      decrypted[key] = await decryptData(value, userToken)
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
  if (!data || typeof data !== 'string') return false

  try {
    return btoa(atob(data)) === data
  } catch {
    return false
  }
}
