import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, CheckCircle, XCircle, Star, Sparkles } from 'lucide-react';

const Flashcards = ({ onBack, selectedLanguage, isEmbedded = false }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [progress, setProgress] = useState({});

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

  const flashcards = selectedLanguage === 'spanish' ? spanishFlashcards : japaneseFlashcards;
  const currentCard = flashcards[currentCardIndex];

  const getLevelColor = (level) => {
    if (level <= 3) return 'bg-green-500';
    if (level <= 6) return 'bg-blue-500';
    if (level <= 8) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const handleNext = () => {
    setShowAnswer(false);
    setCurrentCardIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrevious = () => {
    setShowAnswer(false);
    setCurrentCardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const handleKnow = () => {
    setProgress(prev => ({ ...prev, [currentCard.id]: 'known' }));
    handleNext();
  };

  const handleDontKnow = () => {
    setProgress(prev => ({ ...prev, [currentCard.id]: 'learning' }));
    handleNext();
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
        {/* Embedded Header */}
        {isEmbedded && (
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <Star className="w-6 h-6 text-yellow-500" />
              <span className="text-3xl font-bold text-gray-900">Flashcards</span>
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
        )}
        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex justify-between items-center mb-3">
            <span className="text-base font-semibold text-gray-800">
              Card {currentCardIndex + 1} of {flashcards.length}
            </span>
            <span className="text-sm font-medium text-gray-600">
              Known: {Object.values(progress).filter(p => p === 'known').length} |
              Learning: {Object.values(progress).filter(p => p === 'learning').length}
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
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                  <p className="text-gray-800 font-medium mb-2 text-lg">{currentCard.example}</p>
                  <p className="text-gray-600 italic">{currentCard.exampleTranslation}</p>
                </div>
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

        {/* Premium Features Notice */}
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
      </div>
    </div>
  );
};

export default Flashcards;