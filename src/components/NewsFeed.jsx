import React, { useState } from 'react';
import { Bookmark, MessageCircle, Share, Send, BookOpen, Sparkles, UserPlus, UserCheck } from 'lucide-react';
import EnhancedCommentSystem from './EnhancedCommentSystem';
import LoadingSpinner from './ui/LoadingSpinner';
import { handleWordClick as sharedHandleWordClick } from '../lib/wordDatabase';

const NewsFeed = ({ selectedCountry, userProfile, onAddWordToDictionary, userDictionary }) => {
  const [showComments, setShowComments] = useState({});
  const [selectedWord, setSelectedWord] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [followingUsers, setFollowingUsers] = useState(new Set(['佐藤博', '高橋美咲']));
  const [isTranslating, setIsTranslating] = useState(false);

  // Enhanced Japanese posts with mixed Japanese/English content for intermediate learners
  const japaneseArticles = [
    {
      id: 1,
      author: "田中雪",
      authorEn: "Yuki Tanaka",
      verified: true,
      location: "渋谷、Tokyo",
      time: "3 hours ago",
      title: "地元の人だけが知る hidden ラーメン店",
      content: "東京の最も busy な地区で地下の food culture を探索。これらの family-run business の店は何世代にもわたって authentic ラーメンを提供してきました。",
      image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=400&fit=crop",
      tags: ["#グルメ", "#culture", "#local"],
      likes: 2847,
      comments: 156,
      shares: 89,
      source: "twitter",
      originalSource: "Twitter",
      externalUrl: "https://twitter.com/yukitanaka/status/123456789",
      difficulty: 6
    },
    {
      id: 3,
      author: "山田花子",
      authorEn: "Hanako Yamada",
      verified: false,
      location: "原宿、Tokyo",
      time: "8 hours ago",
      title: "Street fashion の evolution in Harajuku",
      content: "Young people の creativity と self-expression は、Tokyo の fashion scene を constantly に変化させています。Traditional elements と modern trends の fusion が見られます。",
      image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&h=400&fit=crop",
      tags: ["#ファッション", "#youth", "#creativity"],
      likes: 892,
      comments: 45,
      shares: 67,
      source: "instagram",
      originalSource: "Instagram",
      externalUrl: "https://instagram.com/p/harajuku_fashion_2024",
      difficulty: 5
    },
    {
      id: 4,
      author: "鈴木太郎",
      authorEn: "Taro Suzuki",
      verified: true,
      location: "新宿、Tokyo",
      time: "12 hours ago",
      title: "Cherry blossom season の economic impact",
      content: "Sakura の季節は tourism industry に massive な boost をもたらします。Local businesses は special events と limited-time products で visitors を attract しています。",
      image: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=600&h=400&fit=crop",
      tags: ["#桜", "#tourism", "#economy"],
      likes: 1234,
      comments: 78,
      shares: 156,
      source: "line",
      originalSource: "LINE",
      externalUrl: "https://line.me/R/msg/text/?sakura_economics_2024",
      difficulty: 8
    },
    {
      id: 5,
      author: "高橋美咲",
      authorEn: "Misaki Takahashi",
      verified: true,
      location: "京都",
      time: "1 day ago",
      title: "Traditional tea ceremony meets modern lifestyle",
      content: "古い tradition と new generation の生活 style が融合。Young Japanese people は tea ceremony を modern way で楽しんでいます。Instagram で sharing する culture も生まれています。",
      image: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&h=400&fit=crop",
      tags: ["#茶道", "#tradition", "#modern"],
      likes: 1876,
      comments: 134,
      shares: 298,
      source: "tiktok",
      originalSource: "TikTok",
      externalUrl: "https://tiktok.com/@misaki_tea/video/123456789",
      difficulty: 4
    },
    {
      id: 6,
      author: "中村健一",
      authorEn: "Kenichi Nakamura",
      verified: false,
      location: "大阪",
      time: "1 day ago",
      title: "Osaka の street food revolution が始まっている",
      content: "Traditional takoyaki と okonomiyaki に加えて、fusion cuisine が人気。Korean-Japanese と Italian-Japanese の combination が特に popular です。",
      image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop",
      tags: ["#大阪", "#streetfood", "#fusion"],
      likes: 2156,
      comments: 187,
      shares: 145,
      source: "facebook",
      originalSource: "Facebook",
      externalUrl: "https://facebook.com/osaka.streetfood/posts/123456789",
      difficulty: 6
    },
    {
      id: 7,
      author: "小林さくら",
      authorEn: "Sakura Kobayashi",
      verified: true,
      location: "横浜",
      time: "2 days ago",
      title: "Working from home culture in Japan の変化",
      content: "Pandemic 以降、Japanese companies の work style が大きく変わりました。Remote work と traditional office culture の balance を見つけることが challenge です。",
      image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=400&fit=crop",
      tags: ["#リモートワーク", "#culture", "#change"],
      likes: 987,
      comments: 92,
      shares: 76,
      source: "reddit",
      originalSource: "Reddit",
      externalUrl: "https://reddit.com/r/japanlife/comments/remote_work_culture",
      difficulty: 7
    },
    {
      id: 8,
      author: "森田大輔",
      authorEn: "Daisuke Morita",
      verified: true,
      location: "福岡",
      time: "3 days ago",
      title: "九州の hidden gem destinations が international attention を集めている",
      content: "Kyushu region の beautiful nature と rich history が foreign tourists に人気。Local communities も tourism development に積極的に participate しています。",
      image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&h=400&fit=crop",
      tags: ["#九州", "#tourism", "#nature"],
      likes: 1543,
      comments: 118,
      shares: 203,
      source: "instagram",
      originalSource: "Instagram",
      externalUrl: "https://instagram.com/p/kyushu_hidden_gems_2024`",
      difficulty: 5
    }
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const getLevelColor = (level) => {
    if (level <= 3) return 'bg-gray-400';
    if (level <= 6) return 'bg-gray-500';
    if (level <= 8) return 'bg-gray-600';
    return 'bg-gray-800';
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
      // Simulate search delay
      setTimeout(() => {
        // Return random posts from existing set
        const shuffled = [...japaneseArticles].sort(() => 0.5 - Math.random());
        setSearchResults(shuffled.slice(0, 3));
        setIsSearching(false);
      }, 1500);
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

  // Removed unused handleWordClickOld function

  // Function to segment Japanese text into meaningful words/phrases
  const segmentJapaneseText = (text) => {
    // Define common Japanese word patterns and boundaries
    const wordPatterns = [
      '地元の人だけが知る', '何世代にもわたって', 'これらの', 'family-run', 'self-expression',
      'limited-time', 'constantly', 'Traditional', 'businesses', 'generation',
      '地元', '人だけが', 'だけが', '知る', 'ラーメン', '東京', '最も', '地区', '地下', '探索',
      '何世代', 'にもわたって', '提供', 'してきました', '若者', 'creativity', 'させています',
      '変化', '見られます', '文化', '伝統', '桜', '季節', '原宿', '渋谷', '大阪', '京都', '九州',
      '古い', '生活', 'tradition', 'elements', 'products', 'visitors', 'attract',
      'Young', 'people', 'Tokyo', 'modern', 'trends', 'fusion', 'Sakura', 'tourism',
      'industry', 'massive', 'boost', 'Local', 'special', 'events', 'hidden',
      'gems', 'incredible', 'cultural', 'expressions', 'blend', 'perfectly'
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

      // If no pattern matched, take one character
      if (!matched) {
        result.push({ text: remaining[0], isWord: false });
        remaining = remaining.slice(1);
      }
    }

    return result;
  };

  const renderClickableText = (text) => {
    // Split by spaces and punctuation first
    const segments = text.split(/(\s+|[。、！？])/);

    return segments.map((segment, segmentIndex) => {
      if (!segment.trim()) return <span key={segmentIndex}>{segment}</span>;

      const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(segment);
      const hasEnglish = /[a-zA-Z]/.test(segment);

      if (hasJapanese) {
        // Use intelligent segmentation for Japanese text
        const words = segmentJapaneseText(segment);

        return (
          <span key={segmentIndex}>
            {words.map((wordObj, wordIndex) => {
              const { text, isWord } = wordObj;

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

  // Mock articles data
  const mockArticles = [
    {
      id: 1,
      user: {
        name: "Tokyo Food Explorer",
        handle: "@tokyofoodie_jp",
        avatar: "TF",
        verified: true,
        location: "渋谷、Tokyo",
        time: "3 hours ago",
        title: "地元の人だけが知る hidden ラーメン店",
        content: "東京の最も busy な地区で地下の food culture を探索。これらの family-run business の店は何世代にもわたって authentic ラーメンを提供してきました。",
        likes: 342,
        comments: 45,
        shares: 23,
        isJapanese: true
      }
    }
  ];

  const filteredArticles = mockArticles;

  return (
    <div className="space-y-6">
      {/* News feed placeholder */}
      <div>News feed component</div>
    </div>
  );
};

export default NewsFeed;
