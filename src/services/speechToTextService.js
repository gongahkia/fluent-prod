/**
 * Speech-to-Text Service
 * Handles speech recognition using Web Speech API
 * Supports Japanese and Korean language detection for language learning
 */

class SpeechToTextService {
  constructor() {
    this.recognition = null
    this.isListening = false
    this.currentLanguage = null

    // Check for browser support
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition()
      this.setupRecognition()
    }
  }

  /**
   * Check if browser supports Speech Recognition API
   * @returns {boolean}
   */
  isSpeechRecognitionSupported() {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  }

  /**
   * Setup recognition with optimal settings for accuracy
   */
  setupRecognition() {
    if (!this.recognition) return

    // Continuous recognition for better real-time transcription
    this.recognition.continuous = false

    // Only return final results (no interim) for better accuracy
    this.recognition.interimResults = false

    // Get only the most confident result
    this.recognition.maxAlternatives = 1
  }

  /**
   * Get language code for Web Speech API based on target language
   * @param {string} targetLanguage - Target language (Japanese, Korean)
   * @returns {string} Language code (ja-JP, ko-KR)
   */
  getLanguageCode(targetLanguage) {
    const languageMap = {
      Japanese: 'ja-JP',
      Korean: 'ko-KR',
      ja: 'ja-JP',
      ko: 'ko-KR',
    }
    return languageMap[targetLanguage] || 'ja-JP'
  }

  /**
   * Start listening for speech in the specified language
   * @param {string} targetLanguage - Language to listen for (Japanese or Korean)
   * @param {Object} callbacks - Event callbacks
   * @param {Function} callbacks.onResult - Called with transcribed text
   * @param {Function} callbacks.onStart - Called when listening starts
   * @param {Function} callbacks.onEnd - Called when listening ends
   * @param {Function} callbacks.onError - Called on error
   * @returns {boolean} True if started successfully
   */
  startListening(targetLanguage, callbacks = {}) {
    if (!this.isSpeechRecognitionSupported()) {
      console.error('Speech Recognition not supported in this browser')
      if (callbacks.onError) {
        callbacks.onError(new Error('Speech Recognition not supported'))
      }
      return false
    }

    if (this.isListening) {
      console.warn('Already listening')
      return false
    }

    // Set language for recognition
    const languageCode = this.getLanguageCode(targetLanguage)
    this.recognition.lang = languageCode
    this.currentLanguage = targetLanguage

    // Setup event handlers
    this.recognition.onstart = () => {
      this.isListening = true
      console.log(`Speech recognition started for ${targetLanguage} (${languageCode})`)
      if (callbacks.onStart) callbacks.onStart()
    }

    this.recognition.onresult = (event) => {
      const result = event.results[0]
      if (result.isFinal) {
        const transcript = result[0].transcript
        console.log(`Transcribed (${targetLanguage}):`, transcript)
        if (callbacks.onResult) {
          callbacks.onResult(transcript)
        }
      }
    }

    this.recognition.onend = () => {
      this.isListening = false
      console.log('Speech recognition ended')
      if (callbacks.onEnd) callbacks.onEnd()
    }

    this.recognition.onerror = (event) => {
      this.isListening = false
      console.error('Speech recognition error:', event.error)

      // Provide user-friendly error messages
      let errorMessage = 'Speech recognition error'
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.'
          break
        case 'audio-capture':
          errorMessage = 'Microphone not found or permission denied.'
          break
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.'
          break
        case 'network':
          errorMessage = 'Network error. Please check your connection.'
          break
        case 'aborted':
          errorMessage = 'Speech recognition aborted.'
          break
        default:
          errorMessage = `Speech recognition error: ${event.error}`
      }

      if (callbacks.onError) {
        callbacks.onError(new Error(errorMessage))
      }
    }

    // Start recognition
    try {
      this.recognition.start()
      return true
    } catch (error) {
      console.error('Failed to start speech recognition:', error)
      this.isListening = false
      if (callbacks.onError) {
        callbacks.onError(error)
      }
      return false
    }
  }

  /**
   * Stop listening
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }

  /**
   * Abort listening immediately
   */
  abortListening() {
    if (this.recognition && this.isListening) {
      this.recognition.abort()
      this.isListening = false
    }
  }

  /**
   * Check if currently listening
   * @returns {boolean}
   */
  getIsListening() {
    return this.isListening
  }

  /**
   * Get current language being listened for
   * @returns {string|null}
   */
  getCurrentLanguage() {
    return this.currentLanguage
  }
}

// Create singleton instance
const speechToTextService = new SpeechToTextService()

export default speechToTextService
