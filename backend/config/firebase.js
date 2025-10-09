import admin from 'firebase-admin'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'

dotenv.config()

let firebaseApp = null

/**
 * Initialize Firebase Admin SDK
 * Supports both service account file and environment variable configuration
 */
export function initializeFirebase() {
  if (firebaseApp) {
    return firebaseApp
  }

  try {
    // Option 1: Use service account file (recommended for local development)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccount = JSON.parse(readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8'))
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      })
      console.log('✅ Firebase Admin initialized with service account file')
    }
    // Option 2: Use environment variables (recommended for production/Render)
    else if (process.env.FIREBASE_PROJECT_ID) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
        })
      })
      console.log('✅ Firebase Admin initialized with environment variables')
    }
    // Option 3: Use Application Default Credentials (Google Cloud environments)
    else {
      firebaseApp = admin.initializeApp()
      console.log('✅ Firebase Admin initialized with default credentials')
    }

    return firebaseApp
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message)
    throw new Error('Firebase Admin initialization failed')
  }
}

/**
 * Get Firebase Admin app instance
 */
export function getFirebaseApp() {
  if (!firebaseApp) {
    return initializeFirebase()
  }
  return firebaseApp
}

/**
 * Get Firestore instance
 */
export function getFirestore() {
  const app = getFirebaseApp()
  return app.firestore()
}

/**
 * Get Firebase Storage bucket (kept for backward compatibility)
 */
export function getStorageBucket() {
  const app = getFirebaseApp()
  return app.storage().bucket()
}

export default { initializeFirebase, getFirebaseApp, getFirestore, getStorageBucket }
