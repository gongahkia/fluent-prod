// Translation Service using multiple APIs and fallbacks
// This provides real-time translation without hardcoding
// Supports both Japanese and Spanish language learning

class TranslationService {
  constructor() {
    this.cache = new Map(); // Cache translations to avoid repeated API calls
    this.apiEndpoints = {
      // Free translation APIs (no key required)
      mymemory: 'https://api.mymemory.translated.net/get',
      libretranslate: 'https://libretranslate.de/translate', // Free, open-source
      lingva: 'https://lingva.ml/api/v1', // Free Google Translate alternative
      // Add more APIs as needed
    };
  }

  // Main translation function
  async translateText(text, fromLang = 'en', toLang = 'ja') {
    const cacheKey = `${text}_${fromLang}_${toLang}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Try multiple translation services in order of reliability
      let translation = await this.tryLingvaTranslate(text, fromLang, toLang);

      if (!translation) {
        translation = await this.tryMyMemoryTranslation(text, fromLang, toLang);
      }

      if (!translation) {
        translation = await this.tryLibreTranslate(text, fromLang, toLang);
      }

      if (!translation) {
        // Fallback to basic word-by-word translation
        translation = await this.basicWordTranslation(text, fromLang, toLang);
      }

      // Cache the result
      if (translation) {
        this.cache.set(cacheKey, translation);
      }

      return translation || text; // Return original if all fail
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text on error
    }
  }

  // MyMemory Translation API (free, no key required)
  async tryMyMemoryTranslation(text, fromLang, toLang) {
    try {
      const response = await fetch(
        `${this.apiEndpoints.mymemory}?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`
      );

      if (!response.ok) throw new Error('MyMemory API failed');

      const data = await response.json();

      if (data.responseStatus === 200 && data.responseData) {
        const translation = data.responseData.translatedText;

        // Filter out bad translations (single punctuation, same as input, etc.)
        if (translation &&
            translation.length > 1 &&
            translation !== '.' &&
            translation !== text &&
            !translation.match(/^[.,!?;:]+$/)) {
          return translation;
        }
      }
    } catch (error) {
      console.warn('MyMemory translation failed:', error);
    }
    return null;
  }

  // Lingva Translate API (free Google Translate alternative)
  async tryLingvaTranslate(text, fromLang, toLang) {
    try {
      const url = `${this.apiEndpoints.lingva}/${fromLang}/${toLang}/${encodeURIComponent(text)}`;

      const response = await fetch(url);

      if (!response.ok) throw new Error('Lingva Translate API failed');

      const data = await response.json();

      if (data && data.translation) {
        const translation = data.translation;

        // Filter out bad translations
        if (translation &&
            translation.length > 0 &&
            translation !== text &&
            !translation.match(/^[.,!?;:]+$/)) {
          return translation;
        }
      }
    } catch (error) {
      console.warn('Lingva Translate failed:', error);
    }
    return null;
  }

  // LibreTranslate API (free, open-source)
  async tryLibreTranslate(text, fromLang, toLang) {
    try {
      const response = await fetch(this.apiEndpoints.libretranslate, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: fromLang,
          target: toLang,
          format: 'text'
        })
      });

      if (!response.ok) throw new Error('LibreTranslate API failed');

      const data = await response.json();
      return data.translatedText;
    } catch (error) {
      console.warn('LibreTranslate failed:', error);
    }
    return null;
  }

  // No fallback translation - all translations must go through API
  async basicWordTranslation(text, fromLang, toLang) {
    console.warn('All fallback dictionaries removed. Translation must use API calls only.');
    return null;
  }

  // Removed hardcoded translations - use API only

  // Removed hardcoded translations - use API only

  // Removed hardcoded translations - use API only

  // Removed hardcoded translations - use API only

  // Get word definition with pronunciation
  async getWordDefinition(word, fromLang = 'en') {
    try {
      // For Japanese words, try to get reading (hiragana/katakana)
      if (fromLang === 'ja') {
        return await this.getJapaneseWordInfo(word);
      } else if (fromLang === 'es') {
        return await this.getSpanishWordInfo(word);
      } else {
        return await this.getEnglishWordInfo(word);
      }
    } catch (error) {
      console.error('Word definition error:', error);
      return null;
    }
  }

  // Get Japanese word information
  async getJapaneseWordInfo(word) {
    return {
      word: word,
      reading: this.getBasicReading(word),
      translation: await this.translateText(word, 'ja', 'en'),
      level: this.estimateLevel(word)
    };
  }

  // Get Spanish word information
  async getSpanishWordInfo(word) {
    return {
      word: word,
      pronunciation: this.getSpanishPronunciation(word),
      translation: await this.translateText(word, 'es', 'en'),
      level: this.estimateLevel(word)
    };
  }

  // Get English word information
  async getEnglishWordInfo(word) {
    return {
      word: word,
      pronunciation: this.getEnglishPronunciation(word),
      translation: await this.translateText(word, 'en', 'ja'),
      level: this.estimateLevel(word)
    };
  }

  // Reading must be fetched via API - no hardcoded readings
  getBasicReading(word) {
    console.warn('Hardcoded readings removed. Use API to get word readings.');
    return word;
  }

  // Pronunciation must be fetched via API - no hardcoded pronunciations
  getSpanishPronunciation(word) {
    console.warn('Hardcoded pronunciations removed. Use API to get word pronunciations.');
    return word.toLowerCase();
  }

  // Pronunciation must be fetched via API - no hardcoded pronunciations
  getEnglishPronunciation(word) {
    console.warn('Hardcoded pronunciations removed. Use API to get word pronunciations.');
    return word.toLowerCase();
  }

  // Difficulty level must be determined via API - no hardcoded word lists
  estimateLevel(word) {
    console.warn('Hardcoded difficulty estimation removed. Use API to determine word difficulty.');
    // Simple heuristic based only on word length as last resort
    if (word.length <= 3) return 1;
    if (word.length <= 6) return 3;
    return 5;
  }

  // Clear cache (useful for memory management)
  clearCache() {
    this.cache.clear();
  }
}

// Create singleton instance
const translationService = new TranslationService();

export default translationService;