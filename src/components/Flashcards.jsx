import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, CheckCircle, XCircle, Star, Sparkles } from 'lucide-react';

const Flashcards = ({ onBack }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [progress, setProgress] = useState({});

  const flashcards = [
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Feed</span>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-lg font-bold text-gray-900">Flashcards</span>
              <Sparkles className="w-5 h-5 text-purple-500" />
            </div>
            <button
              onClick={resetProgress}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-sm">Reset</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Card {currentCardIndex + 1} of {flashcards.length}
            </span>
            <span className="text-sm text-gray-500">
              Known: {Object.values(progress).filter(p => p === 'known').length} |
              Learning: {Object.values(progress).filter(p => p === 'learning').length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentCardIndex + 1) / flashcards.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 mb-6 min-h-96 flex flex-col justify-center">
          <div className="text-center">
            <div className="mb-4">
              <span className={`inline-block px-3 py-1 rounded-full text-white text-sm font-medium ${getLevelColor(currentCard.level)}`}>
                Level {currentCard.level}
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-4xl font-bold text-gray-900 mb-2">{currentCard.word}</h2>
              <p className="text-lg text-gray-600">{currentCard.reading}</p>
            </div>

            {showAnswer ? (
              <div className="space-y-4">
                <div className="text-2xl font-semibold text-orange-600">
                  {currentCard.meaning}
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-800 mb-2">{currentCard.example}</p>
                  <p className="text-gray-600 text-sm italic">{currentCard.exampleTranslation}</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAnswer(true)}
                className="bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 transition-colors"
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
                className="flex items-center space-x-2 bg-red-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                <XCircle className="w-5 h-5" />
                <span>Don't Know</span>
              </button>
              <button
                onClick={handleKnow}
                className="flex items-center space-x-2 bg-green-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                <CheckCircle className="w-5 h-5" />
                <span>I Know This</span>
              </button>
            </>
          ) : (
            <div className="flex space-x-4">
              <button
                onClick={handlePrevious}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={handleNext}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Premium Features Notice */}
        <div className="mt-8 bg-gradient-to-r from-purple-50 to-orange-50 rounded-lg p-6 border border-purple-200">
          <div className="flex items-center space-x-3 mb-3">
            <Star className="w-6 h-6 text-yellow-500" />
            <h3 className="text-lg font-semibold text-gray-900">Premium Flashcards</h3>
            <Sparkles className="w-6 h-6 text-purple-500" />
          </div>
          <p className="text-gray-700 mb-3">
            You're using premium flashcards with advanced features including spaced repetition,
            difficulty tracking, and personalized learning paths.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">Spaced Repetition</span>
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm">Progress Tracking</span>
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">Custom Decks</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Flashcards;