import React, { useState } from 'react';
import { ArrowLeft, RotateCcw, CheckCircle, XCircle, Star, Sparkles } from 'lucide-react';

const Flashcards = ({ onBack, userDictionary }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [progress, setProgress] = useState({});
  const [studyMode, setStudyMode] = useState('all'); // 'all', 'new', 'review'

  // Convert user dictionary to flashcard format
  const createFlashcardsFromDictionary = () => {
    if (!userDictionary || userDictionary.length === 0) {
      return [];
    }

    return userDictionary.map(word => ({
      id: word.id,
      word: word.japanese,
      reading: word.hiragana,
      meaning: word.english,
      example: word.example,
      exampleTranslation: word.exampleEn,
      level: word.level,
      source: word.source,
      dateAdded: word.dateAdded
    }));
  };

  const allFlashcards = createFlashcardsFromDictionary();
  
  // Filter flashcards based on study mode
  const getFilteredFlashcards = () => {
    switch (studyMode) {
      case 'new': {
        // Words added in the last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return allFlashcards.filter(card => new Date(card.dateAdded) > weekAgo);
      }
      case 'review':
        // Words that have been marked as "learning" (not mastered)
        return allFlashcards.filter(card => progress[card.id] === 'learning');
      default:
        return allFlashcards;
    }
  };

  const flashcards = getFilteredFlashcards();
  const currentCard = flashcards[currentCardIndex];

  const getLevelColor = (level) => {
    if (level <= 3) return 'bg-gray-400';
    if (level <= 6) return 'bg-gray-500';
    if (level <= 8) return 'bg-gray-600';
    return 'bg-gray-800';
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
        {/* Study Mode Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Study Mode:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleStudyModeChange('all')}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    studyMode === 'all' 
                      ? 'bg-orange-500 text-white' 
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
            
            <div className="text-sm text-gray-500">
              Known: {Object.values(progress).filter(p => p === 'known').length} |
              Learning: {Object.values(progress).filter(p => p === 'learning').length}
            </div>
          </div>
        </div>

        {flashcards.length > 0 ? (
          <>
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Card {currentCardIndex + 1} of {flashcards.length}
                </span>
                <span className="text-sm text-gray-500">
                  {studyMode === 'all' ? 'All Words' : 
                   studyMode === 'new' ? 'New Words' : 'Review Words'}
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
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-orange-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {studyMode === 'all' ? 'No Words in Dictionary' :
               studyMode === 'new' ? 'No New Words' : 'No Words to Review'}
            </h3>
            <p className="text-gray-600 mb-4">
              {studyMode === 'all' 
                ? 'Start adding Japanese words from posts to create your flashcard deck!'
                : studyMode === 'new'
                ? 'Add some new words from posts to practice with flashcards.'
                : 'Mark some words as "learning" to add them to your review deck.'
              }
            </p>
            <button
              onClick={onBack}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Go to Feed
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Flashcards;