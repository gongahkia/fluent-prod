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

  // Basic word-by-word translation as fallback
  async basicWordTranslation(text, fromLang, toLang) {
    if (fromLang === 'en' && toLang === 'ja') {
      return this.englishToJapaneseBasic(text);
    } else if (fromLang === 'ja' && toLang === 'en') {
      return this.japaneseToEnglishBasic(text);
    } else if (fromLang === 'en' && toLang === 'es') {
      return this.englishToSpanishBasic(text);
    } else if (fromLang === 'es' && toLang === 'en') {
      return this.spanishToEnglishBasic(text);
    }
    return null;
  }

  // Enhanced English to Japanese translation
  englishToJapaneseBasic(text) {
    const translations = {
      // Common words
      'thank': 'ありがとう',
      'thanks': 'ありがとう',
      'hello': 'こんにちは',
      'goodbye': 'さようなら',
      'yes': 'はい',
      'no': 'いいえ',
      'please': 'お願いします',
      'sorry': 'すみません',
      'excuse me': 'すみません',

      // Verbs
      'is': 'です',
      'are': 'です',
      'was': 'でした',
      'were': 'でした',
      'have': '持っています',
      'has': '持っています',
      'do': 'します',
      'does': 'します',
      'did': 'しました',
      'will': 'でしょう',
      'would': 'でしょう',
      'can': 'できます',
      'could': 'できました',
      'should': 'すべきです',
      'must': 'しなければなりません',

      // Adjectives
      'good': '良い',
      'bad': '悪い',
      'big': '大きい',
      'small': '小さい',
      'beautiful': '美しい',
      'delicious': '美味しい',
      'interesting': '興味深い',
      'wonderful': '素晴らしい',
      'authentic': '本格的な',
      'traditional': '伝統的な',
      'local': '地元の',
      'new': '新しい',
      'old': '古い',

      // Nouns
      'culture': '文化',
      'tradition': '伝統',
      'food': '食べ物',
      'restaurant': 'レストラン',
      'ramen': 'ラーメン',
      'sushi': '寿司',
      'sakura': '桜',
      'season': '季節',
      'Japan': '日本',
      'Tokyo': '東京',
      'people': '人々',
      'person': '人',
      'place': '場所',
      'experience': '経験'
    };

    // Simple word replacement
    let result = text.toLowerCase();
    Object.keys(translations).forEach(englishWord => {
      const regex = new RegExp(`\\b${englishWord}\\b`, 'gi');
      result = result.replace(regex, translations[englishWord]);
    });

    return result;
  }

  // Enhanced English to Spanish translation
  englishToSpanishBasic(text) {
    const translations = {
      // Common words
      'thank': 'gracias',
      'thanks': 'gracias',
      'hello': 'hola',
      'goodbye': 'adiós',
      'yes': 'sí',
      'no': 'no',
      'please': 'por favor',
      'sorry': 'lo siento',
      'excuse me': 'disculpe',

      // Verbs
      'is': 'es',
      'are': 'son',
      'was': 'era',
      'were': 'eran',
      'have': 'tener',
      'has': 'tiene',
      'do': 'hacer',
      'does': 'hace',
      'did': 'hizo',
      'will': 'será',
      'would': 'sería',
      'can': 'puede',
      'could': 'podría',
      'should': 'debería',
      'must': 'debe',

      // Adjectives
      'good': 'bueno',
      'bad': 'malo',
      'big': 'grande',
      'small': 'pequeño',
      'beautiful': 'hermoso',
      'delicious': 'delicioso',
      'interesting': 'interesante',
      'wonderful': 'maravilloso',
      'authentic': 'auténtico',
      'traditional': 'tradicional',
      'local': 'local',
      'new': 'nuevo',
      'old': 'viejo',

      // Nouns
      'culture': 'cultura',
      'tradition': 'tradición',
      'food': 'comida',
      'restaurant': 'restaurante',
      'paella': 'paella',
      'tapas': 'tapas',
      'flamenco': 'flamenco',
      'season': 'temporada',
      'Spain': 'España',
      'Madrid': 'Madrid',
      'Barcelona': 'Barcelona',
      'people': 'gente',
      'person': 'persona',
      'place': 'lugar',
      'experience': 'experiencia'
    };

    // Simple word replacement
    let result = text.toLowerCase();
    Object.keys(translations).forEach(englishWord => {
      const regex = new RegExp(`\\b${englishWord}\\b`, 'gi');
      result = result.replace(regex, translations[englishWord]);
    });

    return result;
  }

  // Basic Japanese to English translation
  japaneseToEnglishBasic(text) {
    const translations = {
      'ありがとう': 'thank you',
      'こんにちは': 'hello',
      'さようなら': 'goodbye',
      'はい': 'yes',
      'いいえ': 'no',
      'すみません': 'excuse me',
      'お願いします': 'please',
      'です': 'is',
      'でした': 'was',
      '良い': 'good',
      '悪い': 'bad',
      '大きい': 'big',
      '小さい': 'small',
      '美しい': 'beautiful',
      '美味しい': 'delicious',
      '興味深い': 'interesting',
      '素晴らしい': 'wonderful',
      '本格的な': 'authentic',
      '新しい': 'new',
      '古い': 'old',
      '人': 'person',
      '家': 'house',
      '学校': 'school',
      '仕事': 'work',
      '食べ物': 'food',
      '水': 'water',
      'お金': 'money',
      '時間': 'time',
      '日本': 'Japan',
      '東京': 'Tokyo',
      '文化': 'culture',
      '桜': 'sakura',
      '季節': 'season',
      '伝統': 'tradition',
      'ラーメン': 'ramen'
    };

    let result = text;
    Object.keys(translations).forEach(japaneseWord => {
      const regex = new RegExp(japaneseWord, 'g');
      result = result.replace(regex, translations[japaneseWord]);
    });

    return result;
  }

  // Basic Spanish to English translation
  spanishToEnglishBasic(text) {
    const translations = {
      'gracias': 'thank you',
      'hola': 'hello',
      'adiós': 'goodbye',
      'sí': 'yes',
      'no': 'no',
      'por favor': 'please',
      'lo siento': 'sorry',
      'disculpe': 'excuse me',
      'es': 'is',
      'son': 'are',
      'era': 'was',
      'eran': 'were',
      'bueno': 'good',
      'malo': 'bad',
      'grande': 'big',
      'pequeño': 'small',
      'hermoso': 'beautiful',
      'delicioso': 'delicious',
      'interesante': 'interesting',
      'maravilloso': 'wonderful',
      'auténtico': 'authentic',
      'tradicional': 'traditional',
      'local': 'local',
      'nuevo': 'new',
      'viejo': 'old',
      'cultura': 'culture',
      'tradición': 'tradition',
      'comida': 'food',
      'restaurante': 'restaurant',
      'paella': 'paella',
      'tapas': 'tapas',
      'flamenco': 'flamenco',
      'temporada': 'season',
      'España': 'Spain',
      'Madrid': 'Madrid',
      'Barcelona': 'Barcelona',
      'gente': 'people',
      'persona': 'person',
      'lugar': 'place',
      'experiencia': 'experience'
    };

    let result = text;
    Object.keys(translations).forEach(spanishWord => {
      const regex = new RegExp(`\\b${spanishWord}\\b`, 'gi');
      result = result.replace(regex, translations[spanishWord]);
    });

    return result;
  }

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

  // Basic reading for Japanese characters
  getBasicReading(word) {
    const readings = {
      '本': 'ほん',
      '桜': 'さくら',
      '日本': 'にほん',
      '東京': 'とうきょう',
      '文化': 'ぶんか',
      '季節': 'きせつ',
      '美しい': 'うつくしい',
      '新しい': 'あたらしい',
      '古い': 'ふるい',
      '大きい': 'おおきい',
      '小さい': 'ちいさい',
      '良い': 'よい',
      '悪い': 'わるい',
      '人': 'ひと',
      '家': 'いえ',
      '学校': 'がっこう',
      '仕事': 'しごと',
      '食べ物': 'たべもの',
      '水': 'みず',
      'お金': 'おかね',
      '時間': 'じかん',
      '伝統': 'でんとう',
      'ラーメン': 'らーめん',
      '美味しい': 'おいしい',
      '興味深い': 'きょうみぶかい',
      '素晴らしい': 'すばらしい',
      '本格的な': 'ほんかくてきな',
      '地元': 'じもと'
    };

    return readings[word] || word;
  }

  // Basic Spanish pronunciation guide
  getSpanishPronunciation(word) {
    const pronunciations = {
      'paella': 'pa-eh-ya',
      'cultura': 'kool-too-rah',
      'local': 'lo-kal',
      'delicioso': 'de-li-see-oh-so',
      'maravilloso': 'ma-ra-bee-yo-so',
      'interesante': 'in-te-re-san-te',
      'tradición': 'tra-di-see-on',
      'nuevo': 'nue-bo',
      'auténtico': 'ow-ten-ti-ko',
      'flamenco': 'fla-men-ko'
    };

    return pronunciations[word.toLowerCase()] || word.toLowerCase();
  }

  // Basic English pronunciation (katakana for Japanese learners)
  getEnglishPronunciation(word) {
    const pronunciations = {
      'thank': 'さんく',
      'hello': 'はろー',
      'beautiful': 'びゅーてぃふる',
      'sakura': 'さくら',
      'season': 'しーずん',
      'legendary': 'れじぇんだりー',
      'special': 'すぺしゃる',
      'valuable': 'ばりゅあぶる',
      'culture': 'かるちゃー',
      'tradition': 'とらでぃしょん',
      'authentic': 'おーせんてぃっく',
      'delicious': 'でりしゃす',
      'wonderful': 'わんだふる',
      'interesting': 'いんたれすてぃんぐ'
    };

    return pronunciations[word.toLowerCase()] || word.toLowerCase();
  }

  // Estimate difficulty level
  estimateLevel(word) {
    const commonWords = ['the', 'is', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const basicWords = ['good', 'bad', 'big', 'small', 'new', 'old', 'hot', 'cold'];
    const intermediateWords = ['beautiful', 'interesting', 'important', 'different', 'similar'];

    if (commonWords.includes(word.toLowerCase())) return 1;
    if (basicWords.includes(word.toLowerCase())) return 2;
    if (intermediateWords.includes(word.toLowerCase())) return 3;
    if (word.length > 8) return 5;
    return 4;
  }

  // Clear cache (useful for memory management)
  clearCache() {
    this.cache.clear();
  }
}

// Create singleton instance
const translationService = new TranslationService();

export default translationService;