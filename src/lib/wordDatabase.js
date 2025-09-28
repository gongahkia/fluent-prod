import translationService from '../services/translationService';

// Shared multi-language word database for the entire application
// Enhanced with real-time translation API support for Japanese and Spanish

export const japaneseWords = {
  // Basic Japanese words
  '地': { japanese: '地', hiragana: 'ち', english: 'ground/earth', level: 2, example: '地元の人だけが知る', exampleEn: 'Only locals know' },
  'じ': { japanese: 'じ', hiragana: 'じ', english: 'ji (hiragana character)', level: 1, example: '先月、これらの場所の一つを訪問しました！', exampleEn: 'I visited one of these places last month!' },
  'ま': { japanese: 'ま', hiragana: 'ま', english: 'ma (hiragana character)', level: 1, example: '先月、これらの場所の一つを訪問しました！', exampleEn: 'I visited one of these places last month!' },
  'は': { japanese: 'は', hiragana: 'は', english: 'wa (topic particle)', level: 1, example: 'この場所は本当に本格的です！', exampleEn: 'This place is really authentic!' },
  'の': { japanese: 'の', hiragana: 'の', english: 'no (possessive particle)', level: 1, example: '地元の人だけが知る隠れた宝石ですね。', exampleEn: 'It\'s a hidden gem that only locals know about.' },
  'す': { japanese: 'す', hiragana: 'す', english: 'su (hiragana character, part of です)', level: 1, example: 'この場所は本当に本格的です！', exampleEn: 'This place is really authentic!' },
  '元': { japanese: '元', hiragana: 'もと', english: 'origin/source', level: 3, example: '地元の人だけが知る', exampleEn: 'Only locals know' },
  '人': { japanese: '人', hiragana: 'ひと', english: 'person/people', level: 1, example: '地元の人だけが知る', exampleEn: 'Only locals know' },
  '知': { japanese: '知', hiragana: 'し', english: 'know/knowledge', level: 2, example: '地元の人だけが知る', exampleEn: 'Only locals know' },
  '店': { japanese: '店', hiragana: 'みせ', english: 'shop/store', level: 2, example: 'ラーメン店', exampleEn: 'ramen shop' },
  '東': { japanese: '東', hiragana: 'ひがし', english: 'east', level: 2, example: '東京', exampleEn: 'Tokyo (Eastern capital)' },
  '京': { japanese: '京', hiragana: 'きょう', english: 'capital', level: 3, example: '東京', exampleEn: 'Tokyo (Eastern capital)' },

  // Compound Japanese words
  '地元': { japanese: '地元', hiragana: 'じもと', english: 'local', level: 3, example: '地元の人だけが知る', exampleEn: 'Only locals know' },
  'ラーメン': { japanese: 'ラーメン', hiragana: 'らーめん', english: 'ramen', level: 2, example: 'authentic ラーメンを提供', exampleEn: 'providing authentic ramen' },
  '東京': { japanese: '東京', hiragana: 'とうきょう', english: 'Tokyo', level: 1, example: '東京の最も busy な地区', exampleEn: 'Tokyo\'s busiest districts' },
  '文化': { japanese: '文化', hiragana: 'ぶんか', english: 'culture', level: 3, example: 'food culture を探索', exampleEn: 'exploring food culture' },
  '伝統': { japanese: '伝統', hiragana: 'でんとう', english: 'tradition', level: 3, example: 'blends 伝統 with', exampleEn: 'blends tradition with' },
  '桜': { japanese: '桜', hiragana: 'さくら', english: 'cherry blossom', level: 2, example: '桜の季節', exampleEn: 'cherry blossom season' },
  '季節': { japanese: '季節', hiragana: 'きせつ', english: 'season', level: 3, example: '桜の季節', exampleEn: 'cherry blossom season' },
  '原宿': { japanese: '原宿', hiragana: 'はらじゅく', english: 'Harajuku', level: 3, example: 'Street fashion の evolution in 原宿', exampleEn: 'Street fashion evolution in Harajuku' },
  '渋谷': { japanese: '渋谷', hiragana: 'しぶや', english: 'Shibuya', level: 3, example: '渋谷で会いましょう', exampleEn: 'Let\'s meet in Shibuya' },
  '大阪': { japanese: '大阪', hiragana: 'おおさか', english: 'Osaka', level: 2, example: '大阪\'s 創造性', exampleEn: 'Osaka\'s creativity' },
  '京都': { japanese: '京都', hiragana: 'きょうと', english: 'Kyoto', level: 2, example: '京都の伝統', exampleEn: 'Kyoto\'s tradition' },
  '美味しい': { japanese: '美味しい', hiragana: 'おいしい', english: 'delicious', level: 2, example: 'このラーメンはとても美味しいです。', exampleEn: 'This ramen is very delicious.' },
  '素晴らしい': { japanese: '素晴らしい', hiragana: 'すばらしい', english: 'wonderful', level: 6, example: '素晴らしい経験でした。', exampleEn: 'It was a wonderful experience.' },
  '興味深い': { japanese: '興味深い', hiragana: 'きょうみぶかい', english: 'interesting', level: 7, example: 'とても興味深い話でした。', exampleEn: 'It was a very interesting story.' },
  '新しい': { japanese: '新しい', hiragana: 'あたらしい', english: 'new', level: 1, example: '新しいレストランに行きました。', exampleEn: 'I went to a new restaurant.' },
  '古い': { japanese: '古い', hiragana: 'ふるい', english: 'old', level: 2, example: 'respecting 古い ones', exampleEn: 'respecting old ones' },
  '生活': { japanese: '生活', hiragana: 'せいかつ', english: 'life/lifestyle', level: 3, example: 'new generation の生活 style', exampleEn: 'new generation\'s lifestyle' },
  '日本': { japanese: '日本', hiragana: 'にほん', english: 'Japan', level: 1, example: 'how 日本 blends', exampleEn: 'how Japan blends' }
};

export const spanishWords = {
  // Basic Spanish words
  'el': { spanish: 'el', pronunciation: 'el', english: 'the (masculine)', level: 1, example: 'El restaurante es bueno', exampleEn: 'The restaurant is good' },
  'la': { spanish: 'la', pronunciation: 'la', english: 'the (feminine)', level: 1, example: 'La paella está deliciosa', exampleEn: 'The paella is delicious' },
  'un': { spanish: 'un', pronunciation: 'oon', english: 'a/an (masculine)', level: 1, example: 'Un lugar especial', exampleEn: 'A special place' },
  'una': { spanish: 'una', pronunciation: 'oo-na', english: 'a/an (feminine)', level: 1, example: 'Una experiencia maravillosa', exampleEn: 'A wonderful experience' },
  'es': { spanish: 'es', pronunciation: 'es', english: 'is', level: 1, example: 'Es muy interesante', exampleEn: 'It is very interesting' },
  'son': { spanish: 'son', pronunciation: 'son', english: 'are', level: 1, example: 'Son tradiciones importantes', exampleEn: 'They are important traditions' },
  'muy': { spanish: 'muy', pronunciation: 'moo-ee', english: 'very', level: 1, example: 'Muy delicioso', exampleEn: 'Very delicious' },
  'de': { spanish: 'de', pronunciation: 'de', english: 'of/from', level: 1, example: 'De España', exampleEn: 'From Spain' },
  'en': { spanish: 'en', pronunciation: 'en', english: 'in/on', level: 1, example: 'En Madrid', exampleEn: 'In Madrid' },
  'y': { spanish: 'y', pronunciation: 'ee', english: 'and', level: 1, example: 'Tradición y modernidad', exampleEn: 'Tradition and modernity' },

  // Compound Spanish words and phrases
  'paella': { spanish: 'paella', pronunciation: 'pa-eh-ya', english: 'paella', level: 3, example: 'Comimos paella en Valencia', exampleEn: 'We ate paella in Valencia' },
  'tapas': { spanish: 'tapas', pronunciation: 'ta-pas', english: 'tapas', level: 2, example: 'Las tapas son deliciosas', exampleEn: 'The tapas are delicious' },
  'flamenco': { spanish: 'flamenco', pronunciation: 'fla-men-ko', english: 'flamenco', level: 3, example: 'El flamenco es una tradición', exampleEn: 'Flamenco is a tradition' },
  'cultura': { spanish: 'cultura', pronunciation: 'kool-too-rah', english: 'culture', level: 5, example: 'La cultura española es rica', exampleEn: 'Spanish culture is rich' },
  'tradición': { spanish: 'tradición', pronunciation: 'tra-di-see-on', english: 'tradition', level: 8, example: 'Una tradición muy antigua', exampleEn: 'A very ancient tradition' },
  'local': { spanish: 'local', pronunciation: 'lo-kal', english: 'local', level: 4, example: 'La gente local es amable', exampleEn: 'Local people are friendly' },
  'delicioso': { spanish: 'delicioso', pronunciation: 'de-li-see-oh-so', english: 'delicious', level: 2, example: 'Esta comida está deliciosa', exampleEn: 'This food is delicious' },
  'maravilloso': { spanish: 'maravilloso', pronunciation: 'ma-ra-bee-yo-so', english: 'wonderful', level: 6, example: 'Un lugar maravilloso', exampleEn: 'A wonderful place' },
  'interesante': { spanish: 'interesante', pronunciation: 'in-te-re-san-te', english: 'interesting', level: 7, example: 'Una historia interesante', exampleEn: 'An interesting story' },
  'auténtico': { spanish: 'auténtico', pronunciation: 'ow-ten-ti-ko', english: 'authentic', level: 8, example: 'Comida auténtica española', exampleEn: 'Authentic Spanish food' },
  'nuevo': { spanish: 'nuevo', pronunciation: 'nue-bo', english: 'new', level: 1, example: 'Un restaurante nuevo', exampleEn: 'A new restaurant' },
  'viejo': { spanish: 'viejo', pronunciation: 'bee-eh-ho', english: 'old', level: 2, example: 'Un edificio viejo', exampleEn: 'An old building' },
  'España': { spanish: 'España', pronunciation: 'es-pa-nya', english: 'Spain', level: 1, example: 'España es hermosa', exampleEn: 'Spain is beautiful' },
  'Madrid': { spanish: 'Madrid', pronunciation: 'ma-drid', english: 'Madrid', level: 1, example: 'Madrid es la capital', exampleEn: 'Madrid is the capital' },
  'Barcelona': { spanish: 'Barcelona', pronunciation: 'bar-se-lo-na', english: 'Barcelona', level: 1, example: 'Barcelona tiene playa', exampleEn: 'Barcelona has beach' },
  'Sevilla': { spanish: 'Sevilla', pronunciation: 'se-bee-ya', english: 'Seville', level: 2, example: 'Sevilla es famosa por el flamenco', exampleEn: 'Seville is famous for flamenco' },
  'Valencia': { spanish: 'Valencia', pronunciation: 'ba-len-see-a', english: 'Valencia', level: 2, example: 'Valencia es el origen de la paella', exampleEn: 'Valencia is the origin of paella' },
  'comida': { spanish: 'comida', pronunciation: 'ko-mee-da', english: 'food', level: 2, example: 'La comida española es variada', exampleEn: 'Spanish food is varied' },
  'restaurante': { spanish: 'restaurante', pronunciation: 're-stow-ran-te', english: 'restaurant', level: 3, example: 'Un restaurante típico', exampleEn: 'A typical restaurant' },
  'experiencia': { spanish: 'experiencia', pronunciation: 'eks-pe-ree-en-see-a', english: 'experience', level: 5, example: 'Una experiencia única', exampleEn: 'A unique experience' },
  'gente': { spanish: 'gente', pronunciation: 'hen-te', english: 'people', level: 2, example: 'La gente es muy amable', exampleEn: 'People are very friendly' },
  'lugar': { spanish: 'lugar', pronunciation: 'loo-gar', english: 'place', level: 2, example: 'Un lugar especial', exampleEn: 'A special place' }
};

// All translations must go through API - no hardcoded fallbacks
const getBasicEnglishTranslation = async (word, targetLang = 'ja') => {
  console.warn('Hardcoded translation dictionaries removed. Using API for all translations.');
  try {
    return await translationService.translateText(word, 'en', targetLang);
  } catch (error) {
    console.error('Translation API failed:', error);
    return `[Translation needed: ${word}]`;
  }
};

// Function to handle word clicks with real-time translation API
export const handleWordClick = async (word, setSelectedWord, language = 'japanese', context = null, contextTranslation = null) => {
  // Determine source and target languages
  const isTargetLanguage = language === 'japanese'
    ? /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(word)
    : /[ñáéíóúü]/.test(word) || (language === 'spanish' && !/^[A-Za-z\s]*$/.test(word));

  const fromLang = isTargetLanguage ? (language === 'japanese' ? 'ja' : 'es') : 'en';
  const toLang = isTargetLanguage ? 'en' : (language === 'japanese' ? 'ja' : 'es');

  // Clean the word (remove punctuation)
  const cleanWord = word.replace(/[。、！？¡¿.,!?]/g, '');

  // Check existing database first
  const wordDatabase = language === 'japanese' ? japaneseWords : spanishWords;
  const wordData = wordDatabase[cleanWord];

  if (wordData) {
    // Use existing database entry if available
    setSelectedWord({
      ...wordData,
      original: cleanWord,
      isTargetLanguage: isTargetLanguage,
      language: language
    });
  } else {
    // Use translation API for unknown words
    try {
      console.log(`Translating word: ${cleanWord} using API...`);

      let translation, pronunciation, contextTranslationResult;

      if (isTargetLanguage) {
        // Target language to English
        translation = await translationService.translateText(cleanWord, fromLang, toLang);

        if (language === 'japanese') {
          pronunciation = translationService.getBasicReading(cleanWord);
        } else {
          pronunciation = translationService.getSpanishPronunciation(cleanWord);
        }

        if (context && !contextTranslation) {
          contextTranslationResult = await translationService.translateText(context, fromLang, toLang);
        }
      } else {
        // English to target language
        translation = await translationService.translateText(cleanWord, fromLang, toLang);

        if (language === 'japanese') {
          pronunciation = translationService.getEnglishPronunciation(cleanWord);
        } else {
          pronunciation = translationService.getSpanishPronunciation(translation);
        }

        if (context && !contextTranslation) {
          contextTranslationResult = await translationService.translateText(context, fromLang, toLang);
        }
      }

      const level = translationService.estimateLevel(cleanWord);

      const wordInfo = {
        original: cleanWord,
        level: level,
        example: context || `Example with "${cleanWord}".`,
        exampleEn: contextTranslationResult || (isTargetLanguage ? `Example with ${cleanWord}.` : `Example with "${cleanWord}".`),
        isTargetLanguage: isTargetLanguage,
        language: language,
        isApiTranslated: true // Flag to indicate this came from API
      };

      if (language === 'japanese') {
        wordInfo.japanese = isTargetLanguage ? cleanWord : cleanWord;
        wordInfo.hiragana = pronunciation;
        wordInfo.english = translation;
      } else {
        wordInfo.spanish = isTargetLanguage ? cleanWord : translation;
        wordInfo.pronunciation = pronunciation;
        wordInfo.english = isTargetLanguage ? translation : cleanWord;
      }

      setSelectedWord(wordInfo);

    } catch (error) {
      console.error('Translation API failed:', error);

      // Fallback to basic translation if API fails
      const basicTranslation = isTargetLanguage
        ? (language === 'japanese' ? 'Japanese word' : 'Spanish word')
        : getBasicEnglishTranslation(cleanWord, language === 'japanese' ? 'ja' : 'es');

      const basicPronunciation = isTargetLanguage ? cleanWord : cleanWord.toLowerCase();

      const fallbackInfo = {
        original: cleanWord,
        level: 5,
        example: context || `Example with "${cleanWord}".`,
        exampleEn: context || `Example with "${cleanWord}".`,
        isTargetLanguage: isTargetLanguage,
        language: language,
        isApiFallback: true // Flag to indicate API failed
      };

      if (language === 'japanese') {
        fallbackInfo.japanese = cleanWord;
        fallbackInfo.hiragana = basicPronunciation;
        fallbackInfo.english = basicTranslation;
      } else {
        fallbackInfo.spanish = isTargetLanguage ? cleanWord : basicTranslation;
        fallbackInfo.pronunciation = basicPronunciation;
        fallbackInfo.english = isTargetLanguage ? basicTranslation : cleanWord;
      }

      setSelectedWord(fallbackInfo);
    }
  }
};

// Function to add word to dictionary
export const addWordToDictionary = (selectedWord, userDictionary, setUserDictionary, setFeedbackMessage, setShowFeedback) => {
  if (selectedWord) {
    let wordToAdd;

    if (selectedWord.language === 'japanese') {
      wordToAdd = {
        id: Date.now(),
        japanese: selectedWord.isTargetLanguage ? selectedWord.japanese : selectedWord.english,
        hiragana: selectedWord.hiragana,
        english: selectedWord.isTargetLanguage ? selectedWord.english : selectedWord.japanese,
        level: selectedWord.level,
        example: selectedWord.example,
        exampleEn: selectedWord.exampleEn,
        source: "LivePeek",
        dateAdded: new Date().toISOString()
      };
    } else {
      wordToAdd = {
        id: Date.now(),
        spanish: selectedWord.isTargetLanguage ? selectedWord.spanish : selectedWord.english,
        pronunciation: selectedWord.pronunciation,
        english: selectedWord.isTargetLanguage ? selectedWord.english : selectedWord.spanish,
        level: selectedWord.level,
        example: selectedWord.example,
        exampleEn: selectedWord.exampleEn,
        source: "LivePeek",
        dateAdded: new Date().toISOString()
      };
    }

    // Check if word already exists
    const wordKey = selectedWord.language === 'japanese' ? 'japanese' : 'spanish';
    const wordExists = userDictionary.some(word => word[wordKey] === wordToAdd[wordKey]);

    if (!wordExists) {
      setUserDictionary(prev => [...prev, wordToAdd]);
      setFeedbackMessage({
        icon: "📚",
        message: "Added to your dictionary!"
      });
    } else {
      setFeedbackMessage({
        icon: "ℹ️",
        message: "Already in your dictionary"
      });
    }

    setShowFeedback(true);
    setTimeout(() => {
      setShowFeedback(false);
      setFeedbackMessage(null);
    }, 2000);
  }
};