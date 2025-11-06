/**
 * Firebase Error Handler Utility
 * Provides user-friendly error messages and guidance for common Firebase errors
 */

/**
 * Check if error is caused by ad blocker or browser blocking Firebase
 */
export const isFirebaseBlocked = (error) => {
  if (!error) return false

  const errorString = error.toString().toLowerCase()
  const errorMessage = error.message?.toLowerCase() || ''

  return (
    errorString.includes('err_blocked_by_client') ||
    errorString.includes('failed to fetch') ||
    errorMessage.includes('blocked') ||
    errorMessage.includes('network error') ||
    error.code === 'unavailable'
  )
}

/**
 * Get user-friendly error message based on Firebase error
 */
export const getFirebaseErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred'

  // Check if Firebase is blocked
  if (isFirebaseBlocked(error)) {
    return {
      title: 'Connection Blocked',
      message: 'Firebase requests are being blocked. This is usually caused by ad blockers or browser privacy settings.',
      suggestions: [
        'Disable ad blockers for this website',
        'Check browser privacy/tracking protection settings',
        'Try a different browser',
        'Disable browser extensions temporarily',
        'Check your network/firewall settings'
      ],
      type: 'blocked'
    }
  }

  // Permission denied
  if (error.code === 'permission-denied') {
    return {
      title: 'Permission Denied',
      message: 'You do not have permission to access this resource.',
      suggestions: [
        'Make sure you are logged in',
        'Try logging out and logging back in',
        'Contact support if the issue persists'
      ],
      type: 'permission'
    }
  }

  // Network errors
  if (error.code === 'unavailable' || error.message?.includes('network')) {
    return {
      title: 'Network Error',
      message: 'Unable to connect to the database. Please check your internet connection.',
      suggestions: [
        'Check your internet connection',
        'Try refreshing the page',
        'Wait a moment and try again'
      ],
      type: 'network'
    }
  }

  // Auth errors
  if (error.code?.startsWith('auth/')) {
    return {
      title: 'Authentication Error',
      message: error.message || 'An authentication error occurred.',
      suggestions: [
        'Try logging out and logging back in',
        'Clear your browser cache and cookies',
        'Contact support if the issue persists'
      ],
      type: 'auth'
    }
  }

  // Generic error
  return {
    title: 'Error',
    message: error.message || 'An unexpected error occurred.',
    suggestions: [
      'Try refreshing the page',
      'Clear your browser cache',
      'Contact support if the issue persists'
    ],
    type: 'generic'
  }
}

/**
 * Test Firebase connection
 */
export const testFirebaseConnection = async (db) => {
  try {
    const { doc, getDoc } = await import('firebase/firestore')

    // Try to read a dummy document
    const testRef = doc(db, '_test_connection_', 'test')
    await getDoc(testRef)

    return { success: true, message: 'Firebase connection successful' }
  } catch (error) {
    console.error('Firebase connection test failed:', error)

    if (isFirebaseBlocked(error)) {
      return {
        success: false,
        blocked: true,
        error: getFirebaseErrorMessage(error)
      }
    }

    return {
      success: false,
      blocked: false,
      error: getFirebaseErrorMessage(error)
    }
  }
}

/**
 * Retry Firebase operation with exponential backoff
 */
export const retryFirebaseOperation = async (operation, maxRetries = 3, baseDelay = 1000) => {
  let lastError = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // Don't retry if Firebase is blocked - it won't help
      if (isFirebaseBlocked(error)) {
        throw error
      }

      // Don't retry on permission errors
      if (error.code === 'permission-denied') {
        throw error
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw error
      }

      // Wait before retrying (exponential backoff)
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))

      console.log(`Retrying Firebase operation (attempt ${attempt + 2}/${maxRetries})...`)
    }
  }

  throw lastError
}

/**
 * Show user-friendly error notification
 * This is a utility function that can be used with your notification system
 */
export const showFirebaseError = (error, notificationFunction) => {
  const errorInfo = getFirebaseErrorMessage(error)

  if (notificationFunction) {
    notificationFunction({
      title: errorInfo.title,
      message: errorInfo.message,
      suggestions: errorInfo.suggestions,
      type: 'error'
    })
  } else {
    // Fallback to console if no notification function provided
    console.error(`${errorInfo.title}: ${errorInfo.message}`)
    console.info('Suggestions:', errorInfo.suggestions)
  }

  return errorInfo
}
