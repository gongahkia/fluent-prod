import crypto from 'crypto'

/**
 * Backend Encryption Service
 *
 * Uses Node.js crypto module (AES-256-GCM) to encrypt sensitive data server-side.
 * This is used for storing OAuth tokens and API keys in the database.
 *
 * IMPORTANT SECURITY NOTES:
 * - Encryption key MUST be set in environment variable ENCRYPTION_KEY
 * - Key should be a 32-byte (256-bit) random string
 * - Generate with: node -e "console.log(crypto.randomBytes(32).toString('base64'))"
 * - NEVER commit the encryption key to version control
 * - Rotate the key periodically and re-encrypt all stored data
 *
 * Environment Variable Required:
 * - ENCRYPTION_KEY: Base64-encoded 32-byte encryption key
 */

const ENCRYPTION_KEY_BASE64 = process.env.ENCRYPTION_KEY || ''
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 128 bits for GCM
const AUTH_TAG_LENGTH = 16 // 128 bits for GCM
const SALT_LENGTH = 32 // 256 bits for PBKDF2

/**
 * Get or derive encryption key
 * Falls back to a derived key from a password if ENCRYPTION_KEY is not set
 */
function getEncryptionKey() {
  if (ENCRYPTION_KEY_BASE64) {
    try {
      const key = Buffer.from(ENCRYPTION_KEY_BASE64, 'base64')
      if (key.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be 32 bytes (256 bits)')
      }
      return key
    } catch (error) {
      console.error('Invalid ENCRYPTION_KEY format:', error.message)
      throw new Error('Invalid encryption key configuration')
    }
  }

  // WARNING: Fallback for development only!
  // In production, you MUST set a proper ENCRYPTION_KEY environment variable
  console.warn('⚠️  ENCRYPTION_KEY not set! Using development fallback (INSECURE for production)')
  const fallbackPassword = 'fluent-dev-key-change-in-production'
  const salt = Buffer.from('fluent-salt-12345678901234567890') // Fixed salt for development
  return crypto.pbkdf2Sync(fallbackPassword, salt, 100000, 32, 'sha256')
}

/**
 * Encrypt data using AES-256-GCM
 * @param {string|Object} data - Data to encrypt (will be JSON stringified if object)
 * @returns {string} - Base64 encoded encrypted data with IV and auth tag
 */
export function encryptData(data) {
  try {
    const key = getEncryptionKey()

    // Convert data to string if it's an object
    const plaintext = typeof data === 'object' ? JSON.stringify(data) : String(data)

    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH)

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    // Encrypt the data
    let encrypted = cipher.update(plaintext, 'utf8', 'base64')
    encrypted += cipher.final('base64')

    // Get authentication tag
    const authTag = cipher.getAuthTag()

    // Combine IV + auth tag + encrypted data
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'base64')
    ])

    // Return as base64
    return combined.toString('base64')
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error(`Failed to encrypt data: ${error.message}`)
  }
}

/**
 * Decrypt data using AES-256-GCM
 * @param {string} encryptedData - Base64 encoded encrypted data with IV and auth tag
 * @returns {string|Object} - Decrypted data (parsed as JSON if possible)
 */
export function decryptData(encryptedData) {
  try {
    const key = getEncryptionKey()

    // Decode from base64
    const combined = Buffer.from(encryptedData, 'base64')

    // Extract IV, auth tag, and encrypted data
    const iv = combined.slice(0, IV_LENGTH)
    const authTag = combined.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
    const encrypted = combined.slice(IV_LENGTH + AUTH_TAG_LENGTH)

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    // Decrypt the data
    let decrypted = decipher.update(encrypted, null, 'utf8')
    decrypted += decipher.final('utf8')

    // Try to parse as JSON
    try {
      return JSON.parse(decrypted)
    } catch {
      // Return as string if not JSON
      return decrypted
    }
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error(`Failed to decrypt data: ${error.message}`)
  }
}

/**
 * Encrypt sensitive credentials object
 * @param {Object} credentials - Object containing credentials
 * @returns {string} - Base64 encoded encrypted credentials
 */
export function encryptCredentials(credentials) {
  return encryptData(credentials)
}

/**
 * Decrypt sensitive credentials object
 * @param {string} encryptedCredentials - Base64 encoded encrypted credentials
 * @returns {Object} - Decrypted credentials object
 */
export function decryptCredentials(encryptedCredentials) {
  return decryptData(encryptedCredentials)
}

/**
 * Check if encryption key is configured
 * @returns {boolean}
 */
export function isEncryptionConfigured() {
  return !!ENCRYPTION_KEY_BASE64
}

/**
 * Generate a new encryption key (for setup purposes)
 * Run: node -e "import('./services/encryptionService.js').then(m => console.log(m.generateEncryptionKey()))"
 * @returns {string} - Base64 encoded 32-byte key
 */
export function generateEncryptionKey() {
  const key = crypto.randomBytes(32)
  return key.toString('base64')
}

export default {
  encryptData,
  decryptData,
  encryptCredentials,
  decryptCredentials,
  isEncryptionConfigured,
  generateEncryptionKey
}
