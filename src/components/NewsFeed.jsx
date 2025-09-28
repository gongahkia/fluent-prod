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
      '世': { japanese: '世', hiragana: 'せ', english: 'world/generation', level: 4, example: '世界', exampleEn: 'world' },
      '代': { japanese: '代', hiragana: 'だい', english: 'generation/era', level: 4, example: '時代', exampleEn: 'era' },
      '提': { japanese: '提', hiragana: 'てい', english: 'present/offer', level: 5, example: '提供', exampleEn: 'provide' },
      '供': { japanese: '供', hiragana: 'きょう', english: 'offer/supply', level: 5, example: '提供', exampleEn: 'provide' },
      '若': { japanese: '若', hiragana: 'わか', english: 'young', level: 4, example: '若者', exampleEn: 'young people' },
      '者': { japanese: '者', hiragana: 'しゃ', english: 'person (suffix)', level: 3, example: '学者', exampleEn: 'scholar' },
      '変': { japanese: '変', hiragana: 'へん', english: 'change', level: 4, example: '変化', exampleEn: 'change' },
      '化': { japanese: '化', hiragana: 'か', english: 'change/transform', level: 4, example: '文化', exampleEn: 'culture' },
      '文': { japanese: '文', hiragana: 'ぶん', english: 'writing/culture', level: 3, example: '文化', exampleEn: 'culture' },
      '見': { japanese: '見', hiragana: 'み', english: 'see/look', level: 2, example: '見る', exampleEn: 'to see' },
      
      // Katakana characters
      'ラ': { japanese: 'ラ', hiragana: 'ら', english: 'ra (katakana)', level: 1, example: 'ラーメン', exampleEn: 'ramen' },
      'ー': { japanese: 'ー', hiragana: 'ー', english: 'long vowel mark', level: 1, example: 'ラーメン', exampleEn: 'ramen' },
      'メ': { japanese: 'メ', hiragana: 'め', english: 'me (katakana)', level: 1, example: 'ラーメン', exampleEn: 'ramen' },
      'ン': { japanese: 'ン', hiragana: 'ん', english: 'n (katakana)', level: 1, example: 'ラーメン', exampleEn: 'ramen' },
      
      // Words from actual posts with real sentences from the posts
      '地元': { japanese: '地元', hiragana: 'じもと', english: 'local area/hometown', level: 4, example: '地元の人だけが知る hidden ラーメン店', exampleEn: 'Hidden ramen shops that only local people know about' },
      'だけが': { japanese: 'だけが', hiragana: 'だけが', english: 'only (exclusive)', level: 3, example: '地元の人だけが知る hidden ラーメン店', exampleEn: 'Hidden ramen shops that only local people know about' },
      '知る': { japanese: '知る', hiragana: 'しる', english: 'to know/be aware of', level: 2, example: '地元の人だけが知る hidden ラーメン店', exampleEn: 'Hidden ramen shops that only local people know about' },
      'ラーメン': { japanese: 'ラーメン', hiragana: 'らーめん', english: 'ramen noodles', level: 3, example: 'これらの family-run business の店は何世代にもわたって authentic ラーメンを提供してきました。', exampleEn: 'These family-run business shops have been providing authentic ramen for many generations.' },
      '店': { japanese: '店', hiragana: 'みせ', english: 'shop/store', level: 2, example: 'これらの family-run business の店は何世代にもわたって authentic ラーメンを提供してきました。', exampleEn: 'These family-run business shops have been providing authentic ramen for many generations.' },
      '東京': { japanese: '東京', hiragana: 'とうきょう', english: 'Tokyo (capital of Japan)', level: 2, example: '東京の最も busy な地区で地下の food culture を探索。', exampleEn: 'Exploring underground food culture in Tokyo\'s busiest districts.' },
      '最も': { japanese: '最も', hiragana: 'もっとも', english: 'most/extremely', level: 5, example: '東京の最も busy な地区で地下の food culture を探索。', exampleEn: 'Exploring underground food culture in Tokyo\'s busiest districts.' },
      '地区': { japanese: '地区', hiragana: 'ちく', english: 'district/area', level: 4, example: '東京の最も busy な地区で地下の food culture を探索。', exampleEn: 'Exploring underground food culture in Tokyo\'s busiest districts.' },
      '地下': { japanese: '地下', hiragana: 'ちか', english: 'underground/basement', level: 3, example: '東京の最も busy な地区で地下の food culture を探索。', exampleEn: 'Exploring underground food culture in Tokyo\'s busiest districts.' },
      '探索': { japanese: '探索', hiragana: 'たんさく', english: 'exploration/investigation', level: 6, example: '東京の最も busy な地区で地下の food culture を探索。', exampleEn: 'Exploring underground food culture in Tokyo\'s busiest districts.' },
      'これらの': { japanese: 'これらの', hiragana: 'これらの', english: 'these (plural)', level: 3, example: 'これらの family-run business の店は何世代にもわたって authentic ラーメンを提供してきました。', exampleEn: 'These family-run business shops have been providing authentic ramen for many generations.' },
      '何世代': { japanese: '何世代', hiragana: 'なんせだい', english: 'many generations', level: 7, example: 'これらの family-run business の店は何世代にもわたって authentic ラーメンを提供してきました。', exampleEn: 'These family-run business shops have been providing authentic ramen for many generations.' },
      'にもわたって': { japanese: 'にもわたって', hiragana: 'にもわたって', english: 'over/spanning across', level: 8, example: 'これらの family-run business の店は何世代にもわたって authentic ラーメンを提供してきました。', exampleEn: 'These family-run business shops have been providing authentic ramen for many generations.' },
      '提供': { japanese: '提供', hiragana: 'ていきょう', english: 'provide/offer/supply', level: 6, example: 'これらの family-run business の店は何世代にもわたって authentic ラーメンを提供してきました。', exampleEn: 'These family-run business shops have been providing authentic ramen for many generations.' },
      'してきました': { japanese: 'してきました', hiragana: 'してきました', english: 'have been doing (continuous past)', level: 5, example: 'これらの family-run business の店は何世代にもわたって authentic ラーメンを提供してきました。', exampleEn: 'These family-run business shops have been providing authentic ramen for many generations.' },
      
      // Fashion and culture words
      '若者': { japanese: '若者', hiragana: 'わかもの', english: 'young people', level: 5, example: '若者たちは新しいファッションを作り出しています。', exampleEn: 'Young people are creating new fashion.' },
      '変化': { japanese: '変化', hiragana: 'へんか', english: 'change', level: 4, example: '東京のファッションは常に変化しています。', exampleEn: 'Tokyo fashion is constantly changing.' },
      'させています': { japanese: 'させています', hiragana: 'させています', english: 'causing to', level: 6, example: '新しい技術が社会を変化させています。', exampleEn: 'New technology is causing society to change.' },
      '見られます': { japanese: '見られます', hiragana: 'みられます', english: 'can be seen', level: 4, example: 'この地区では多くの変化が見られます。', exampleEn: 'Many changes can be seen in this district.' },
      
      // Common words
      '文化': { japanese: '文化', hiragana: 'ぶんか', english: 'culture', level: 5, example: '日本の文化は世界中で人気があります。', exampleEn: 'Japanese culture is popular around the world.' },
      '伝統': { japanese: '伝統', hiragana: 'でんとう', english: 'tradition', level: 6, example: '古い伝統と新しいアイデアが融合しています。', exampleEn: 'Old traditions and new ideas are merging.' },
      '桜': { japanese: '桜', hiragana: 'さくら', english: 'cherry blossom', level: 3, example: '春になると桜が美しく咲きます。', exampleEn: 'Cherry blossoms bloom beautifully in spring.' },
      '季節': { japanese: '季節', hiragana: 'きせつ', english: 'season', level: 4, example: '桜の季節は日本で最も美しい時期です。', exampleEn: 'Cherry blossom season is the most beautiful time in Japan.' },
      
      // Places
      '原宿': { japanese: '原宿', hiragana: 'はらじゅく', english: 'Harajuku', level: 4, example: '原宿で買い物', exampleEn: 'shopping in Harajuku' },
      '渋谷': { japanese: '渋谷', hiragana: 'しぶや', english: 'Shibuya', level: 4, example: '渋谷駅', exampleEn: 'Shibuya station' },
      '大阪': { japanese: '大阪', hiragana: 'おおさか', english: 'Osaka', level: 3, example: '大阪の食べ物', exampleEn: 'Osaka food' },
      '京都': { japanese: '京都', hiragana: 'きょうと', english: 'Kyoto', level: 3, example: '京都の寺', exampleEn: 'Kyoto temples' },
      '九州': { japanese: '九州', hiragana: 'きゅうしゅう', english: 'Kyushu', level: 5, example: '九州地方', exampleEn: 'Kyushu region' },
      
      // Missing words that were showing "Translation not available"
      '何世代にもわたって': { japanese: '何世代にもわたって', hiragana: 'なんせだいにもわたって', english: 'across many generations', level: 9, example: '何世代にもわたって伝統的なラーメンを作り続けています。', exampleEn: 'They have been making traditional ramen across many generations.' },
      '融': { japanese: '融', hiragana: 'ゆう', english: 'fusion/blend', level: 7, example: '融合', exampleEn: 'fusion' },
      '合': { japanese: '合', hiragana: 'ごう', english: 'combine/match', level: 4, example: '融合', exampleEn: 'fusion' },
      '古い': { japanese: '古い', hiragana: 'ふるい', english: 'old/ancient', level: 2, example: '古い tradition', exampleEn: 'old tradition' },
      
      // English words with Japanese translations (from actual posts)
      'hidden': { japanese: 'hidden', hiragana: 'ひどん', english: '隠れた', level: 4, example: '地元の人だけが知る hidden ラーメン店', exampleEn: 'Hidden ramen shops that only local people know about' },
      'culture': { japanese: 'culture', hiragana: 'かるちゃー', english: '文化', level: 4, example: '東京の最も busy な地区で地下の food culture を探索。', exampleEn: 'Exploring underground food culture in Tokyo\'s busiest districts.' },
      'business': { japanese: 'business', hiragana: 'びじねす', english: 'ビジネス', level: 5, example: 'これらの family-run business の店は何世代にもわたって authentic ラーメンを提供してきました。', exampleEn: 'These family-run business shops have been providing authentic ramen for many generations.' },
      'authentic': { japanese: 'authentic', hiragana: 'おーせんてぃっく', english: '本格的な', level: 6, example: 'これらの family-run business の店は何世代にもわたって authentic ラーメンを提供してきました。', exampleEn: 'These family-run business shops have been providing authentic ramen for many generations.' },
      'family-run': { japanese: 'family-run', hiragana: 'ふぁみりーらん', english: '家族経営の', level: 6, example: 'これらの family-run business の店は何世代にもわたって authentic ラーメンを提供してきました。', exampleEn: 'These family-run business shops have been providing authentic ramen for many generations.' },
      'food': { japanese: 'food', hiragana: 'ふーど', english: '食べ物', level: 3, example: '東京の最も busy な地区で地下の food culture を探索。', exampleEn: 'Exploring underground food culture in Tokyo\'s busiest districts.' },
      'busy': { japanese: 'busy', hiragana: 'びじー', english: '忙しい', level: 4, example: '東京の最も busy な地区で地下の food culture を探索。', exampleEn: 'Exploring underground food culture in Tokyo\'s busiest districts.' },
      'creativity': { japanese: 'creativity', hiragana: 'くりえいてぃびてぃ', english: '創造性', level: 5, example: 'Young people の creativity と self-expression は、Tokyo の fashion scene を constantly に変化させています。', exampleEn: 'Young people\'s creativity and self-expression are constantly changing Tokyo\'s fashion scene.' },
      'self-expression': { japanese: 'self-expression', hiragana: 'せるふえくすぷれっしょん', english: '自己表現', level: 6, example: 'Young people の creativity と self-expression は、Tokyo の fashion scene を constantly に変化させています。', exampleEn: 'Young people\'s creativity and self-expression are constantly changing Tokyo\'s fashion scene.' },
      'fashion': { japanese: 'fashion', hiragana: 'ふぁっしょん', english: 'ファッション', level: 4, example: 'Young people の creativity と self-expression は、Tokyo の fashion scene を constantly に変化させています。', exampleEn: 'Young people\'s creativity and self-expression are constantly changing Tokyo\'s fashion scene.' },
      'scene': { japanese: 'scene', hiragana: 'しーん', english: 'シーン', level: 4, example: 'Young people の creativity と self-expression は、Tokyo の fashion scene を constantly に変化させています。', exampleEn: 'Young people\'s creativity and self-expression are constantly changing Tokyo\'s fashion scene.' },
      'constantly': { japanese: 'constantly', hiragana: 'こんすたんとりー', english: '常に', level: 6, example: 'Young people の creativity と self-expression は、Tokyo の fashion scene を constantly に変化させています。', exampleEn: 'Young people\'s creativity and self-expression are constantly changing Tokyo\'s fashion scene.' },
      
      // Additional English words with Japanese translations
      'tradition': { japanese: 'tradition', hiragana: 'とらでぃしょん', english: '伝統', level: 5, example: '古い tradition と new generation の融合', exampleEn: 'Fusion of old tradition and new generation' },
      'new': { japanese: 'new', hiragana: 'にゅー', english: '新しい', level: 3, example: '古い tradition と new generation の融合', exampleEn: 'Fusion of old tradition and new generation' },
      'generation': { japanese: 'generation', hiragana: 'じぇねれーしょん', english: '世代', level: 5, example: '古い tradition と new generation の融合', exampleEn: 'Fusion of old tradition and new generation' },
      'style': { japanese: 'style', hiragana: 'すたいる', english: 'スタイル', level: 4, example: '生活 style が変化しています', exampleEn: 'Lifestyle is changing' },
      'Young': { japanese: 'Young', hiragana: 'やんぐ', english: '若い', level: 3, example: 'Young people の creativity', exampleEn: 'Young people\'s creativity' },
      'people': { japanese: 'people', hiragana: 'ぴーぷる', english: '人々', level: 2, example: 'Young people の creativity', exampleEn: 'Young people\'s creativity' },
      'Tokyo': { japanese: 'Tokyo', hiragana: 'とうきょう', english: '東京', level: 2, example: 'Tokyo の fashion scene', exampleEn: 'Tokyo fashion scene' },
      'Traditional': { japanese: 'Traditional', hiragana: 'とらでぃしょなる', english: '伝統的な', level: 5, example: 'Traditional elements と modern trends', exampleEn: 'Traditional elements and modern trends' },
      'elements': { japanese: 'elements', hiragana: 'えれめんつ', english: '要素', level: 5, example: 'Traditional elements と modern trends', exampleEn: 'Traditional elements and modern trends' },
      'modern': { japanese: 'modern', hiragana: 'もだん', english: '現代の', level: 4, example: 'Traditional elements と modern trends', exampleEn: 'Traditional elements and modern trends' },
      'trends': { japanese: 'trends', hiragana: 'とれんず', english: 'トレンド', level: 5, example: 'Traditional elements と modern trends', exampleEn: 'Traditional elements and modern trends' },
      'fusion': { japanese: 'fusion', hiragana: 'ふゅーじょん', english: '融合', level: 6, example: 'cultural fusion が見られます', exampleEn: 'Cultural fusion can be seen' },
      'Sakura': { japanese: 'Sakura', hiragana: 'さくら', english: '桜', level: 3, example: 'Sakura の季節は tourism に boost をもたらします', exampleEn: 'Sakura season brings a boost to tourism' },
      'tourism': { japanese: 'tourism', hiragana: 'つーりずむ', english: '観光', level: 5, example: 'Sakura の季節は tourism に boost をもたらします', exampleEn: 'Sakura season brings a boost to tourism' },
      'industry': { japanese: 'industry', hiragana: 'いんだすとりー', english: '産業', level: 5, example: 'tourism industry に massive な boost', exampleEn: 'Massive boost to tourism industry' },
      'massive': { japanese: 'massive', hiragana: 'ますぃぶ', english: '大規模な', level: 6, example: 'tourism industry に massive な boost', exampleEn: 'Massive boost to tourism industry' },
      'boost': { japanese: 'boost', hiragana: 'ぶーすと', english: '押し上げ', level: 5, example: 'tourism industry に massive な boost', exampleEn: 'Massive boost to tourism industry' },
      'Local': { japanese: 'Local', hiragana: 'ろーかる', english: '地元の', level: 3, example: 'Local businesses は special events を開催', exampleEn: 'Local businesses hold special events' },
      'businesses': { japanese: 'businesses', hiragana: 'びじねしず', english: '企業', level: 5, example: 'Local businesses は special events を開催', exampleEn: 'Local businesses hold special events' },
      'special': { japanese: 'special', hiragana: 'すぺしゃる', english: '特別な', level: 4, example: 'Local businesses は special events を開催', exampleEn: 'Local businesses hold special events' },
      'events': { japanese: 'events', hiragana: 'いべんつ', english: 'イベント', level: 4, example: 'Local businesses は special events を開催', exampleEn: 'Local businesses hold special events' },
      'limited-time': { japanese: 'limited-time', hiragana: 'りみてっどたいむ', english: '期間限定', level: 6, example: 'limited-time products で visitors を attract', exampleEn: 'Attract visitors with limited-time products' },
      'products': { japanese: 'products', hiragana: 'ぷろだくつ', english: '商品', level: 4, example: 'limited-time products で visitors を attract', exampleEn: 'Attract visitors with limited-time products' },
      'visitors': { japanese: 'visitors', hiragana: 'びじたーず', english: '訪問者', level: 4, example: 'limited-time products で visitors を attract', exampleEn: 'Attract visitors with limited-time products' },
      'attract': { japanese: 'attract', hiragana: 'あとらくと', english: '引きつける', level: 5, example: 'limited-time products で visitors を attract', exampleEn: 'Attract visitors with limited-time products' }
    };

    // Clean the word (remove punctuation)
    const cleanWord = word.replace(/[。、！？]/g, '');
    const wordData = japaneseWords[cleanWord];
    
    if (wordData) {
      // For English words, swap the display to show Japanese as the translation
      if (!isJapanese) {
        setSelectedWord({
          japanese: wordData.japanese, // Keep original English word
          hiragana: wordData.hiragana, // Katakana pronunciation
          english: wordData.english, // Japanese translation
          level: wordData.level,
          example: wordData.example,
          exampleEn: wordData.exampleEn,
          original: cleanWord,
          isJapanese: false, // Mark as English word
          showJapaneseTranslation: true // Flag to show Japanese translation
        });
      } else {
        setSelectedWord({
          ...wordData,
          original: cleanWord,
          isJapanese: isJapanese
        });
      }
    } else {
      // Create a basic translation for unknown words
      let basicTranslation = 'Unknown word';
      let basicHiragana = cleanWord;
      let basicExample = `${cleanWord}の例文です。`;
      let basicExampleEn = `Example sentence with ${cleanWord}.`;
      
      // Try to provide some basic meaning based on character patterns
      if (isJapanese) {
        if (/[\u4E00-\u9FAF]/.test(cleanWord)) {
          // Contains kanji
          basicTranslation = 'Japanese word (kanji)';
          basicExample = `この${cleanWord}は重要です。`;
          basicExampleEn = `This ${cleanWord} is important.`;
        } else if (/[\u3040-\u309F]/.test(cleanWord)) {
          // Hiragana
          basicTranslation = 'Japanese word (hiragana)';
          basicExample = `${cleanWord}を使います。`;
          basicExampleEn = `Use ${cleanWord}.`;
        } else if (/[\u30A0-\u30FF]/.test(cleanWord)) {
          // Katakana
          basicTranslation = 'Japanese word (katakana)';
          basicExample = `${cleanWord}は外来語です。`;
          basicExampleEn = `${cleanWord} is a foreign word.`;
        }
      } else {
        // English word
        basicTranslation = cleanWord.toLowerCase();
        basicHiragana = cleanWord;
        basicExample = `This is ${cleanWord}.`;
        basicExampleEn = `This is ${cleanWord}.`;
      }
      
      console.log(`Word not found in database: ${cleanWord}, providing basic translation: ${basicTranslation}`);
      setSelectedWord({
        japanese: cleanWord,
        hiragana: basicHiragana,
        english: basicTranslation,
        level: 5,
        example: basicExample,
        exampleEn: basicExampleEn,
        original: cleanWord,
        isJapanese: isJapanese
      });
    }
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
        // For English words, make the whole word clickable
        return (
          <span key={segmentIndex}>
            <span
              className="cursor-pointer hover:bg-gray-100 hover:shadow-sm border-b border-transparent hover:border-gray-300 rounded px-1 py-0.5 transition-all duration-200"
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

  if (!selectedCountry) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
            <h1 className="text-2xl font-bold text-gray-900">日本のトレンド</h1>
            <p className="text-gray-600">地域で何が起こっているかを発見・トレンドニュース</p>
          </div>
          <div className="text-4xl">🇯🇵</div>
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

      {/* Source Count Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-semibold">7</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Free Sources</h3>
              <p className="text-sm text-gray-600">Basic content from public feeds</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-orange-50 rounded-lg shadow-sm border border-purple-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-orange-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 flex items-center space-x-2">
                <span>Premium Sources</span>
                <span className="text-yellow-500">⭐</span>
              </h3>
              <p className="text-sm text-gray-600">Pulling from 8 exclusive premium feeds</p>
            </div>
          </div>
        </div>
      </div>

      {/* Translation Loading Popup */}
      {isTranslating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <LoadingSpinner size="lg" text="Translating..." />
            </div>
          </div>
        </div>
      )}

      {/* Japanese Word Learning Popup */}
      {selectedWord && !isTranslating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSelectedWord(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md mx-4" onClick={e => e.stopPropagation()}>
            {!feedbackMessage ? (
              <div className="text-center">
                {/* Word Display - handles both Japanese and English words */}
                <div className="mb-4">
                  {selectedWord.showJapaneseTranslation ? (
                    // English word showing Japanese translation
                    <>
                      <div className="text-3xl font-bold text-gray-900 mb-1">{selectedWord.japanese}</div>
                      <div className="text-lg text-gray-600 mb-2">{selectedWord.hiragana}</div>
                      <div className="text-xl text-orange-600 font-semibold">Japanese: {selectedWord.english}</div>
                    </>
                  ) : (
                    // Japanese word showing English translation
                    <>
                      <div className="text-3xl font-bold text-gray-900 mb-1">{selectedWord.japanese}</div>
                      {selectedWord.hiragana !== selectedWord.japanese && (
                        <div className="text-lg text-gray-600 mb-2">{selectedWord.hiragana}</div>
                      )}
                      <div className="text-xl text-orange-600 font-semibold">{selectedWord.english}</div>
                    </>
                  )}
                </div>

                {/* Level Badge */}
                {selectedWord.level && (
                  <div className="mb-4 flex items-center space-x-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-white text-sm font-medium ${getLevelColor(selectedWord.level)}`}>
                      Level {selectedWord.level}
                    </span>
                    {selectedWord.isApiTranslated && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
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
                    className="w-full bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
                    onClick={handleMastered}
                  >
                    Mastered! ✨
                  </button>
                  <button
                    className="w-full bg-gray-900 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors flex items-center justify-center space-x-1"
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

      {/* Posts */}
      {(searchResults.length > 0 ? searchResults : japaneseArticles).map((article) => (
        <div key={article.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Article Header */}
          <div className="p-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {article.author.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{article.author}</span>
                    {article.verified && (
                      <div className="bg-gray-600 text-white px-2 py-1 rounded text-xs font-medium">
                        Verified
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {article.location} • {article.time}
                  </div>
                </div>
                <button
                  onClick={() => handleFollowToggle(article.author)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    followingUsers.has(article.author)
                      ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                  href={article.externalUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="See original post"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <span className="bg-gray-600 text-white px-2 py-1 rounded text-xs font-medium">
                  Level {article.difficulty}
                </span>
              </div>
            </div>

            {/* Article Content */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                {renderClickableText(article.title)}
              </h2>
              <p className="text-gray-800 leading-relaxed mb-4">
                {renderClickableText(article.content)}
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
                    {getCommentCount(article.id)} comments
                  </span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 hover:text-green-500 transition-colors">
                  <Share className="w-5 h-5" />
                  <span className="text-sm font-medium">{article.shares} shares</span>
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

