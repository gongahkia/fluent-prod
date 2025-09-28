import React, { useState } from 'react';
import { ArrowLeft, BookOpen, Star, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const Dictionary = ({ onBack, userDictionary, onRemoveWord }) => {
  const [expandedWord, setExpandedWord] = useState(null);
  const [sortBy, setSortBy] = useState('level'); // 'level', 'date', 'alphabetical'

  const getSortedWords = () => {
    const words = [...userDictionary];
    switch (sortBy) {
      case 'level':
        return words.sort((a, b) => a.level - b.level);
      case 'date':
        return words.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
      case 'alphabetical':
        return words.sort((a, b) => a.japanese.localeCompare(b.japanese));
      default:
        return words;
    }
  };

  const sortedWords = getSortedWords();

  const getLevelColor = (level) => {
    if (level <= 3) return 'bg-gray-400';
    if (level <= 6) return 'bg-gray-500';
    if (level <= 8) return 'bg-gray-600';
    return 'bg-gray-800';
  };

  const removeWord = (wordId) => {
    onRemoveWord(wordId);
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
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">My Japanese Dictionary</h1>
            <p className="text-sm text-gray-600">{sortedWords.length} words learned</p>
          </div>
          <div></div>
        </div>

        {/* Statistics and Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-500">{sortedWords.filter(w => w.level <= 3).length}</div>
                <div className="text-xs text-gray-600">Beginner</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{sortedWords.filter(w => w.level > 3 && w.level <= 6).length}</div>
                <div className="text-xs text-gray-600">Intermediate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700">{sortedWords.filter(w => w.level > 6 && w.level <= 8).length}</div>
                <div className="text-xs text-gray-600">Advanced</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{sortedWords.filter(w => w.level > 8).length}</div>
                <div className="text-xs text-gray-600">Expert</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
              >
                <option value="level">Difficulty Level</option>
                <option value="date">Recently Added</option>
                <option value="alphabetical">A-Z (Japanese)</option>
              </select>
            </div>
          </div>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your Japanese Dictionary is Empty</h3>
            <p className="text-gray-600 mb-4">Start clicking on Japanese words in posts to build your personal dictionary!</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Click on any Japanese word in the news feed to see its meaning, pronunciation, and add it to your dictionary for later review.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dictionary;

