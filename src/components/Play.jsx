import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Clock, Target, Award, Crown, CheckCircle } from 'lucide-react';

// Hardcoded word lists for Japanese and Korean
const WORD_LISTS = {
  Japanese: [
    { english: 'hello', translation: 'こんにちは', reading: 'konnichiwa' },
    { english: 'goodbye', translation: 'さようなら', reading: 'sayounara' },
    { english: 'thank you', translation: 'ありがとう', reading: 'arigatou' },
    { english: 'yes', translation: 'はい', reading: 'hai' },
    { english: 'no', translation: 'いいえ', reading: 'iie' },
    { english: 'water', translation: '水', reading: 'mizu' },
    { english: 'food', translation: '食べ物', reading: 'tabemono' },
    { english: 'book', translation: '本', reading: 'hon' },
    { english: 'school', translation: '学校', reading: 'gakkou' },
    { english: 'friend', translation: '友達', reading: 'tomodachi' },
    { english: 'house', translation: '家', reading: 'ie' },
    { english: 'mother', translation: '母', reading: 'haha' },
    { english: 'father', translation: '父', reading: 'chichi' },
    { english: 'cat', translation: '猫', reading: 'neko' },
    { english: 'dog', translation: '犬', reading: 'inu' },
    { english: 'morning', translation: '朝', reading: 'asa' },
    { english: 'night', translation: '夜', reading: 'yoru' },
    { english: 'beautiful', translation: '綺麗', reading: 'kirei' },
    { english: 'delicious', translation: '美味しい', reading: 'oishii' },
    { english: 'expensive', translation: '高い', reading: 'takai' },
    { english: 'cheap', translation: '安い', reading: 'yasui' },
    { english: 'big', translation: '大きい', reading: 'ookii' },
    { english: 'small', translation: '小さい', reading: 'chiisai' },
    { english: 'love', translation: '愛', reading: 'ai' },
    { english: 'time', translation: '時間', reading: 'jikan' },
  ],
  Korean: [
    { english: 'hello', translation: '안녕하세요', reading: 'annyeonghaseyo' },
    { english: 'goodbye', translation: '안녕히 가세요', reading: 'annyeonghi gaseyo' },
    { english: 'thank you', translation: '감사합니다', reading: 'gamsahamnida' },
    { english: 'yes', translation: '네', reading: 'ne' },
    { english: 'no', translation: '아니요', reading: 'aniyo' },
    { english: 'water', translation: '물', reading: 'mul' },
    { english: 'food', translation: '음식', reading: 'eumsik' },
    { english: 'book', translation: '책', reading: 'chaek' },
    { english: 'school', translation: '학교', reading: 'hakgyo' },
    { english: 'friend', translation: '친구', reading: 'chingu' },
    { english: 'house', translation: '집', reading: 'jip' },
    { english: 'mother', translation: '어머니', reading: 'eomeoni' },
    { english: 'father', translation: '아버지', reading: 'abeoji' },
    { english: 'cat', translation: '고양이', reading: 'goyangi' },
    { english: 'dog', translation: '개', reading: 'gae' },
    { english: 'morning', translation: '아침', reading: 'achim' },
    { english: 'night', translation: '밤', reading: 'bam' },
    { english: 'beautiful', translation: '아름다운', reading: 'areumdaun' },
    { english: 'delicious', translation: '맛있는', reading: 'masinneun' },
    { english: 'expensive', translation: '비싼', reading: 'bissan' },
    { english: 'cheap', translation: '싼', reading: 'ssan' },
    { english: 'big', translation: '큰', reading: 'keun' },
    { english: 'small', translation: '작은', reading: 'jageun' },
    { english: 'love', translation: '사랑', reading: 'sarang' },
    { english: 'time', translation: '시간', reading: 'sigan' },
  ],
};

// Mock friends leaderboard data (in-memory, time in seconds)
const INITIAL_LEADERBOARD = [
  { id: 1, name: 'Sarah Kim', time: 125, completedToday: true },
  { id: 2, name: 'Mike Chen', time: 138, completedToday: true },
  { id: 3, name: 'Emma Liu', time: 156, completedToday: true },
  { id: 4, name: 'James Park', time: 172, completedToday: true },
  { id: 5, name: 'Lisa Wong', time: 189, completedToday: true },
];

const QUESTIONS_PER_GAME = 15;
const WRONG_ANSWER_PENALTY = 5; // seconds

const Play = ({ userProfile }) => {
  const [gameState, setGameState] = useState('menu'); // 'menu', 'playing', 'results', 'completed'
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0); // Running timer in seconds
  const [selectedCards, setSelectedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [cards, setCards] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [gameResults, setGameResults] = useState(null);
  const [leaderboard, setLeaderboard] = useState(INITIAL_LEADERBOARD);
  const [hasCompletedToday, setHasCompletedToday] = useState(false);

  const targetLanguage = userProfile?.targetLanguage || 'Japanese';

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Fisher-Yates shuffle algorithm
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Initialize game
  const startGame = useCallback(() => {
    if (hasCompletedToday) {
      return; // Don't allow replay if already completed
    }

    const wordList = WORD_LISTS[targetLanguage];
    const shuffledWords = shuffleArray(wordList);
    const selectedWords = shuffledWords.slice(0, QUESTIONS_PER_GAME);

    setQuestions(selectedWords);
    setCurrentQuestion(0);
    setElapsedTime(0);
    setMatchedPairs([]);
    setGameState('playing');
    setGameResults(null);

    // Initialize first question
    initializeQuestion(selectedWords[0]);
  }, [targetLanguage, hasCompletedToday]);

  // Initialize a single question (create card pairs)
  const initializeQuestion = (word) => {
    const cardPairs = [
      { id: 1, text: word.english, type: 'english', matched: false },
      { id: 2, text: word.translation, type: 'translation', matched: false },
    ];

    // Add 2 distractor translations
    const wordList = WORD_LISTS[targetLanguage];
    const distractors = wordList
      .filter(w => w.english !== word.english)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);

    distractors.forEach((distractor, index) => {
      cardPairs.push({
        id: 3 + index,
        text: distractor.translation,
        type: 'translation',
        matched: false,
      });
    });

    setCards(shuffleArray(cardPairs));
    setSelectedCards([]);
  };

  // Running timer - increments every second during gameplay
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  const handleCardClick = (card) => {
    // Ignore if card already matched or already selected
    if (card.matched || selectedCards.find(c => c.id === card.id)) return;

    const newSelected = [...selectedCards, card];
    setSelectedCards(newSelected);

    // If we have 2 cards selected, check for match
    if (newSelected.length === 2) {
      const [first, second] = newSelected;

      // Check if one is english and one is translation
      if (
        (first.type === 'english' && second.type === 'translation') ||
        (first.type === 'translation' && second.type === 'english')
      ) {
        // Check if they match the current word
        const currentWord = questions[currentQuestion];
        const englishCard = first.type === 'english' ? first : second;
        const translationCard = first.type === 'translation' ? first : second;

        if (
          englishCard.text === currentWord.english &&
          translationCard.text === currentWord.translation
        ) {
          // Correct match!
          handleCorrectMatch();
        } else {
          // Wrong match - add time penalty
          handleWrongMatch();
        }
      } else {
        // Selected two of the same type
        setTimeout(() => setSelectedCards([]), 500);
      }
    }
  };

  const handleCorrectMatch = () => {
    setMatchedPairs([...matchedPairs, currentQuestion]);

    // Mark cards as matched
    const updatedCards = cards.map(card => {
      if (selectedCards.find(c => c.id === card.id)) {
        return { ...card, matched: true };
      }
      return card;
    });
    setCards(updatedCards);

    // Move to next question after a short delay
    setTimeout(() => {
      moveToNextQuestion();
    }, 800);
  };

  const handleWrongMatch = () => {
    // Add time penalty for wrong answer
    setElapsedTime(prev => prev + WRONG_ANSWER_PENALTY);

    // Clear selection after a short delay to show the wrong match
    setTimeout(() => {
      setSelectedCards([]);
    }, 500);
  };

  const moveToNextQuestion = () => {
    if (currentQuestion + 1 < QUESTIONS_PER_GAME) {
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);
      initializeQuestion(questions[nextQuestion]);
    } else {
      // Game over
      endGame();
    }
  };

  const endGame = () => {
    const finalTime = elapsedTime;
    const results = {
      time: finalTime,
      correctAnswers: matchedPairs.length + 1, // +1 for the last question
      totalQuestions: QUESTIONS_PER_GAME,
      accuracy: Math.round(((matchedPairs.length + 1) / QUESTIONS_PER_GAME) * 100),
    };

    setGameResults(results);
    setHasCompletedToday(true); // Mark as completed
    setGameState('completed');

    // Add to leaderboard (simulate current user)
    const newEntry = {
      id: Date.now(),
      name: userProfile?.name || 'You',
      time: finalTime,
      completedToday: true,
    };

    // Merge with existing leaderboard and sort by time (ascending - fastest first)
    const updatedLeaderboard = [...leaderboard, newEntry]
      .sort((a, b) => a.time - b.time)
      .slice(0, 10); // Keep top 10

    setLeaderboard(updatedLeaderboard);
  };

  const isCardSelected = (card) => {
    return selectedCards.find(c => c.id === card.id);
  };

  const isCardMatched = (card) => {
    return card.matched;
  };

  // Menu View
  if (gameState === 'menu') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full mb-4">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Challenge</h1>
            <p className="text-gray-600">
              Match English words with their {targetLanguage} translations as fast as you can!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-200">
              <Target className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-900">{QUESTIONS_PER_GAME}</div>
              <div className="text-sm text-orange-700">Questions</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center border border-orange-200">
              <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-900">Beat the Clock</div>
              <div className="text-sm text-orange-700">Race Against Time</div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <button
              onClick={startGame}
              disabled={hasCompletedToday}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all transform flex items-center justify-center space-x-2 ${
                hasCompletedToday
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:scale-105'
              }`}
            >
              {hasCompletedToday ? (
                <>
                  <CheckCircle className="w-6 h-6" />
                  <span>Challenge Completed</span>
                </>
              ) : (
                <>
                  <Trophy className="w-6 h-6" />
                  <span>Start Challenge</span>
                </>
              )}
            </button>
          </div>

          {/* Always show leaderboard */}
          <div className="mt-6">
            <LeaderboardView leaderboard={leaderboard} currentUserName={userProfile?.name} />
          </div>
        </div>
      </div>
    );
  }

  // Playing View
  if (gameState === 'playing') {
    const currentWord = questions[currentQuestion];
    const progress = ((currentQuestion + 1) / QUESTIONS_PER_GAME) * 100;

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Header Stats */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-orange-100 px-3 py-1 rounded-full border border-orange-300">
                <span className="text-orange-800 font-semibold text-sm">
                  Question {currentQuestion + 1}/{QUESTIONS_PER_GAME}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-orange-100 px-3 py-1 rounded-full flex items-center space-x-1 border border-orange-300">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="font-semibold text-sm text-orange-800">
                  {formatTime(elapsedTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
            <div
              className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Instruction */}
          <div className="text-center mb-6">
            <p className="text-lg text-gray-600 mb-2">
              Match the English word with its {targetLanguage} translation
            </p>
            <p className="text-sm text-gray-500">
              Reading: <span className="font-medium">{currentWord.reading}</span>
            </p>
            <p className="text-xs text-orange-600 mt-1">
              Wrong answers add +{WRONG_ANSWER_PENALTY}s penalty
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map((card) => {
              const selected = isCardSelected(card);
              const matched = isCardMatched(card);

              return (
                <button
                  key={card.id}
                  onClick={() => handleCardClick(card)}
                  disabled={matched}
                  className={`
                    p-6 rounded-lg border-2 transition-all transform hover:scale-105
                    ${matched
                      ? 'bg-green-100 border-green-400 text-green-800 cursor-not-allowed opacity-75'
                      : selected
                      ? 'bg-orange-100 border-orange-500 text-orange-900 scale-105'
                      : 'bg-white border-gray-300 text-gray-900 hover:border-orange-300'
                    }
                  `}
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold break-words">
                      {card.text}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {card.type === 'english' ? 'EN' : targetLanguage.slice(0, 2).toUpperCase()}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Hint */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              💡 Select one English card and one {targetLanguage} card to match
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Completed View (after finishing the challenge)
  if (gameState === 'completed' && gameResults) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full mb-4">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Challenge Complete!</h2>
            <p className="text-gray-600">Great job! Here's how you did</p>
          </div>

          {/* Results Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg p-4 text-center border border-orange-200">
              <div className="text-3xl font-bold text-orange-900">{formatTime(gameResults.time)}</div>
              <div className="text-sm text-orange-700">Your Time</div>
            </div>
            <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg p-4 text-center border border-orange-200">
              <div className="text-3xl font-bold text-orange-900">{gameResults.correctAnswers}</div>
              <div className="text-sm text-orange-700">Correct Answers</div>
            </div>
            <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg p-4 text-center border border-orange-200">
              <div className="text-3xl font-bold text-orange-900">{gameResults.accuracy}%</div>
              <div className="text-sm text-orange-700">Accuracy</div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="mb-6">
            <LeaderboardView leaderboard={leaderboard} currentUserName={userProfile?.name} />
          </div>

          {/* Daily Challenge Message */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-orange-900 mb-2">Daily Challenge Completed!</h3>
            <p className="text-orange-700">
              Come back tomorrow for a new challenge and improve your ranking!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Leaderboard Component
const LeaderboardView = ({ leaderboard, currentUserName }) => {
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3">
        <h3 className="text-white font-semibold flex items-center space-x-2">
          <Trophy className="w-5 h-5" />
          <span>Friends Leaderboard</span>
        </h3>
      </div>

      <div className="divide-y divide-gray-200">
        {leaderboard.map((entry, index) => {
          const isCurrentUser = entry.name === currentUserName || entry.name === 'You';
          const rankColors = {
            0: 'text-orange-600',
            1: 'text-gray-500',
            2: 'text-amber-600',
          };

          return (
            <div
              key={entry.id}
              className={`px-4 py-3 flex items-center justify-between ${
                isCurrentUser ? 'bg-orange-50 border-l-4 border-orange-500' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 flex items-center justify-center font-bold ${
                  rankColors[index] || 'text-gray-400'
                }`}>
                  {index === 0 ? <Crown className="w-5 h-5" /> : `#${index + 1}`}
                </div>
                <div>
                  <div className={`font-semibold ${isCurrentUser ? 'text-orange-900' : 'text-gray-900'}`}>
                    {entry.name} {isCurrentUser && '(You)'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {entry.completedToday ? 'Completed today' : 'Not completed'}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-gray-900">{formatTime(entry.time)}</div>
                <div className="text-xs text-gray-500 flex items-center justify-end space-x-1">
                  <Clock className="w-3 h-3 text-orange-500" />
                  <span>Time</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Play;
