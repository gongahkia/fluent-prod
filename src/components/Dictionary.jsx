import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Star, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const Dictionary = ({ onBack }) => {
  const [expandedWord, setExpandedWord] = useState(null);

  // Dictionary words with levels
  const dictionaryWords = [
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Feed
          </button>
          <h1 className="text-2xl font-bold text-gray-900">My Dictionary</h1>
          <div></div>
        </div>

        {/* Dictionary Words */}
        <div className="space-y-4">
          {sortedWords.map((word) => (
            <div key={word.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-xl font-bold text-gray-900">
                      {word.japanese}
                    </div>
                    <div className="text-gray-600">
                      {word.hiragana}
                    </div>
                    <div className="text-gray-800 font-medium">
                      {word.english}
                    </div>
                    <span className={`px-2 py-1 rounded text-white text-xs font-medium ${getLevelColor(word.level)}`}>
                      Level {word.level}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => toggleExpanded(word.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {expandedWord === word.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={() => removeWord(word.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {expandedWord === word.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Example Sentence</h4>
                        <p className="text-gray-900">{word.example}</p>
                        <p className="text-gray-600 text-sm">{word.exampleEn}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Source</h4>
                        <p className="text-gray-600 text-sm">{word.source}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="flex items-center text-orange-500 text-sm hover:text-orange-600">
                          <Star className="w-4 h-4 mr-1" />
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">Premium</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {sortedWords.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No words saved yet</h3>
            <p className="text-gray-600">Start clicking on words in posts to build your dictionary!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dictionary;

