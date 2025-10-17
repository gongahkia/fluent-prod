import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { handleRedditCallback } from '@/services/redditService'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

/**
 * Reddit OAuth Callback Handler
 * Handles the redirect from Reddit after user authorizes the app
 */
const RedditCallback = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [status, setStatus] = useState('processing') // processing, success, error
  const [message, setMessage] = useState('Connecting to Reddit...')

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get authorization code and state from URL
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        // Check for errors from Reddit
        if (error) {
          throw new Error(`Reddit authorization failed: ${error}`)
        }

        // Validate required parameters
        if (!code || !state) {
          throw new Error('Missing authorization code or state parameter')
        }

        // Verify state matches (CSRF protection)
        const storedState = sessionStorage.getItem('reddit_oauth_state')
        if (state !== storedState) {
          throw new Error('Invalid state parameter - possible CSRF attack')
        }

        // Clear stored state
        sessionStorage.removeItem('reddit_oauth_state')

        // Ensure user is logged in
        if (!currentUser) {
          throw new Error('You must be logged in to connect Reddit')
        }

        setMessage('Exchanging authorization code...')

        // Exchange code for tokens
        const result = await handleRedditCallback(code, state, currentUser.uid)

        if (result.success) {
          setStatus('success')
          setMessage(`Successfully connected Reddit account: @${result.username}`)

          // Redirect to profile after 2 seconds
          setTimeout(() => {
            navigate('/profile?tab=connected-accounts')
          }, 2000)
        } else {
          throw new Error('Failed to connect Reddit account')
        }
      } catch (error) {
        console.error('Reddit callback error:', error)
        setStatus('error')
        setMessage(error.message || 'An unexpected error occurred')

        // Redirect to profile after 5 seconds on error
        setTimeout(() => {
          navigate('/profile?tab=connected-accounts')
        }, 5000)
      }
    }

    processCallback()
  }, [searchParams, currentUser, navigate])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {status === 'processing' && (
            <Loader2 className="w-16 h-16 text-orange-600 animate-spin" />
          )}
          {status === 'success' && (
            <CheckCircle2 className="w-16 h-16 text-green-600" />
          )}
          {status === 'error' && (
            <XCircle className="w-16 h-16 text-red-600" />
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-4">
          {status === 'processing' && 'Connecting Reddit'}
          {status === 'success' && 'Success!'}
          {status === 'error' && 'Connection Failed'}
        </h1>

        {/* Message */}
        <p className="text-gray-600 text-center mb-6">
          {message}
        </p>

        {/* Loading Progress (only show during processing) */}
        {status === 'processing' && (
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div className="bg-orange-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
          </div>
        )}

        {/* Redirect Info */}
        <p className="text-sm text-gray-500 text-center">
          {status === 'success' && 'Redirecting to your profile...'}
          {status === 'error' && 'You will be redirected shortly...'}
        </p>

        {/* Manual Navigation (only show on error) */}
        {status === 'error' && (
          <button
            onClick={() => navigate('/profile?tab=connected-accounts')}
            className="mt-6 w-full bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            Go to Profile
          </button>
        )}
      </div>
    </div>
  )
}

export default RedditCallback
