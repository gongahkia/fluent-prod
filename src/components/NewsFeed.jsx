import React, { useState } from 'react';
import { Bookmark, MessageCircle, Share, Send, BookOpen, Sparkles, UserPlus, UserCheck } from 'lucide-react';
import EnhancedCommentSystem from './EnhancedCommentSystem';

const NewsFeed = ({ selectedCountry, selectedLanguage, userProfile, isActive = true }) => {
  const [showComments, setShowComments] = useState({});
  const [selectedWord, setSelectedWord] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [followingUsers, setFollowingUsers] = useState(new Set(['佐藤博', '高橋美咲']));

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
      externalUrl: "https://instagram.com/p/kyushu_hidden_gems_2024",
      difficulty: 5
    }
  ];

  // Spanish articles with mixed Spanish/English content for intermediate learners
  const spanishArticles = [
    {
      id: 101,
      author: "María García",
      authorEn: "María García",
      verified: true,
      location: "Barcelona, España",
      time: "hace 2 horas",
      title: "Los mercados locales que only locals conocen",
      content: "Barcelona tiene amazing mercados tradicionales donde la gente local shops for authentic productos. Estas family-run businesses han estado serving la comunidad for generations.",
      image: "https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=600&h=400&fit=crop",
      tags: ["#comida", "#local", "#tradition"],
      likes: 1847,
      comments: 234,
      shares: 156,
      source: "instagram",
      originalSource: "Instagram",
      externalUrl: "https://instagram.com/p/barcelona_markets_2024",
      difficulty: 6
    },
    {
      id: 102,
      author: "Carlos Rodríguez",
      authorEn: "Carlos Rodríguez",
      verified: false,
      location: "Madrid, España",
      time: "hace 5 horas",
      title: "Street art revolution en los barrios históricos",
      content: "Young artists están transforming las paredes of Madrid con incredible murales. Esta fusion de traditional architecture y modern creativity está creating un unique cultural landscape.",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop",
      tags: ["#arte", "#cultura", "#juventud"],
      likes: 923,
      comments: 67,
      shares: 89,
      source: "twitter",
      originalSource: "Twitter",
      externalUrl: "https://twitter.com/carlos_art/status/madrid_street_art",
      difficulty: 5
    },
    {
      id: 103,
      author: "Ana Martínez",
      authorEn: "Ana Martínez",
      verified: true,
      location: "Sevilla, España",
      time: "hace 8 horas",
      title: "Flamenco meets modern technology en los studios",
      content: "Traditional flamenco dancers están using new digital platforms para teach y share their art. Social media está helping preserve esta beautiful tradition mientras reaching nuevas generaciones.",
      image: "https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?w=600&h=400&fit=crop",
      tags: ["#flamenco", "#tradición", "#tecnología"],
      likes: 2156,
      comments: 189,
      shares: 298,
      source: "tiktok",
      originalSource: "TikTok",
      externalUrl: "https://tiktok.com/@ana_flamenco/video/modern_tradition",
      difficulty: 7
    },
    {
      id: 104,
      author: "Diego López",
      authorEn: "Diego López",
      verified: true,
      location: "Valencia, España",
      time: "hace 12 horas",
      title: "Las Fallas festival prepares for digital transformation",
      content: "Valencia's famous festival está incorporating AR technology y virtual experiences. Esta combination de ancient traditions y cutting-edge innovation está attracting visitors from around the world.",
      image: "https://images.unsplash.com/photo-1539650116574-75c0c6dee9d4?w=600&h=400&fit=crop",
      tags: ["#fallas", "#innovation", "#festival"],
      likes: 1567,
      comments: 134,
      shares: 203,
      source: "facebook",
      originalSource: "Facebook",
      externalUrl: "https://facebook.com/valencia.fallas/posts/digital_transformation_2024",
      difficulty: 8
    },
    {
      id: 105,
      author: "Isabel Fernández",
      authorEn: "Isabel Fernández",
      verified: false,
      location: "Granada, España",
      time: "hace 1 día",
      title: "Working from home culture en España después de pandemic",
      content: "Spanish companies han adopted flexible work arrangements. Esta shift hacia remote work está changing traditional office culture mientras maintaining la importance of personal relationships.",
      image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=400&fit=crop",
      tags: ["#trabajo", "#remoto", "#cultura"],
      likes: 892,
      comments: 78,
      shares: 145,
      source: "linkedin",
      originalSource: "LinkedIn",
      externalUrl: "https://linkedin.com/in/isabel-fernandez/posts/remote-work-spain",
      difficulty: 6
    },
    {
      id: 106,
      author: "Alejandro Ruiz",
      authorEn: "Alejandro Ruiz",
      verified: true,
      location: "Bilbao, España",
      time: "hace 2 días",
      title: "Sustainable tourism en el País Vasco está growing",
      content: "Basque region está promoting eco-friendly tourism y local experiences. Travelers want authentic connections con la cultura local mientras protecting el beautiful landscape para future generations.",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
      tags: ["#turismo", "#sostenible", "#euskadi"],
      likes: 1234,
      comments: 92,
      shares: 167,
      source: "reddit",
      originalSource: "Reddit",
      externalUrl: "https://reddit.com/r/spain/comments/sustainable_tourism_basque",
      difficulty: 5
    }
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const getLevelColor = (level) => {
    if (level <= 3) return 'bg-green-500';
    if (level <= 6) return 'bg-blue-500';
    if (level <= 8) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const showFeedback = (message, icon) => {
    setFeedbackMessage({ message, icon });
  };

  const handleGotIt = () => {
    const message = selectedLanguage === 'spanish' ? '¡Entendido!' : 'Ganbatte!';
    showFeedback(message, '💪');
    // Close sidebar after showing feedback
    setTimeout(() => {
      setSelectedWord(null);
      setFeedbackMessage(null);
    }, 2000);
  };

  const handleAddToDictionary = () => {
    const message = selectedLanguage === 'spanish' ? '¡Guardado en diccionario!' : 'Saved to dictionary!';
    showFeedback(message, '✓');
    // Close sidebar after showing feedback
    setTimeout(() => {
      setSelectedWord(null);
      setFeedbackMessage(null);
    }, 2000);
  };

  const handleMastered = () => {
    const message = selectedLanguage === 'spanish' ? '¡Dominado!' : 'Sugoi!';
    showFeedback(message, '😊');
    // Close sidebar after showing feedback
    setTimeout(() => {
      setSelectedWord(null);
      setFeedbackMessage(null);
    }, 2000);
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
        // Return random posts from the appropriate language set
        const articles = selectedLanguage === 'spanish' ? spanishArticles : japaneseArticles;
        const shuffled = [...articles].sort(() => 0.5 - Math.random());
        setSearchResults(shuffled.slice(0, 3));
        setIsSearching(false);
      }, 1500);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  // Get current articles based on selected language
  const getCurrentArticles = () => {
    return selectedLanguage === 'spanish' ? spanishArticles : japaneseArticles;
  };

  const renderSourceBadge = (source) => {
    const sourceConfig = {
      twitter: { color: 'bg-blue-500', icon: '🐦', name: 'Twitter' },
      reddit: { color: 'bg-orange-600', icon: '🤖', name: 'Reddit' },
      instagram: { color: 'bg-pink-500', icon: '📷', name: 'Instagram' },
      line: { color: 'bg-green-500', icon: '💬', name: 'LINE' },
      tiktok: { color: 'bg-black', icon: '🎵', name: 'TikTok' },
      facebook: { color: 'bg-blue-600', icon: '👥', name: 'Facebook' }
    };

    const config = sourceConfig[source] || { color: 'bg-gray-500', icon: '📱', name: 'Social' };
    
    return (
      <div className={`inline-flex items-center space-x-1 ${config.color} text-white px-2 py-1 rounded-full text-xs font-medium`}>
        <span>{config.icon}</span>
        <span>{config.name}</span>
      </div>
    );
  };

  const toggleComments = (articleId) => {
    setShowComments(prev => ({
      ...prev,
      [articleId]: !prev[articleId]
    }));
  };

  const handleWordClick = (word, isJapanese) => {
    // Simple word translation logic
    const translations = {
      // Japanese translations
      'の': { translation: 'to', level: 2 },
      'が見られます。': { translation: 'is seen', level: 10 },
      '地元の人だけが知る': { translation: 'only locals know', level: 9 },
      '東京の最も': { translation: 'Tokyo\'s most', level: 8 },
      'な地区で地下の': { translation: 'underground in', level: 7 },
      'を探索。これらの': { translation: 'explore these', level: 6 },
      'ラーメンを提供してきました。': { translation: 'ramen provided', level: 6 },
      'の店は何世代にもわたって': { translation: 'store has been', level: 5 },
      'な日本の美学と最先端': { translation: 'Japanese aesthetics and cutting-edge', level: 4 },
      'を組み合わせ、没入型の': { translation: 'combination of', level: 9 },
      'に積極的に': { translation: 'dedicated', level: 8 },
      'も': { translation: 'also', level: 7 },
      'に人気。Local': { translation: 'popular', level: 6 },
      'が': { translation: 'is', level: 5 },
      '九州の': { translation: 'of Kyushu', level: 4 },
      'を集めている': { translation: 'collecting', level: 3 },
      'の季節は': { translation: 'season is', level: 2 },
      'をもたらしま': { translation: 'offers', level: 1 },
      'に変化させています': { translation: 'changes', level: 1 },
      'も生まれています': { translation: 'are born', level: 1 },
      'が始まっている': { translation: 'is starting', level: 1 },
      'の変化': { translation: 'changes', level: 1 },
      'が大きく変わりまし': { translation: 'changes', level: 1 },
      'を見つけることが': { translation: 'find', level: 1 },
      'しています。': { translation: 'is seen', level: 1 },
      'に加えて、fusion': { translation: 'fusion', level: 1 },
      'で楽しんでいます。Instagram': { translation: 'Instagram', level: 1 },
      'この': { translation: 'this', level: 2 },
      'です': { translation: 'is/am/are', level: 1 },
      'と': { translation: 'and/with', level: 2 },
      'ラーメン': { translation: 'ramen noodles', level: 3 },
      '隠れた': { translation: 'hidden', level: 6 },
      '本格的な': { translation: 'authentic', level: 8 },
      'には': { translation: 'in/at/to', level: 4 },
      'があります': { translation: 'there is/are', level: 3 },
      'は': { translation: 'topic marker', level: 1 },
      'で': { translation: 'at/in/by', level: 2 },
      'おじいさん': { translation: 'old man/grandfather', level: 4 },
      '中国にも': { translation: 'in China too', level: 5 },
      '本当に': { translation: 'really/truly', level: 4 },
      'だと思います': { translation: 'I think that', level: 6 },
      'ですね': { translation: 'isn\'t it/right?', level: 3 },
      'universal': { translation: 'universal', level: 5 },
      'language': { translation: 'language', level: 4 },
      '中国也有樱花': { translation: 'China also has cherry blossoms', level: 7 },
      'culture': { translation: 'culture', level: 4 },
      '文化': { translation: 'culture', level: 5 },
      '伝統': { translation: 'tradition', level: 6 },
      '現代': { translation: 'modern', level: 5 },
      '組み合わせ': { translation: 'combination', level: 7 },
      '魅力的': { translation: 'attractive/charming', level: 6 },
      'いつか': { translation: 'someday', level: 4 },
      '日本を訪れて': { translation: 'visit Japan', level: 6 },
      '体験したい': { translation: 'want to experience', level: 5 },
      '素晴らしい': { translation: 'wonderful', level: 6 },
      '投稿': { translation: 'post', level: 5 },
      'ありがとうございます': { translation: 'thank you', level: 3 },
      'この場所に': { translation: 'to this place', level: 4 },
      '行ってみたい': { translation: 'want to go/try', level: 5 },
      '日本語': { translation: 'Japanese language', level: 4 },
      '若者': { translation: 'young people', level: 5 },
      '原宿': { translation: 'Harajuku', level: 4 },
      '桜': { translation: 'cherry blossom', level: 3 },

      // Spanish translations
      'mercados': { translation: 'markets', level: 3 },
      'locales': { translation: 'local', level: 4 },
      'que': { translation: 'that/which', level: 2 },
      'only': { translation: 'only', level: 3 },
      'locals': { translation: 'locals', level: 4 },
      'conocen': { translation: 'know', level: 5 },
      'Barcelona': { translation: 'Barcelona', level: 1 },
      'tiene': { translation: 'has', level: 3 },
      'amazing': { translation: 'amazing', level: 4 },
      'tradicionales': { translation: 'traditional', level: 6 },
      'donde': { translation: 'where', level: 4 },
      'la': { translation: 'the', level: 1 },
      'gente': { translation: 'people', level: 3 },
      'local': { translation: 'local', level: 4 },
      'shops': { translation: 'shops', level: 3 },
      'for': { translation: 'for', level: 2 },
      'authentic': { translation: 'authentic', level: 6 },
      'productos': { translation: 'products', level: 5 },
      'Estas': { translation: 'These', level: 4 },
      'family-run': { translation: 'family-run', level: 7 },
      'businesses': { translation: 'businesses', level: 6 },
      'han': { translation: 'have', level: 4 },
      'estado': { translation: 'been', level: 5 },
      'serving': { translation: 'serving', level: 5 },
      'comunidad': { translation: 'community', level: 6 },
      'generations': { translation: 'generations', level: 7 },
      'artistas': { translation: 'artists', level: 5 },
      'están': { translation: 'are', level: 3 },
      'transforming': { translation: 'transforming', level: 8 },
      'las': { translation: 'the', level: 1 },
      'paredes': { translation: 'walls', level: 6 },
      'Madrid': { translation: 'Madrid', level: 1 },
      'con': { translation: 'with', level: 2 },
      'incredible': { translation: 'incredible', level: 6 },
      'murales': { translation: 'murals', level: 7 },
      'Esta': { translation: 'This', level: 3 },
      'fusion': { translation: 'fusion', level: 6 },
      'de': { translation: 'of/from', level: 1 },
      'traditional': { translation: 'traditional', level: 5 },
      'architecture': { translation: 'architecture', level: 7 },
      'y': { translation: 'and', level: 1 },
      'modern': { translation: 'modern', level: 5 },
      'creativity': { translation: 'creativity', level: 8 },
      'creating': { translation: 'creating', level: 6 },
      'un': { translation: 'a', level: 1 },
      'unique': { translation: 'unique', level: 6 },
      'cultural': { translation: 'cultural', level: 7 },
      'landscape': { translation: 'landscape', level: 8 },
      'flamenco': { translation: 'flamenco', level: 5 },
      'dancers': { translation: 'dancers', level: 6 },
      'using': { translation: 'using', level: 4 },
      'new': { translation: 'new', level: 3 },
      'digital': { translation: 'digital', level: 6 },
      'platforms': { translation: 'platforms', level: 7 },
      'para': { translation: 'to/for', level: 2 },
      'teach': { translation: 'teach', level: 5 },
      'share': { translation: 'share', level: 4 },
      'their': { translation: 'their', level: 3 },
      'art': { translation: 'art', level: 4 },
      'Social': { translation: 'Social', level: 5 },
      'media': { translation: 'media', level: 5 },
      'helping': { translation: 'helping', level: 6 },
      'preserve': { translation: 'preserve', level: 8 },
      'esta': { translation: 'this', level: 3 },
      'beautiful': { translation: 'beautiful', level: 5 },
      'tradition': { translation: 'tradition', level: 7 },
      'mientras': { translation: 'while', level: 6 },
      'reaching': { translation: 'reaching', level: 7 },
      'nuevas': { translation: 'new', level: 4 },
      'generaciones': { translation: 'generations', level: 8 }
    };

    const translationData = translations[word.toLowerCase()];
    if (translationData) {
      setSelectedWord({
        original: word,
        translation: translationData.translation,
        level: translationData.level,
        isJapanese: isJapanese
      });
    }
  };

  const renderClickableText = (text) => {
    // Split text into words and make them clickable
    const words = text.split(/(\s+)/);
    
    return words.map((word, index) => {
      const cleanWord = word.trim();
      if (!cleanWord) return word;
      
      // Detect if word contains Japanese or Spanish characters
      const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(cleanWord);
      const hasSpanish = /[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/.test(cleanWord);
      const hasEnglish = /[a-zA-Z]/.test(cleanWord);

      if (hasJapanese || hasSpanish || hasEnglish) {
        return (
          <span key={index}>
            <span
              className="cursor-pointer hover:bg-yellow-100 hover:underline rounded px-1 transition-colors"
              onClick={() => handleWordClick(cleanWord, hasJapanese)}
            >
              {cleanWord}
            </span>
            {word.includes(' ') && ' '}
          </span>
        );
      }
      
      return <span key={index}>{word}</span>;
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
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedLanguage === 'spanish' ? 'Tendencias de España' : '日本のトレンド'}
            </h1>
            <p className="text-gray-600">
              {selectedLanguage === 'spanish'
                ? 'Descubre qué está pasando en la región • Noticias de tendencias'
                : '地域で何が起こっているかを発見・トレンドニュース'
              }
            </p>
          </div>
          <div className="text-4xl">{selectedLanguage === 'spanish' ? '🇪🇸' : '🇯🇵'}</div>
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
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold">7</span>
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

      {/* Translation Sidebar - only show when NewsFeed is active */}
      {isActive && (
        <div className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl border-l border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${
          selectedWord ? 'translate-x-0' : 'translate-x-full'
        }`}>
        {selectedWord && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Translation</h3>
              <button
                onClick={() => setSelectedWord(null)}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              {!feedbackMessage ? (
                <div className="space-y-6">
                  {/* Word Display */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900 mb-3">{selectedWord.original}</div>
                    <div className="text-xl text-gray-600 mb-4">{selectedWord.translation}</div>
                    {selectedWord.level && (
                      <div className="mb-6">
                        <span className={`inline-block px-4 py-2 rounded-full text-white text-sm font-medium ${getLevelColor(selectedWord.level)}`}>
                          Level {selectedWord.level}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      className="w-full bg-orange-500 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                      onClick={handleGotIt}
                    >
                      Got it!
                    </button>
                    <button
                      className="w-full bg-green-500 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                      onClick={handleMastered}
                    >
                      Mastered
                    </button>
                    <button
                      className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                      onClick={handleAddToDictionary}
                    >
                      Add to Dictionary
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-6">{feedbackMessage.icon}</div>
                  <div className="text-2xl font-semibold text-gray-900">{feedbackMessage.message}</div>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      )}

      {/* Posts */}
      {(searchResults.length > 0 ? searchResults : getCurrentArticles()).map((article) => (
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
                    {article.location} • {article.time}
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
                <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
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
                  <span className="text-sm font-medium">{article.comments} comments</span>
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
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default NewsFeed;

