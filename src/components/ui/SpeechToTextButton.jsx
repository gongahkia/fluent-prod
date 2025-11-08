/**
 * SpeechToTextButton Component
 * Button for speech-to-text transcription in comment sections
 * Supports Japanese and Korean based on user's target language
 */

import React, { useState } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import speechToTextService from '@/services/speechToTextService'

export function SpeechToTextButton({
  targetLanguage,
  onTranscript,
  className = '',
  disabled = false,
}) {
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState(null)

  const handleClick = (e) => {
    e.preventDefault()
    e.stopPropagation()

    // If already listening, stop
    if (isListening) {
      speechToTextService.stopListening()
      setIsListening(false)
      return
    }

    // Check browser support
    if (!speechToTextService.isSpeechRecognitionSupported()) {
      setError('Speech recognition not supported in this browser')
      return
    }

    // Reset error
    setError(null)

    // Start listening
    const started = speechToTextService.startListening(targetLanguage, {
      onStart: () => {
        setIsListening(true)
        setError(null)
      },
      onResult: (transcript) => {
        if (onTranscript) {
          onTranscript(transcript)
        }
        setIsListening(false)
      },
      onEnd: () => {
        setIsListening(false)
      },
      onError: (err) => {
        console.error('Speech recognition error:', err)
        setError(err.message)
        setIsListening(false)
      },
    })

    if (!started) {
      setError('Failed to start speech recognition')
    }
  }

  // Determine icon and styling
  const Icon = error ? MicOff : isListening ? Loader2 : Mic
  const buttonText = isListening
    ? 'Listening...'
    : error
      ? 'Mic Error'
      : 'Voice Input'

  const languageLabel = ''

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`flex items-center space-x-1 text-sm ${
        isListening
          ? 'text-red-600 hover:text-red-700'
          : error
            ? 'text-gray-400'
            : 'text-gray-600 hover:text-orange-600'
      } transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={
        error
          ? error
          : isListening
            ? `Listening for ${targetLanguage}... Click to stop`
            : `Speak in ${targetLanguage}`
      }
    >
      <Icon
        className={`w-4 h-4 ${isListening ? 'animate-pulse' : ''}`}
        aria-hidden="true"
      />
      <span>
        {buttonText} {languageLabel}
      </span>
    </button>
  )
}

export default SpeechToTextButton
