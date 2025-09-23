import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Star, Trash2, ChevronDown, ChevronUp, Zap } from 'lucide-react';

const Dictionary = ({ onBack, onNavigateToFlashcards, selectedLanguage }) => {
  const [expandedWord, setExpandedWord] = useState(null);

  // Japanese dictionary words
  const japaneseDictionaryWords = [
    {
      id: 1,
      japanese: "ラーメン",
      hiragana: "らーめん",
      english: "ramen",
      level: 3,
      example: "今日はラーメンを食べました。",
      exampleEn: "I ate ramen today.",
      source: "Hidden Ramen Shops post"
    },
    {
      id: 2,
      japanese: "文化",
      hiragana: "ぶんか",
      english: "culture",
      level: 5,
      example: "日本の文化は興味深いです。",
      exampleEn: "Japanese culture is interesting.",
      source: "Digital Art Museum post"
    },
    {
      id: 3,
      japanese: "地元",
      hiragana: "じもと",
      english: "local",
      level: 4,
      example: "地元の人におすすめを聞きました。",
      exampleEn: "I asked local people for recommendations.",
      source: "Hidden Ramen Shops post"
    },
    {
      id: 4,
      japanese: "美味しい",
      hiragana: "おいしい",
      english: "delicious",
      level: 2,
      example: "このラーメンはとても美味しいです。",
      exampleEn: "This ramen is very delicious.",
      source: "Street Food Revolution post"
    },
    {
      id: 5,
      japanese: "素晴らしい",
      hiragana: "すばらしい",
      english: "wonderful",
      level: 6,
      example: "素晴らしい経験でした。",
      exampleEn: "It was a wonderful experience.",
      source: "Tea Ceremony post"
    },
    {
      id: 6,
      japanese: "興味深い",
      hiragana: "きょうみぶかい",
      english: "interesting",
      level: 7,
      example: "とても興味深い話でした。",
      exampleEn: "It was a very interesting story.",
      source: "Digital Art Museum post"
    },
    {
      id: 7,
      japanese: "伝統",
      hiragana: "でんとう",
      english: "tradition",
      level: 8,
      example: "日本の伝統を学んでいます。",
      exampleEn: "I am learning Japanese traditions.",
      source: "Tea Ceremony post"
    },
    {
      id: 8,
      japanese: "新しい",
      hiragana: "あたらしい",
      english: "new",
      level: 1,
      example: "新しいレストランに行きました。",
      exampleEn: "I went to a new restaurant.",
      source: "Digital Art Museum post"
    }
  ];

  // Spanish dictionary words
  const spanishDictionaryWords = [
    {
      id: 1,
      spanish: "paella",
      pronunciation: "pa-eh-ya",
      english: "paella",
      level: 3,
      example: "Comimos paella en Valencia.",
      exampleEn: "We ate paella in Valencia.",
      source: "Spanish Food Culture post"
    },
    {
      id: 2,
      spanish: "cultura",
      pronunciation: "kool-too-rah",
      english: "culture",
      level: 5,
      example: "La cultura española es muy rica.",
      exampleEn: "Spanish culture is very rich.",
      source: "Flamenco History post"
    },
    {
      id: 3,
      spanish: "local",
      pronunciation: "lo-kal",
      english: "local",
      level: 4,
      example: "Preguntamos a la gente local.",
      exampleEn: "We asked the local people.",
      source: "Hidden Tapas Bars post"
    },
    {
      id: 4,
      spanish: "delicioso",
      pronunciation: "de-li-see-oh-so",
      english: "delicious",
      level: 2,
      example: "Esta paella está deliciosa.",
      exampleEn: "This paella is delicious.",
      source: "Street Food Revolution post"
    },
    {
      id: 5,
      spanish: "maravilloso",
      pronunciation: "ma-ra-bee-yo-so",
      english: "wonderful",
      level: 6,
      example: "Fue una experiencia maravillosa.",
      exampleEn: "It was a wonderful experience.",
      source: "Flamenco Show post"
    },
    {
      id: 6,
      spanish: "interesante",
      pronunciation: "in-te-re-san-te",
      english: "interesting",
      level: 7,
      example: "Es una historia muy interesante.",
      exampleEn: "It's a very interesting story.",
      source: "Gaudí Architecture post"
    },
    {
      id: 7,
      spanish: "tradición",
      pronunciation: "tra-di-see-on",
      english: "tradition",
      level: 8,
      example: "Estoy aprendiendo las tradiciones españolas.",
      exampleEn: "I am learning Spanish traditions.",
      source: "Flamenco History post"
    },
    {
      id: 8,
      spanish: "nuevo",
      pronunciation: "nue-bo",
      english: "new",
      level: 1,
      example: "Fuimos a un restaurante nuevo.",
      exampleEn: "We went to a new restaurant.",
      source: "Modern Spanish Cuisine post"
    }
  ];

  const dictionaryWords = selectedLanguage === 'spanish' ? spanishDictionaryWords : japaneseDictionaryWords;
  const sortedWords = [...dictionaryWords].sort((a, b) => a.level - b.level);

  const getLevelColor = (level) => {
    if (level <= 3) return 'bg-green-500';
    if (level <= 6) return 'bg-blue-500';
    if (level <= 8) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const removeWord = (wordId) => {
    // In a real app, this would update the dictionary
    console.log('Removing word:', wordId);
  };

  const toggleExpanded = (wordId) => {
    setExpandedWord(expandedWord === wordId ? null : wordId);
  };



  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-medium">Back to Feed</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">My Dictionary</h1>
          <button
            onClick={onNavigateToFlashcards}
            className="flex items-center space-x-2 bg-black text-white px-4 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-all"
          >
            <Zap className="w-4 h-4" />
            <span>Practice Flashcards</span>
          </button>
        </div>

        {/* Dictionary Words */}
        <div className="grid gap-4">
          {sortedWords.map((word) => (
            <div key={word.id} className="bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all hover:shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="text-2xl font-bold text-gray-900">
                      {selectedLanguage === 'spanish' ? word.spanish : word.japanese}
                    </div>
                    <div className="text-gray-500 font-medium">
                      {selectedLanguage === 'spanish' ? word.pronunciation : word.hiragana}
                    </div>
                    <div className="text-gray-800 font-semibold">
                      {word.english}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getLevelColor(word.level)}`}>
                      Level {word.level}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleExpanded(word.id)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {expandedWord === word.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => removeWord(word.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {expandedWord === word.id && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Example Sentence</h4>
                        <p className="text-gray-900 font-medium mb-1">{word.example}</p>
                        <p className="text-gray-600 text-sm">{word.exampleEn}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">Source</h4>
                        <p className="text-gray-600 text-sm">{word.source}</p>
                      </div>
                      <div className="flex items-center">
                        <div className="flex items-center space-x-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm font-medium text-yellow-700">Premium</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {sortedWords.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">No words saved yet</h3>
            <p className="text-gray-600 text-lg">Start clicking on words in posts to build your dictionary!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dictionary;

