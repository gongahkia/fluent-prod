/**
 * Pronunciation Service
 * Handles text-to-speech functionality using Web Speech API
 * Supports Japanese, Korean, and English pronunciation
 */

class PronunciationService {
  constructor() {
    this.synth = null;
    this.currentUtterance = null;
    this.voices = [];
    this.voicesLoaded = false;

    // Initialize if browser supports Speech Synthesis
    if (this.isSpeechSynthesisSupported()) {
      this.synth = window.speechSynthesis;
      this.loadVoices();

      // Voices load asynchronously in some browsers
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
    }
  }

  /**
   * Check if browser supports Speech Synthesis API
   * @returns {boolean}
   */
  isSpeechSynthesisSupported() {
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  /**
   * Load available voices
   */
  loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
    this.voicesLoaded = this.voices.length > 0;
  }

  /**
   * Get language code for Web Speech API
   * @param {string} language - Language name (Japanese, Korean, English)
   * @returns {string} Language code (ja-JP, ko-KR, en-US)
   */
  getLanguageCode(language) {
    const languageMap = {
      Japanese: 'ja-JP',
      Korean: 'ko-KR',
      English: 'en-US',
      ja: 'ja-JP',
      ko: 'ko-KR',
      en: 'en-US',
    };
    return languageMap[language] || 'en-US';
  }

  /**
   * Get best available voice for a language
   * @param {string} languageCode - Language code (ja-JP, ko-KR, en-US)
   * @returns {SpeechSynthesisVoice|null}
   */
  getVoiceForLanguage(languageCode) {
    if (!this.voicesLoaded) {
      this.loadVoices();
    }

    // Find voices matching the language code
    const matchingVoices = this.voices.filter((voice) =>
      voice.lang.startsWith(languageCode.split('-')[0])
    );

    if (matchingVoices.length === 0) {
      console.warn(`No voice found for language: ${languageCode}`);
      return null;
    }

    // Prefer native/local voices over online voices
    const nativeVoice = matchingVoices.find((voice) => voice.localService);
    return nativeVoice || matchingVoices[0];
  }

  /**
   * Pronounce text in the specified language
   * @param {string} text - Text to pronounce
   * @param {string} language - Language (Japanese, Korean, English)
   * @param {Object} options - Additional options
   * @param {number} options.rate - Speech rate (0.1 to 10, default 1)
   * @param {number} options.pitch - Speech pitch (0 to 2, default 1)
   * @param {number} options.volume - Speech volume (0 to 1, default 1)
   * @param {Function} options.onStart - Callback when speech starts
   * @param {Function} options.onEnd - Callback when speech ends
   * @param {Function} options.onError - Callback on error
   * @returns {Promise<void>}
   */
  async speak(text, language, options = {}) {
    if (!this.isSpeechSynthesisSupported()) {
      console.error('Speech Synthesis not supported in this browser');
      if (options.onError) {
        options.onError(new Error('Speech Synthesis not supported'));
      }
      return Promise.reject(new Error('Speech Synthesis not supported'));
    }

    if (!text || text.trim() === '') {
      console.warn('No text provided for pronunciation');
      return Promise.resolve();
    }

    // Stop any ongoing speech
    this.stop();

    const languageCode = this.getLanguageCode(language);
    const voice = this.getVoiceForLanguage(languageCode);

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);

      // Set voice
      if (voice) {
        utterance.voice = voice;
      }
      utterance.lang = languageCode;

      // Set options
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume !== undefined ? options.volume : 1;

      // Event handlers
      utterance.onstart = () => {
        if (options.onStart) options.onStart();
      };

      utterance.onend = () => {
        this.currentUtterance = null;
        if (options.onEnd) options.onEnd();
        resolve();
      };

      utterance.onerror = (event) => {
        this.currentUtterance = null;
        console.error('Speech synthesis error:', event);
        if (options.onError) {
          options.onError(event);
        }
        reject(event);
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  /**
   * Stop current speech
   */
  stop() {
    if (this.synth && this.synth.speaking) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  /**
   * Pause current speech
   */
  pause() {
    if (this.synth && this.synth.speaking && !this.synth.paused) {
      this.synth.pause();
    }
  }

  /**
   * Resume paused speech
   */
  resume() {
    if (this.synth && this.synth.paused) {
      this.synth.resume();
    }
  }

  /**
   * Check if currently speaking
   * @returns {boolean}
   */
  isSpeaking() {
    return this.synth ? this.synth.speaking : false;
  }

  /**
   * Check if currently paused
   * @returns {boolean}
   */
  isPaused() {
    return this.synth ? this.synth.paused : false;
  }

  /**
   * Get all available voices
   * @returns {SpeechSynthesisVoice[]}
   */
  getAvailableVoices() {
    if (!this.voicesLoaded) {
      this.loadVoices();
    }
    return this.voices;
  }

  /**
   * Get voices for a specific language
   * @param {string} language - Language name or code
   * @returns {SpeechSynthesisVoice[]}
   */
  getVoicesForLanguage(language) {
    const languageCode = this.getLanguageCode(language);
    const langPrefix = languageCode.split('-')[0];
    return this.getAvailableVoices().filter((voice) =>
      voice.lang.startsWith(langPrefix)
    );
  }
}

// Create singleton instance
const pronunciationService = new PronunciationService();

export default pronunciationService;
