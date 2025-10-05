import { AlertCircle, Shield, X } from 'lucide-react'
import React, { useState } from 'react'

/**
 * Component to display when Firebase is blocked by ad blocker or browser
 */
const FirebaseBlockedWarning = ({ onDismiss, errorInfo }) => {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    if (onDismiss) onDismiss()
  }

  const defaultErrorInfo = {
    title: 'Connection Blocked',
    message: 'Firebase requests are being blocked. This is usually caused by ad blockers or browser privacy settings.',
    suggestions: [
      'Disable ad blockers for this website',
      'Check browser privacy/tracking protection settings',
      'Try a different browser',
      'Disable browser extensions temporarily'
    ]
  }

  const info = errorInfo || defaultErrorInfo

  return (
    <div className="fixed bottom-4 right-4 max-w-md z-50 animate-slide-up">
      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <h3 className="font-semibold text-yellow-900">{info.title}</h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-yellow-600 hover:text-yellow-800 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-yellow-800 mb-3">{info.message}</p>

        <div className="bg-yellow-100 rounded-md p-3 mb-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-700 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-yellow-800">
              <p className="font-medium mb-1">Common solutions:</p>
              <ul className="list-disc list-inside space-y-1">
                {info.suggestions?.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <a
            href="https://firebase.google.com/docs/web/troubleshooting"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-yellow-700 hover:text-yellow-900 underline"
          >
            Learn more
          </a>
          <button
            onClick={handleDismiss}
            className="text-xs font-medium text-yellow-800 hover:text-yellow-900 px-3 py-1 bg-yellow-200 rounded-md hover:bg-yellow-300 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

export default FirebaseBlockedWarning
