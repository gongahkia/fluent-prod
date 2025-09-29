import React, { useState, useEffect } from 'react';
import { Bookmark, MessageCircle, Share, Send, BookOpen, UserPlus, UserCheck, RefreshCw } from 'lucide-react';
import EnhancedCommentSystem from './EnhancedCommentSystem';
import LoadingSpinner from './ui/LoadingSpinner';
import { handleWordClick as sharedHandleWordClick } from '../lib/wordDatabase';
import vocabularyService from '../services/vocabularyService';
import { fetchPosts } from '../services/newsService';

const NewsFeed = ({ selectedCountry, userProfile, onAddWordToDictionary, userDictionary }) => {
  const [showComments, setShowComments] = useState({});
  const [selectedWord, setSelectedWord] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [followingUsers, setFollowingUsers] = useState(new Set(['佐藤博', '高橋美咲']));
  const [isTranslating, setIsTranslating] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Load real posts from APIs
  const loadPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const realPosts = await fetchPosts({
        sources: ['hackernews', 'reddit'],
        query: 'technology',
        limit: 10,
        shuffle: true
      });

      // Ensure real posts have the necessary structure for translation
      const enhancedPosts = realPosts.map(post => ({
        ...post,
        tags: post.tags || ['#tech', '#news'],
        difficulty: 6, // Default difficulty for real news
        source: post.source || 'hackernews'
      }));

      setPosts(enhancedPosts);
    } catch (err) {
      setError(err.message);
      console.error('Error loading posts:', err);
      // Show error instead of fallback to ensure real news only
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Load posts on component mount
  useEffect(() => {
    loadPosts();
  }, []);

  const getLevelColor = (level) => {
    if (level <= 3) return 'bg-green-500';
    if (level <= 6) return 'bg-blue-500';
    if (level <= 8) return 'bg-green-500';
    return 'bg-red-500';
  };

  const showFeedback = (message, icon) => {
    setFeedbackMessage({ message, icon });
    setTimeout(() => {
      setFeedbackMessage(null);
      setSelectedWord(null);
    }, 2000);
  };


  const handleAddToDictionary = () => {
    if (selectedWord) {
      let wordToAdd;
      
      if (selectedWord.showJapaneseTranslation) {
        // English word - add the Japanese translation to dictionary
        wordToAdd = {
          japanese: selectedWord.english, // Japanese translation
          hiragana: selectedWord.hiragana, // Katakana pronunciation
          english: selectedWord.japanese, // Original English word
          level: selectedWord.level,
          example: selectedWord.example,
          exampleEn: selectedWord.exampleEn,
          source: "LivePeek Post"
        };
      } else {
        // Japanese word - add normally
        wordToAdd = {
          japanese: selectedWord.japanese,
          hiragana: selectedWord.hiragana,
          english: selectedWord.english,
          level: selectedWord.level,
          example: selectedWord.example,
          exampleEn: selectedWord.exampleEn,
          source: "LivePeek Post"
        };
      }
      
      const exists = userDictionary.some(word => word.japanese === wordToAdd.japanese);
      
      if (!exists) {
        onAddWordToDictionary(wordToAdd);
        showFeedback('Added to dictionary! ✓', '📚');
      } else {
        showFeedback('Already in dictionary!', '📖');
      }
    }
  };

  const handleMastered = () => {
    showFeedback('Sugoi!', '😊');
  };

  const handleFollowToggle = (authorName) => {
    setFollowingUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(authorName)) {
        newSet.delete(authorName);
      } else {
        newSet.add(authorName);
      }
      return newSet;
    });
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      setIsSearching(true);
      // Search through current real posts
      setTimeout(() => {
        const filtered = posts.filter(post =>
          post.title.toLowerCase().includes(query.toLowerCase()) ||
          (post.content && post.content.toLowerCase().includes(query.toLowerCase())) ||
          (post.author && post.author.toLowerCase().includes(query.toLowerCase()))
        );
        setSearchResults(filtered.slice(0, 5));
        setIsSearching(false);
      }, 500);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };


  const toggleComments = (articleId) => {
    setShowComments(prev => ({
      ...prev,
      [articleId]: !prev[articleId]
    }));
  };

  // Get actual comment count for each article
  const getCommentCount = (articleId) => {
    const commentCounts = {
      1: 6, // Article 1 has 6 comments
      2: 6, // Article 2 has 6 comments  
      3: 6, // Article 3 has 6 comments
      4: 6, // Article 4 has 6 comments
      5: 6, // Article 5 has 6 comments
      6: 6  // Article 6 has 6 comments
    };
    return commentCounts[articleId] || 0;
  };

  const handleWordClick = async (word, isJapanese, context = null) => {
    await sharedHandleWordClick(word, setSelectedWord, isJapanese, context, null, setIsTranslating);
  };


  // Function to segment Japanese text into meaningful words/phrases
  const segmentJapaneseText = (text) => {
    // Define common Japanese word patterns and boundaries
    const wordPatterns = [
      // Multi-character words from our database (longest first)
      '地元の人だけが知る', '何世代にもわたって', 'これらの', 'family-run', 'self-expression',
      'limited-time', 'constantly', 'Traditional', 'businesses', 'generation',
      '地元', '人だけが', 'だけが', '知る', 'ラーメン', '東京', '最も', '地区', '地下', '探索',
      '何世代', 'にもわたって', '提供', 'してきました', '若者', 'creativity', 'させています',
      '変化', '見られます', '文化', '伝統', '桜', '季節', '原宿', '渋谷', '大阪', '京都', '九州',
      '古い', '生活', 'tradition', 'elements', 'products', 'visitors', 'attract',
      'Young', 'people', 'Tokyo', 'modern', 'trends', 'fusion', 'Sakura', 'tourism',
      'industry', 'massive', 'boost', 'Local', 'special', 'events', 'hidden',
      'culture', 'business', 'authentic', 'style',
      // Common particles and grammar
      'の', 'が', 'は', 'を', 'に', 'で', 'と', 'も'
    ];
    
    let result = [];
    let remaining = text;
    
    while (remaining.length > 0) {
      let matched = false;
      
      // Try to match longer patterns first
      for (let pattern of wordPatterns.sort((a, b) => b.length - a.length)) {
        if (remaining.startsWith(pattern)) {
          result.push({ text: pattern, isWord: true });
          remaining = remaining.slice(pattern.length);
          matched = true;
          break;
        }
      }
      
      if (!matched) {
        // If no pattern matches, take one character
        result.push({ text: remaining[0], isWord: false });
        remaining = remaining.slice(1);
      }
    }
    
    return result;
  };

  const renderClickableText = (text) => {
    if (!text) return '';

    // Split by spaces and punctuation, preserving them
    const segments = text.split(/(\s+|[.,!?;:"'()[\]{}—–-])/);

    return segments.map((segment, segmentIndex) => {
      // Keep whitespace and punctuation as-is
      if (!segment.trim() || /^[.,!?;:"'()[\]{}—–-\s]+$/.test(segment)) {
        return <span key={segmentIndex}>{segment}</span>;
      }

      const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(segment);
      const hasEnglish = /[a-zA-Z]/.test(segment);

      if (hasJapanese) {
        // Use intelligent segmentation for Japanese text
        const words = segmentJapaneseText(segment);

        return (
          <span key={segmentIndex}>
            {words.map((wordObj, wordIndex) => {
              const { text } = wordObj;

              return (
                <span
                  key={`${segmentIndex}-${wordIndex}`}
                  className="cursor-pointer hover:bg-yellow-200 hover:shadow-sm border-b border-transparent hover:border-orange-300 rounded px-0.5 py-0.5 transition-all duration-200 inline-block"
                  onClick={() => handleWordClick(text, true, text)}
                  title={`Click to learn: ${text}`}
                  style={{ textDecoration: 'none' }}
                >
                  {text}
                </span>
              );
            })}
          </span>
        );
      } else if (hasEnglish) {
        // Enhanced English word handling with vocabulary detection
        const cleanWord = segment.trim().replace(/[.,!?;:"'()[\]{}—–-]/g, '');

        // Skip if empty after cleaning
        if (!cleanWord) {
          return <span key={segmentIndex}>{segment}</span>;
        }

        const isVocabularyWord = vocabularyService.isValidVocabularyWord(cleanWord);

        // Different styling for vocabulary vs regular words
        const vocabularyClasses = isVocabularyWord
          ? "cursor-pointer hover:bg-green-100 hover:shadow-sm border-b-2 border-green-300 hover:border-green-500 rounded px-1 py-0.5 transition-all duration-200 font-medium"
          : "cursor-pointer hover:bg-blue-100 hover:shadow-sm border-b border-transparent hover:border-blue-300 rounded px-1 py-0.5 transition-all duration-200";

        const vocabularyTitle = isVocabularyWord
          ? `📚 Vocabulary: Click to learn "${cleanWord}"`
          : `Click to translate: ${cleanWord}`;

        return (
          <span key={segmentIndex}>
            <span
              className={vocabularyClasses}
              onClick={() => handleWordClick(cleanWord, false, text)}
              title={vocabularyTitle}
              style={{ textDecoration: 'none' }}
            >
              {segment}
            </span>
          </span>
        );
      }

      return <span key={segmentIndex}>{segment}</span>;
    });
  };

  if (!selectedCountry) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🌍</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to LivePeek</h3>
          <p className="text-gray-600">Discover authentic content from around the world. Starting with Japanese, expanding globally!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Country Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Learning Feed</h1>
            <p className="text-gray-600">Real news with interactive translation - Click any word to learn!</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadPosts}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <div className="text-4xl">🎓</div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mt-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            {isSearching && (
              <div className="absolute right-3 top-2.5">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Japanese Word Learning Popup */}
      {(selectedWord || isTranslating) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => {
          setSelectedWord(null);
          setIsTranslating(false);
        }}>
          <div className="bg-white rounded-lg p-6 max-w-md mx-4" onClick={e => e.stopPropagation()}>
            {isTranslating ? (
              <div className="text-center py-8">
                <LoadingSpinner size="lg" text="Translating..." />
              </div>
            ) : !feedbackMessage ? (
              <div className="text-center">
                {/* Word Display - handles both Japanese and English words */}
                <div className="mb-4">
                  {selectedWord.showJapaneseTranslation ? (
                    // English word showing Japanese translation
                    <>
                      <div className="text-3xl font-bold text-gray-900 mb-1">{selectedWord.japanese}</div>
                      <div className="text-lg text-gray-600 mb-2">{selectedWord.hiragana}</div>
                      <div className="text-xl text-green-600 font-semibold">Japanese: {selectedWord.english}</div>
                    </>
                  ) : (
                    // Japanese word showing English translation
                    <>
                      <div className="text-3xl font-bold text-gray-900 mb-1">{selectedWord.japanese}</div>
                      {selectedWord.hiragana !== selectedWord.japanese && (
                        <div className="text-lg text-gray-600 mb-2">{selectedWord.hiragana}</div>
                      )}
                      <div className="text-xl text-green-600 font-semibold">{selectedWord.english}</div>
                    </>
                  )}
                </div>

                {/* Level Badge */}
                {selectedWord.level && (
                  <div className="mb-4 flex items-center space-x-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-white text-sm font-medium ${getLevelColor(selectedWord.level)}`}>
                      Level {selectedWord.level}
                    </span>
                    {selectedWord.isVocabulary && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        📚 Vocabulary Word
                      </span>
                    )}
                    {selectedWord.wordType && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        {selectedWord.wordType}
                      </span>
                    )}
                    {selectedWord.isApiTranslated && !selectedWord.isVocabulary && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        🌐 Live Translation
                      </span>
                    )}
                    {selectedWord.isApiFallback && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        ⚠️ Basic Translation
                      </span>
                    )}
                  </div>
                )}

                {/* Context section removed as requested */}

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    className="w-full bg-green-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors"
                    onClick={handleMastered}
                  >
                    Mastered! ✨
                  </button>
                  <button
                    className="w-full bg-blue-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors flex items-center justify-center space-x-1"
                    onClick={handleAddToDictionary}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Add to My Dictionary</span>
                  </button>
                </div>

                {/* Dictionary Status */}
                {(() => {
                  const wordToCheck = selectedWord.showJapaneseTranslation ? selectedWord.english : selectedWord.japanese;
                  const isInDictionary = userDictionary.some(word => word.japanese === wordToCheck);
                  return isInDictionary && (
                    <div className="mt-3 text-sm text-green-600 flex items-center justify-center space-x-1">
                      <span>✓</span>
                      <span>Already in your dictionary</span>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">{feedbackMessage.icon}</div>
                <div className="text-xl font-semibold text-gray-900">{feedbackMessage.message}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Loading latest posts..." />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-700 font-medium mb-2">Error Loading Posts</div>
          <div className="text-red-600 text-sm mb-4">{error}</div>
          <button
            onClick={loadPosts}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Posts */}
      {!loading && !error && (searchResults.length > 0 ? searchResults : posts).map((article) => (
        <div key={article.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Article Header */}
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-orange-700">
                    {article.author.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{article.author}</span>
                    {article.verified && (
                      <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                        Verified
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {article.location || article.source} • {article.time || new Date(article.publishedAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => handleFollowToggle(article.author)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    followingUsers.has(article.author)
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  }`}
                >
                  {followingUsers.has(article.author) ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={article.externalUrl || article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="See original post"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                {article.difficulty && (
                  <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                    Level {article.difficulty}
                  </span>
                )}
                {article.source && (
                  <span className="bg-gray-500 text-white px-2 py-1 rounded text-xs font-medium">
                    {article.source}
                  </span>
                )}
              </div>
            </div>

            {/* Article Content */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                {renderClickableText(article.title)}
              </h2>
              <p className="text-gray-800 leading-relaxed mb-4">
                {article.content ? renderClickableText(article.content) : ''}
              </p>
              
              {article.image && (
                <img 
                  src={article.image} 
                  alt={article.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Engagement Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center space-x-6">
                <button className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors">
                  <Bookmark className="w-5 h-5" />
                  <span className="text-sm font-medium">Save</span>
                </button>
                <button
                  onClick={() => toggleComments(article.id)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {article.comments || getCommentCount(article.id) || 0} comments
                  </span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 hover:text-green-500 transition-colors">
                  <Share className="w-5 h-5" />
                  <span className="text-sm font-medium">{article.shares || 'Share'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Comment System */}
          {showComments[article.id] && (
            <EnhancedCommentSystem 
              articleId={article.id}
              userProfile={userProfile}
              userDictionary={userDictionary}
              onAddWordToDictionary={onAddWordToDictionary}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default NewsFeed;