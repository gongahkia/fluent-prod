// Translation Service using multiple APIs and fallbacks
// This provides real-time translation without hardcoding

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
      'ugly': '醜い',
      'hot': '熱い',
      'cold': '冷たい',
      'new': '新しい',
      'old': '古い',
      'young': '若い',
      'fast': '速い',
      'slow': '遅い',
      'easy': '簡単',
      'difficult': '難しい',
      'hard': '難しい',
      'soft': '柔らかい',
      'happy': '幸せ',
      'sad': '悲しい',
      'angry': '怒っている',
      'tired': '疲れている',
      'hungry': 'お腹が空いている',
      'thirsty': '喉が渇いている',
      
      // Nouns
      'person': '人',
      'people': '人々',
      'man': '男性',
      'woman': '女性',
      'child': '子供',
      'family': '家族',
      'friend': '友達',
      'house': '家',
      'home': '家',
      'school': '学校',
      'work': '仕事',
      'job': '仕事',
      'car': '車',
      'train': '電車',
      'bus': 'バス',
      'food': '食べ物',
      'water': '水',
      'money': 'お金',
      'time': '時間',
      'day': '日',
      'night': '夜',
      'morning': '朝',
      'afternoon': '午後',
      'evening': '夕方',
      'week': '週',
      'month': '月',
      'year': '年',
      'country': '国',
      'city': '都市',
      'town': '町',
      'place': '場所',
      'world': '世界',
      'earth': '地球',
      'sky': '空',
      'sun': '太陽',
      'moon': '月',
      'star': '星',
      'book': '本',
      'phone': '電話',
      'computer': 'コンピューター',
      'internet': 'インターネット',
      'music': '音楽',
      'movie': '映画',
      'game': 'ゲーム',
      'sport': 'スポーツ',
      'love': '愛',
      'life': '人生',
      'death': '死',
      'health': '健康',
      'peace': '平和',
      'war': '戦争',
      'nature': '自然',
      'animal': '動物',
      'plant': '植物',
      'tree': '木',
      'flower': '花',
      'color': '色',
      'red': '赤',
      'blue': '青',
      'green': '緑',
      'yellow': '黄色',
      'black': '黒',
      'white': '白',
      
      // Specific to the application
      'sakura': '桜',
      'season': '季節',
      'Japan': '日本',
      'Japanese': '日本の',
      'Tokyo': '東京',
      'Osaka': '大阪',
      'Kyoto': '京都',
      'culture': '文化',
      'tradition': '伝統',
      'modern': '現代の',
      'ancient': '古代の',
      'festival': '祭り',
      'temple': '寺',
      'shrine': '神社',
      'ramen': 'ラーメン',
      'sushi': '寿司',
      'tempura': '天ぷら',
      'rice': 'ご飯',
      'tea': 'お茶',
      'coffee': 'コーヒー',
      'restaurant': 'レストラン',
      'hotel': 'ホテル',
      'station': '駅',
      'airport': '空港',
      'tourist': '観光客',
      'travel': '旅行',
      'vacation': '休暇',
      'business': 'ビジネス',
      'company': '会社',
      'office': 'オフィス',
      'meeting': '会議',
      'project': 'プロジェクト',
      'technology': '技術',
      'innovation': '革新',
      'future': '未来',
      'past': '過去',
      'present': '現在',
      'history': '歴史',
      'art': '芸術',
      'dance': '踊り',
      'painting': '絵画',
      'sculpture': '彫刻',
      'photography': '写真',
      'fashion': 'ファッション',
      'style': 'スタイル',
      'design': 'デザイン',
      'architecture': '建築',
      'building': '建物',
      'bridge': '橋',
      'road': '道路',
      'street': '通り',
      'park': '公園',
      'garden': '庭',
      'mountain': '山',
      'river': '川',
      'sea': '海',
      'ocean': '海洋',
      'beach': 'ビーチ',
      'island': '島',
      'forest': '森',
      'desert': '砂漠',
      'weather': '天気',
      'rain': '雨',
      'snow': '雪',
      'wind': '風',
      'storm': '嵐',
      'earthquake': '地震',
      'fire': '火',
      'air': '空気',
      'ground': '土',
      'metal': '金属',
      'wood': '木',
      'stone': '石',
      'glass': 'ガラス',
      'plastic': 'プラスチック',
      'paper': '紙',
      'cloth': '布',
      'leather': '革',
      'silk': '絹',
      'cotton': '綿',
      'wool': '羊毛'
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
      '季節': 'season'
    };

    let result = text;
    Object.keys(translations).forEach(japaneseWord => {
      const regex = new RegExp(japaneseWord, 'g');
      result = result.replace(regex, translations[japaneseWord]);
    });

    return result;
  }

  // Get word definition with pronunciation
  async getWordDefinition(word, fromLang = 'en') {
    try {
      // For Japanese words, try to get reading (hiragana/katakana)
      if (fromLang === 'ja') {
        return await this.getJapaneseWordInfo(word);
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
    // This could be enhanced with a Japanese dictionary API
    // For now, return basic structure
    return {
      word: word,
      reading: this.getBasicReading(word),
      translation: await this.translateText(word, 'ja', 'en'),
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
    // This is a simplified version - in production, you'd use a proper Japanese dictionary API
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
      '時間': 'じかん'
    };
    
    return readings[word] || word;
  }

  // Basic English pronunciation (katakana)
  getEnglishPronunciation(word) {
    const pronunciations = {
      'thank': 'さんく',
      'hello': 'はろー',
      'beautiful': 'びゅーてぃふる',
      'sakura': 'さくら',
      'season': 'しーずん',
      'legendary': 'れじぇんだりー',
      'special': 'すぺしゃる',
      'valuable': 'ばりゅあぶる'
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

  // NEW METHOD: Create mixed English/Japanese text based on user level
  async createMixedLanguageContent(text, userLevel = 5) {
    if (!text || typeof text !== 'string') return text;

    // Calculate percentage of words to translate based on user level
    // Level 1-2: 10-20% Japanese, Level 3-4: 30-40%, Level 5-6: 50-60%,
    // Level 7-8: 70-80%, Level 9-10: 90-95%
    const getTranslationPercentage = (level) => {
      const levelNum = parseInt(level);
      if (levelNum <= 2) return 0.15; // 15%
      if (levelNum <= 4) return 0.35; // 35%
      if (levelNum <= 6) return 0.55; // 55%
      if (levelNum <= 8) return 0.75; // 75%
      return 0.90; // 90%
    };

    const translationPercentage = getTranslationPercentage(userLevel);

    // Split text into sentences to maintain readability
    const sentences = text.split(/(?<=[.!?])\s+/);
    const processedSentences = [];

    for (const sentence of sentences) {
      const processedSentence = await this.processSentenceForMixedContent(
        sentence,
        translationPercentage
      );
      processedSentences.push(processedSentence);
    }

    return processedSentences.join(' ');
  }

  // Process a single sentence for mixed content
  async processSentenceForMixedContent(sentence, translationPercentage) {
    // Split sentence into words while preserving punctuation
    const wordPattern = /(\b\w+\b|\s+|[^\w\s])/g;
    const tokens = sentence.match(wordPattern) || [];

    // Filter to get only actual words (not spaces or punctuation)
    const wordTokens = tokens.filter(token => /^\w+$/.test(token));

    // Determine which words to translate
    const wordsToTranslate = await this.selectWordsForTranslation(
      wordTokens,
      translationPercentage
    );

    // Process each token
    const processedTokens = [];
    for (const token of tokens) {
      if (/^\w+$/.test(token) && wordsToTranslate.has(token.toLowerCase())) {
        // Translate this word to Japanese
        const translation = await this.translateWordToJapanese(token);
        processedTokens.push(translation);
      } else {
        // Keep original token (word, space, or punctuation)
        processedTokens.push(token);
      }
    }

    return processedTokens.join('');
  }

  // Enhanced word selection using vocabulary service for better NER-based selection
  async selectWordsForTranslation(words, percentage) {
    const wordsToTranslate = new Set();

    // Import vocabulary service for word validation
    const { default: vocabularyService } = await import('./vocabularyService');

    // Prioritize vocabulary words (these are the words that should be highlighted in green)
    const vocabularyWords = [];
    const nonVocabularyWords = [];

    for (const word of words) {
      if (vocabularyService.isValidVocabularyWord(word)) {
        vocabularyWords.push(word);
      } else {
        nonVocabularyWords.push(word);
      }
    }

    // Calculate how many words to translate
    const totalWords = words.length;
    const targetCount = Math.floor(totalWords * percentage);

    // First, prioritize vocabulary words (these are the meaningful learning words)
    let count = 0;
    for (const word of vocabularyWords) {
      if (count >= targetCount) break;
      wordsToTranslate.add(word.toLowerCase());
      count++;
    }

    // If we still need more words, add some non-vocabulary words
    if (count < targetCount) {
      // Define word difficulty categories for non-vocabulary words
      const veryCommon = ['the', 'is', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an'];
      const common = ['good', 'bad', 'big', 'small', 'new', 'old', 'hot', 'cold', 'have', 'has', 'do', 'does', 'can', 'will'];

      // Categorize non-vocabulary words
      const categorizedWords = {
        common: nonVocabularyWords.filter(word => common.includes(word.toLowerCase())),
        veryCommon: nonVocabularyWords.filter(word => veryCommon.includes(word.toLowerCase())),
        other: nonVocabularyWords.filter(word =>
          !veryCommon.includes(word.toLowerCase()) &&
          !common.includes(word.toLowerCase()) &&
          word.length > 2
        )
      };

      // Add other words first (more interesting than very common words)
      for (const word of categorizedWords.other) {
        if (count >= targetCount) break;
        wordsToTranslate.add(word.toLowerCase());
        count++;
      }

      // Then common words
      for (const word of categorizedWords.common) {
        if (count >= targetCount) break;
        wordsToTranslate.add(word.toLowerCase());
        count++;
      }

      // Finally very common words (only if absolutely needed)
      for (const word of categorizedWords.veryCommon) {
        if (count >= targetCount) break;
        wordsToTranslate.add(word.toLowerCase());
        count++;
      }
    }

    return wordsToTranslate;
  }

  // Translate a single English word to Japanese
  async translateWordToJapanese(word) {
    const cleanWord = word.toLowerCase().trim();

    // Use existing translation dictionary first for consistency
    const basicTranslations = {
      // Common words
      'the': 'その',
      'is': 'です',
      'and': 'と',
      'or': 'または',
      'but': 'でも',
      'in': 'に',
      'on': 'で',
      'at': 'で',
      'to': 'に',
      'for': 'ため',
      'of': 'の',
      'with': 'と',
      'by': 'によって',
      'a': 'ひとつの',
      'an': 'ひとつの',

      // Verbs
      'have': '持つ',
      'has': '持つ',
      'do': 'する',
      'does': 'する',
      'can': 'できる',
      'will': 'でしょう',
      'would': 'でしょう',
      'should': 'すべき',
      'must': 'しなければ',

      // Adjectives
      'good': '良い',
      'bad': '悪い',
      'big': '大きい',
      'small': '小さい',
      'beautiful': '美しい',
      'hot': '熱い',
      'cold': '冷たい',
      'new': '新しい',
      'old': '古い',
      'young': '若い',
      'fast': '速い',
      'slow': '遅い',
      'easy': '簡単',
      'difficult': '難しい',
      'hard': '難しい',
      'happy': '幸せ',
      'sad': '悲しい',

      // Nouns
      'person': '人',
      'people': '人々',
      'man': '男性',
      'woman': '女性',
      'child': '子供',
      'family': '家族',
      'friend': '友達',
      'house': '家',
      'home': '家',
      'school': '学校',
      'work': '仕事',
      'job': '仕事',
      'car': '車',
      'food': '食べ物',
      'water': '水',
      'money': 'お金',
      'time': '時間',
      'day': '日',
      'night': '夜',
      'country': '国',
      'city': '都市',
      'world': '世界',
      'book': '本',
      'phone': '電話',
      'computer': 'コンピューター',
      'music': '音楽',
      'movie': '映画',
      'game': 'ゲーム',
      'culture': '文化',
      'tradition': '伝統',
      'modern': '現代の',
      'business': 'ビジネス',
      'technology': '技術',
      'important': '重要',
      'interesting': '面白い',
      'different': '違う',
      'similar': '似ている',
      'special': '特別',
      'popular': '人気',
      'famous': '有名',
      'local': '地元の',
      'international': '国際的'
    };

    // Check if we have a direct translation
    if (basicTranslations[cleanWord]) {
      return basicTranslations[cleanWord];
    }

    // For unknown words, try API translation
    try {
      const translation = await this.translateText(cleanWord, 'en', 'ja');
      if (translation && translation !== cleanWord) {
        return translation;
      }
    } catch (error) {
      console.warn('Translation failed for word:', cleanWord, error);
    }

    // Fallback: return original word
    return word;
  }

  // Utility method to check if text contains Japanese characters
  containsJapanese(text) {
    return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
  }

  // Utility method to check if text contains only English characters
  isEnglishOnly(text) {
    return /^[a-zA-Z\s.,!?;:"'()\[\]{}—–-]+$/.test(text);
  }
}

// Create singleton instance
const translationService = new TranslationService();

export default translationService;
