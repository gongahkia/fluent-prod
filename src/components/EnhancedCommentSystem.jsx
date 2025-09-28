import React, { useState, useRef } from 'react';
import { Heart, MessageCircle, Languages, BookOpen, Sparkles, Send, Check } from 'lucide-react';
import LoadingSpinner from './ui/LoadingSpinner';
import { handleWordClick as sharedHandleWordClick } from '../lib/wordDatabase';

const EnhancedCommentSystem = ({ articleId, userProfile, userDictionary, onAddWordToDictionary }) => {
  const [showAIHelp, setShowAIHelp] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [selectedWord, setSelectedWord] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState('');
  const [comments, setComments] = useState([]);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [commentLikes, setCommentLikes] = useState({});
  const [likedComments, setLikedComments] = useState(new Set());
  const [isTranslating, setIsTranslating] = useState(false);
  const commentInputRef = useRef(null);

  // Mock comments with complete sentences in both languages
  const mockComments = {
    1: [
      {
        id: 1,
        user: "Yuki_Tokyo",
        content: "この場所は本当に本格的です！地元の人だけが知る隠れた宝石ですね。",
        likes: 24,
        avatar: "YT"
      },
      {
        id: 2,
        user: "RamenLover92", 
        content: "先月、これらの場所の一つを訪問しました！それを経営していたおじいさんは、私の下手な日本語にとても親切で忍耐強くしてくれました。",
        likes: 18,
        avatar: "RL"
      },
      {
        id: 3,
        user: "TokyoFoodie",
        content: "These hidden gems are what make Tokyo special. As someone learning Japanese, I appreciate the mixed language approach!",
        likes: 31,
        avatar: "TF"
      },
      {
        id: 101,
        user: "LocalGuide",
        content: "I've been living in Tokyo for 10 years and still discovering new places like this. The authenticity is incredible!",
        likes: 15,
        avatar: "LG"
      },
      {
        id: 102,
        user: "Sakura_Chan",
        content: "家族経営のお店は本当に温かい雰囲気がありますね。おじいさんの笑顔が忘れられません。",
        likes: 22,
        avatar: "SC"
      },
      {
        id: 103,
        user: "FoodExplorer",
        content: "The ramen here is absolutely phenomenal! You can taste the generations of tradition in every bowl.",
        likes: 19,
        avatar: "FE"
      }
    ],
    2: [
      {
        id: 4,
        user: "SakuraWatcher",
        content: "Italy has beautiful springs too, but sakura season in Japan is legendary! The limited time makes it even more special and valuable.",
        likes: 45,
        avatar: "SW"
      },
      {
        id: 5,
        user: "NaturePhotographer",
        content: "桜の季節は本当に美しいです。毎年完璧な写真を撮ろうとしますが、自然の美しさは写真を超えています。",
        likes: 28,
        avatar: "NP"
      },
      {
        id: 6,
        user: "SpringLover",
        content: "The timing is everything with sakura! You have to plan your trip perfectly to catch the peak bloom.",
        likes: 15,
        avatar: "SL"
      },
      {
        id: 201,
        user: "Hanami_Expert",
        content: "花見の文化は日本の心です。家族や友達と一緒に桜の下で過ごす時間は本当に特別ですね。",
        likes: 33,
        avatar: "HE"
      },
      {
        id: 202,
        user: "TravelBlogger",
        content: "I've traveled to Japan three times just for sakura season. Each experience is unique and magical!",
        likes: 27,
        avatar: "TB"
      },
      {
        id: 203,
        user: "TokyoResident",
        content: "毎年桜を見ていても、その美しさに感動します。短い期間だからこそ、より一層貴重に感じられます。",
        likes: 41,
        avatar: "TR"
      }
    ],
    3: [
      {
        id: 7,
        user: "FashionForward",
        content: "Tokyo's fashion scene is incredible! The way young designers blend traditional and modern elements is inspiring.",
        likes: 22,
        avatar: "FF"
      },
      {
        id: 8,
        user: "StreetStyleFan",
        content: "原宿のストリートファッションは世界中で有名です。創造性と自己表現の最高峰です！",
        likes: 19,
        avatar: "SS"
      },
      {
        id: 9,
        user: "TokyoExplorer",
        content: "I love how Tokyo combines old and new so seamlessly. Every street corner has a story!",
        likes: 15,
        avatar: "TE"
      },
      {
        id: 301,
        user: "FashionStudent",
        content: "日本のファッションデザインから多くのインスピレーションを得ています。伝統と革新の完璧なバランスです。",
        likes: 28,
        avatar: "FS"
      },
      {
        id: 302,
        user: "StyleInfluencer",
        content: "Harajuku is like a living fashion museum! Every visit I discover new trends and creative expressions.",
        likes: 34,
        avatar: "SI"
      },
      {
        id: 303,
        user: "DesignLover",
        content: "若いデザイナーたちの創造力は本当に素晴らしいです。世界に影響を与える日本のファッション文化を誇りに思います。",
        likes: 26,
        avatar: "DL"
      }
    ],
    4: [
      {
        id: 10,
        user: "CultureLover",
        content: "日本の文化は本当に深いです。毎回新しいことを学びます。",
        likes: 28,
        avatar: "CL"
      },
      {
        id: 11,
        user: "TravelBlogger",
        content: "This post perfectly captures the essence of Japanese culture! The blend of tradition and modernity is fascinating.",
        likes: 33,
        avatar: "TB"
      },
      {
        id: 401,
        user: "KyotoNative",
        content: "伝統的な建築と現代的なデザインが調和している様子は、日本の美意識を表していますね。",
        likes: 25,
        avatar: "KN"
      },
      {
        id: 402,
        user: "ArchitectureFan",
        content: "The way Japanese architects preserve historical elements while embracing innovation is truly remarkable!",
        likes: 31,
        avatar: "AF"
      },
      {
        id: 403,
        user: "CulturalStudent",
        content: "日本に住んで5年になりますが、まだまだ学ぶことがたくさんあります。文化の奥深さに感動しています。",
        likes: 22,
        avatar: "CS"
      },
      {
        id: 404,
        user: "HeritageExpert",
        content: "Japan's ability to maintain its cultural identity while adapting to global changes is a lesson for the world.",
        likes: 38,
        avatar: "HE"
      }
    ],
    5: [
      {
        id: 12,
        user: "FoodieAdventurer",
        content: "Traditional takoyaki and okonomiyaki are amazing, but the fusion cuisine here is incredible! Korean-Japanese and Italian-Japanese combinations are especially popular.",
        likes: 41,
        avatar: "FA"
      },
      {
        id: 13,
        user: "OsakaLocal",
        content: "大阪の食べ物は世界一です！この記事は私たちの食文化を完璧に表現しています。",
        likes: 27,
        avatar: "OL"
      },
      {
        id: 501,
        user: "ChefInTraining",
        content: "The creativity in Osaka's food scene is unmatched! Every dish tells a story of cultural fusion and innovation.",
        likes: 35,
        avatar: "CT"
      },
      {
        id: 502,
        user: "FoodCritic",
        content: "関西の味付けは本当に独特で美味しいです。特に出汁の文化は他の地域では味わえない深みがあります。",
        likes: 29,
        avatar: "FC"
      },
      {
        id: 503,
        user: "StreetFoodLover",
        content: "Dotonbori is a food paradise! The energy, the flavors, the atmosphere - it's an unforgettable culinary experience.",
        likes: 33,
        avatar: "SF"
      },
      {
        id: 504,
        user: "CulinaryExplorer",
        content: "大阪で食べた料理は忘れられません。伝統的な味と新しいアイデアの組み合わせが素晴らしいです。",
        likes: 24,
        avatar: "CE"
      }
    ],
    6: [
      {
        id: 14,
        user: "ArchitectureFan",
        content: "The blend of traditional and modern architecture in Japan is breathtaking. Every building tells a story!",
        likes: 19,
        avatar: "AF"
      },
      {
        id: 15,
        user: "DesignStudent",
        content: "日本の建築デザインから多くのインスピレーションを得ています。伝統と革新の完璧なバランスです。",
        likes: 24,
        avatar: "DS"
      },
      {
        id: 601,
        user: "UrbanPlanner",
        content: "Tokyo's skyline is a masterpiece of architectural evolution. Ancient temples coexist beautifully with modern skyscrapers.",
        likes: 32,
        avatar: "UP"
      },
      {
        id: 602,
        user: "BuildingEnthusiast",
        content: "木造建築の技術は本当に素晴らしいです。何百年も前の建物が今でも美しく保たれているのは驚きです。",
        likes: 28,
        avatar: "BE"
      },
      {
        id: 603,
        user: "ArchitecturalTourist",
        content: "Every visit to Japan reveals new architectural wonders. The attention to detail and craftsmanship is unparalleled!",
        likes: 26,
        avatar: "AT"
      },
      {
        id: 604,
        user: "ConstructionExpert",
        content: "日本の建築技術は世界最高レベルです。地震に強い構造と美しいデザインを両立させる技術力に感動します。",
        likes: 35,
        avatar: "CE"
      }
    ]
  };

  // Word click functionality with proper context
  const handleWordClick = async (word, isJapanese, context = null) => {
    // Find the comment that contains this word to get full context
    const comment = allComments.find(c => c.content.includes(word));

    let fullContext = context;
    let fullContextTranslation = null;

    if (comment) {
      fullContext = comment.content; // Use the comment content as context
      // Let the translation API handle the translation
    }

    await sharedHandleWordClick(word, setSelectedWord, isJapanese, fullContext, fullContextTranslation, setIsTranslating);
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
      let wordToAdd = {
        japanese: selectedWord.japanese,
        hiragana: selectedWord.hiragana,
        english: selectedWord.english,
        level: selectedWord.level,
        example: selectedWord.example,
        exampleEn: selectedWord.exampleEn
      };

      const isAlreadyInDictionary = userDictionary.some(item => 
        item.japanese === wordToAdd.japanese || item.english === wordToAdd.english
      );

      if (!isAlreadyInDictionary) {
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

  const handleLikeComment = (commentId) => {
    // Only allow liking once per comment
    if (!likedComments.has(commentId)) {
      const comment = allComments.find(c => c.id === commentId);
      const currentLikes = comment ? comment.likes : 0;
      
      setCommentLikes(prev => ({
        ...prev,
        [commentId]: currentLikes + 1
      }));
      setLikedComments(prev => new Set([...prev, commentId]));
    }
  };

  const handleReplyToComment = (username) => {
    setCommentText(`@${username} `);
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        commentInputRef.current.focus();
      }
    }, 100);
  };

  const renderClickableText = (text) => {
    const segments = text.split(/(\s+|[。、！？])/);
    
    return segments.map((segment, segmentIndex) => {
      if (!segment.trim()) return <span key={segmentIndex}>{segment}</span>;
      
      const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(segment);
      const hasEnglish = /[a-zA-Z]/.test(segment);
      
      if (hasJapanese) {
        return (
          <span key={segmentIndex}>
            {segment.split('').map((char, charIndex) => (
              <span
                key={`${segmentIndex}-${charIndex}`}
                className="cursor-pointer hover:bg-yellow-200 hover:shadow-sm border-b border-transparent hover:border-orange-300 rounded px-0.5 py-0.5 transition-all duration-200 inline-block"
                onClick={() => handleWordClick(char, true, text)}
                title={`Click to learn: ${char}`}
                style={{ textDecoration: 'none' }}
              >
                {char}
              </span>
            ))}
          </span>
        );
      } else if (hasEnglish) {
        return (
          <span key={segmentIndex}>
            <span
              className="cursor-pointer hover:bg-blue-100 hover:shadow-sm border-b border-transparent hover:border-blue-300 rounded px-1 py-0.5 transition-all duration-200"
              onClick={() => handleWordClick(segment.trim(), false, text)}
              title={`Click to learn: ${segment.trim()}`}
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

  const getLevelColor = (level) => {
    if (level <= 2) return 'bg-green-500';
    if (level <= 4) return 'bg-yellow-500';
    if (level <= 6) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const allComments = [...(mockComments[articleId] || []), ...comments];

  const handlePostComment = () => {
    if (commentText.trim()) {
      const newComment = {
        id: Date.now(),
        user: userProfile?.name || 'Anonymous',
        content: commentText,
        likes: 0,
        avatar: userProfile?.name?.charAt(0) || 'A'
      };
      
      setComments([newComment, ...comments]);
      setCommentText('');
      setShowSuccessMessage('Comment posted successfully!');
      setTimeout(() => setShowSuccessMessage(''), 2000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-orange-500" />
            Comments ({allComments.length})
          </h3>
        </div>
      </div>

      {/* Comment Input */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-orange-700">
              {userProfile?.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1">
            <textarea
              ref={commentInputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Share your thoughts... (You can write in any language)"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              rows={3}
            />
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowAIHelp(!showAIHelp)}
                  className="flex items-center space-x-1 text-sm text-gray-600 hover:text-orange-600"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>AI Help</span>
                </button>
              </div>
              
              <button 
                onClick={handlePostComment}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-1"
              >
                <Send className="w-4 h-4" />
                <span>Post</span>
              </button>
            </div>

            {showSuccessMessage && (
              <div className="mt-2 p-2 bg-green-100 text-green-800 rounded text-sm">
                {showSuccessMessage}
              </div>
            )}
          </div>
        </div>

        {/* AI Help Panel */}
        {showAIHelp && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-3">💡 AI Suggestions</h4>
            <div className="space-y-2">
              <div className="p-3 bg-white rounded border border-blue-200">
                <div className="text-sm text-gray-900 mb-1">This looks amazing! どこですか？</div>
                <div className="text-xs text-gray-600 italic">This looks amazing! Where is this?</div>
                <button
                  onClick={() => setCommentText("This looks amazing! どこですか？")}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  Use this suggestion
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comments List */}
      <div className="divide-y divide-gray-200">
        {allComments.map((comment) => (
          <div key={comment.id} className="p-6">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {comment.avatar}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium text-gray-900">{comment.user}</span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">2h ago</span>
                </div>
                <div className="text-gray-800 mb-3">
                  {renderClickableText(comment.content)}
                </div>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => handleLikeComment(comment.id)}
                    className={`flex items-center space-x-1 text-sm transition-colors ${
                      likedComments.has(comment.id) 
                        ? 'text-red-500' 
                        : 'text-gray-500 hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${likedComments.has(comment.id) ? 'fill-red-500' : ''}`} />
                    <span>{commentLikes[comment.id] || comment.likes}</span>
                  </button>
                  <button 
                    onClick={() => handleReplyToComment(comment.user)}
                    className="flex items-center space-x-1 text-sm text-gray-500 hover:text-orange-500"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Reply</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Word Learning Popup */}
      {(selectedWord || isTranslating) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            {isTranslating ? (
              <div className="text-center py-8">
                <LoadingSpinner size="lg" text="Translating..." />
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{selectedWord.japanese}</div>
                  <div className="text-lg text-gray-600 mb-2">{selectedWord.hiragana}</div>
                  <div className="text-sm text-gray-500 mb-2">Meaning:</div>
                  <div className="text-xl text-green-600 font-semibold">{selectedWord.english}</div>
                </div>

            {/* Level Badge */}
            {selectedWord.level && (
              <div className="mb-4 flex items-center space-x-2">
                <span className={`inline-block px-3 py-1 rounded-full text-white text-sm font-medium ${getLevelColor(selectedWord.level)}`}>
                  Level {selectedWord.level}
                </span>
                {selectedWord.isApiTranslated && (
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
            <div className="space-y-3">
              <button
                onClick={handleMastered}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Mastered! ✨
              </button>
              <button
                onClick={handleAddToDictionary}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Add to My Dictionary
              </button>
            </div>

            {/* Feedback Message */}
            {feedbackMessage && (
              <div className="mt-4 p-3 bg-green-100 text-green-800 rounded-lg text-center">
                <span className="text-lg mr-2">{feedbackMessage.icon}</span>
                {feedbackMessage.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedCommentSystem;
