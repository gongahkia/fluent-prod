import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, CheckCircle, XCircle, Star, Sparkles } from 'lucide-react';

const Flashcards = ({ onBack, selectedLanguage, isEmbedded = false, userDictionary }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [progress, setProgress] = useState({});
  const [studyMode, setStudyMode] = useState('all'); // 'all', 'new', 'review'
  const [localUserDictionary, setLocalUserDictionary] = useState([]);

  // Load user dictionary from localStorage or props
  useEffect(() => {
    const savedDictionary = localStorage.getItem(`livepeek_dictionary_${selectedLanguage}`);
    if (savedDictionary) {
      setLocalUserDictionary(JSON.parse(savedDictionary));
    } else if (userDictionary && userDictionary.length > 0) {
      setLocalUserDictionary(userDictionary);
    }
  }, [selectedLanguage, userDictionary]);

  // Convert user dictionary to flashcard format
  const createFlashcardsFromDictionary = () => {
    if (!localUserDictionary || localUserDictionary.length === 0) {
      return [];
    }

    return localUserDictionary.map(word => {
      if (selectedLanguage === 'japanese') {
        return {
          id: word.id || Date.now() + Math.random(),
          word: word.japanese,
          reading: word.hiragana,
          meaning: word.english,
          example: word.example,
          exampleTranslation: word.exampleEn,
          level: word.level,
          source: word.source,
          dateAdded: word.dateAdded
        };
      } else {
        return {
          id: word.id || Date.now() + Math.random(),
          word: word.spanish,
          reading: word.pronunciation,
          meaning: word.english,
          example: word.example,
          exampleTranslation: word.exampleEn,
          level: word.level,
          source: word.source,
          dateAdded: word.dateAdded
        };
      }
    });
  };

  // Sample flashcards (fallback)
  const japaneseFlashcards = [
    {
      id: 1,
      word: "地元の人だけが知る",
      reading: "じもとのひとだけがしる",
      meaning: "only locals know",
      example: "地元の人だけが知る hidden ラーメン店",
      exampleTranslation: "A hidden ramen shop that only locals know",
      level: 9
    },
    {
      id: 2,
      word: "桜",
      reading: "さくら",
      meaning: "cherry blossom",
      example: "桜の季節は tourism industry に massive な boost をもたらします",
      exampleTranslation: "Cherry blossom season brings a massive boost to the tourism industry",
      level: 3
    },
    {
      id: 3,
      word: "伝統",
      reading: "でんとう",
      meaning: "tradition",
      example: "古い tradition と new generation の生活 style が融合",
      exampleTranslation: "Old traditions and new generation lifestyle merge",
      level: 6
    },
    {
      id: 4,
      word: "文化",
      reading: "ぶんか",
      meaning: "culture",
      example: "Instagram で sharing する culture も生まれています",
      exampleTranslation: "A culture of sharing on Instagram has also emerged",
      level: 5
    },
    {
      id: 5,
      word: "本格的な",
      reading: "ほんかくてきな",
      meaning: "authentic",
      example: "何世代にもわたって authentic ラーメンを提供してきました",
      exampleTranslation: "Has provided authentic ramen for generations",
      level: 8
    }
  ];

  const spanishFlashcards = [
    {
      id: 1,
      word: "solo los locales saben",
      reading: "so-lo los lo-ka-les sa-ben",
      meaning: "only locals know",
      example: "Un restaurante de tapas escondido que solo los locales saben",
      exampleTranslation: "A hidden tapas restaurant that only locals know",
      level: 9
    },
    {
      id: 2,
      word: "flamenco",
      reading: "fla-men-ko",
      meaning: "flamenco",
      example: "La temporada de flamenco trae un aumento masivo a la industria del turismo",
      exampleTranslation: "Flamenco season brings a massive boost to the tourism industry",
      level: 3
    },
    {
      id: 3,
      word: "tradición",
      reading: "tra-di-see-on",
      meaning: "tradition",
      example: "Las viejas tradiciones y el estilo de vida de la nueva generación se fusionan",
      exampleTranslation: "Old traditions and new generation lifestyle merge",
      level: 6
    },
    {
      id: 4,
      word: "cultura",
      reading: "kool-too-rah",
      meaning: "culture",
      example: "También ha surgido una cultura de compartir en Instagram",
      exampleTranslation: "A culture of sharing on Instagram has also emerged",
      level: 5
    },
    {
      id: 5,
      word: "auténtico",
      reading: "ow-ten-ti-ko",
      meaning: "authentic",
      example: "Ha proporcionado tapas auténticas durante generaciones",
      exampleTranslation: "Has provided authentic tapas for generations",
      level: 8
    }
  ];

  // Get flashcards from user dictionary or use sample data
  const userFlashcards = createFlashcardsFromDictionary();
  const sampleFlashcards = selectedLanguage === 'spanish' ? spanishFlashcards : japaneseFlashcards;
  const allFlashcards = userFlashcards.length > 0 ? userFlashcards : sampleFlashcards;

  // Filter flashcards based on study mode
  const getFilteredFlashcards = () => {
    switch (studyMode) {
      case 'new':
        // Words added in the last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return allFlashcards.filter(card =>
          card.dateAdded && new Date(card.dateAdded) > weekAgo
        );
      case 'review':
        // Words that have been marked as "learning" (not mastered)
        return allFlashcards.filter(card => progress[card.id] === 'learning');
      default:
        return allFlashcards;
    }
  };

  const flashcards = getFilteredFlashcards();
  const currentCard = flashcards.length > 0 ? flashcards[currentCardIndex] : null;

  const getLevelColor = (level) => {
    if (level <= 3) return 'bg-green-500';
    if (level <= 6) return 'bg-blue-500';
    if (level <= 8) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleNext = () => {
    if (flashcards.length === 0) return;
    setShowAnswer(false);
    setCurrentCardIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrevious = () => {
    if (flashcards.length === 0) return;
    setShowAnswer(false);
    setCurrentCardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleStudyModeChange = (newMode) => {
    setStudyMode(newMode);
    setCurrentCardIndex(0);
    setShowAnswer(false);
  };

  const handleKnow = () => {
    if (currentCard) {
      setProgress(prev => ({ ...prev, [currentCard.id]: 'known' }));
      handleNext();
    }
  };

  const handleDontKnow = () => {
    if (currentCard) {
      setProgress(prev => ({ ...prev, [currentCard.id]: 'learning' }));
      handleNext();
    }
  };

  const resetProgress = () => {
    setProgress({});
    setCurrentCardIndex(0);
    setShowAnswer(false);
  };

  return (
    <div className={isEmbedded ? "" : "min-h-screen bg-white"}>
      {/* Header - only show when not embedded */}
      {!isEmbedded && (
        <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Feed</span>
              </button>
              <div className="flex items-center space-x-3">
                <Star className="w-6 h-6 text-yellow-500" />
                <span className="text-2xl font-bold text-gray-900">Flashcards</span>
                <Sparkles className="w-6 h-6 text-purple-500" />
              </div>
              <button
                onClick={resetProgress}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="font-medium">Reset</span>
              </button>
            </div>
          </div>
        </header>
      )}

      <div className={isEmbedded ? "" : "max-w-6xl mx-auto px-6 lg:px-8 py-8"}>
        {/* Study Mode Controls */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Study Mode:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleStudyModeChange('all')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    studyMode === 'all'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Words ({allFlashcards.length})
                </button>
                <button
                  onClick={() => handleStudyModeChange('new')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    studyMode === 'new'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  New Words ({getFilteredFlashcards().length})
                </button>
                <button
                  onClick={() => handleStudyModeChange('review')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    studyMode === 'review'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Review ({allFlashcards.filter(card => progress[card.id] === 'learning').length})
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Known: {Object.values(progress).filter(p => p === 'known').length} |
                Learning: {Object.values(progress).filter(p => p === 'learning').length}
              </div>
              <button
                onClick={resetProgress}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="font-medium">Reset</span>
              </button>
            </div>
          </div>
        </div>

        {/* Embedded Header */}
        {isEmbedded && (
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <Star className="w-6 h-6 text-yellow-500" />
              <span className="text-3xl font-bold text-gray-900">Flashcards</span>
              <Sparkles className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        )}
        {flashcards.length > 0 ? (
          <>
            {/* Progress Bar */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-3">
                <span className="text-base font-semibold text-gray-800">
                  Card {currentCardIndex + 1} of {flashcards.length}
                </span>
                <span className="text-sm font-medium text-gray-600">
                  {studyMode === 'all' ? 'All Words' :
                   studyMode === 'new' ? 'New Words' : 'Review Words'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-black h-3 rounded-full transition-all duration-300"
                  style={{ width: `${((currentCardIndex + 1) / flashcards.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Flashcard */}
            <div className="bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-all p-10 mb-8 min-h-[28rem] flex flex-col justify-center shadow-sm">
              <div className="text-center">
                <div className="mb-6">
                  <span className={`inline-block px-4 py-2 rounded-full text-white text-sm font-semibold ${getLevelColor(currentCard.level)}`}>
                    Level {currentCard.level}
                  </span>
                </div>

                <div className="mb-8">
                  <h2 className="text-5xl font-bold text-gray-900 mb-4">{currentCard.word}</h2>
                  <p className="text-xl text-gray-500 font-medium">{currentCard.reading}</p>
                </div>

                {showAnswer ? (
                  <div className="space-y-6">
                    <div className="text-3xl font-bold text-black">
                      {currentCard.meaning}
                    </div>
                    {currentCard.example && (
                      <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                        <p className="text-gray-800 font-medium mb-2 text-lg">{currentCard.example}</p>
                        <p className="text-gray-600 italic">{currentCard.exampleTranslation}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAnswer(true)}
                    className="bg-black text-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-800 transition-all text-lg"
                  >
                    Show Answer
                  </button>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-4">
              {showAnswer ? (
                <>
                  <button
                    onClick={handleDontKnow}
                    className="flex items-center space-x-3 bg-red-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-red-600 transition-all"
                  >
                    <XCircle className="w-5 h-5" />
                    <span>Don't Know</span>
                  </button>
                  <button
                    onClick={handleKnow}
                    className="flex items-center space-x-3 bg-green-500 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-600 transition-all"
                  >
                    <CheckCircle className="w-5 h-5" />
                    <span>I Know This</span>
                  </button>
                </>
              ) : (
                <div className="flex space-x-4">
                  <button
                    onClick={handlePrevious}
                    className="bg-gray-100 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all border border-gray-200"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNext}
                    className="bg-gray-100 text-gray-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all border border-gray-200"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Star className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {studyMode === 'all' ? 'No Words in Dictionary' :
               studyMode === 'new' ? 'No New Words' : 'No Words to Review'}
            </h3>
            <p className="text-gray-600 text-lg mb-6">
              {studyMode === 'all'
                ? `Start adding ${selectedLanguage === 'spanish' ? 'Spanish' : 'Japanese'} words from posts to create your flashcard deck!`
                : studyMode === 'new'
                ? 'Add some new words from posts to practice with flashcards.'
                : 'Mark some words as "learning" to add them to your review deck.'
              }
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Click on any {selectedLanguage === 'spanish' ? 'Spanish' : 'Japanese'} word in the news feed to see its meaning and add it to your dictionary for flashcard practice.
              </div>
            </div>
          </div>
        )}

        {flashcards.length > 0 && (
          /* Premium Features Notice */
          <div className="mt-12 bg-gradient-to-r from-purple-50 to-yellow-50 rounded-2xl p-8 border border-purple-100">
            <div className="flex items-center space-x-3 mb-4">
              <Star className="w-7 h-7 text-yellow-500" />
              <h3 className="text-xl font-bold text-gray-900">Premium Flashcards</h3>
              <Sparkles className="w-7 h-7 text-purple-500" />
            </div>
            <p className="text-gray-700 mb-4 text-lg">
              You're using premium flashcards with advanced features including spaced repetition,
              difficulty tracking, and personalized learning paths.
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium">Spaced Repetition</span>
              <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full text-sm font-medium">Progress Tracking</span>
              <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-medium">Custom Decks</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Flashcards;