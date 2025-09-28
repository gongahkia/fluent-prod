import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, Languages, BookOpen, Send, User } from 'lucide-react';

const CommentSystem = ({ isJapanese = false }) => {
  const [comments, setComments] = useState([
    {
      id: 1,
      user: {
        name: "Li Wei",
        avatar: "LW",
        badge: "Chinese Learner",
        location: "Beijing, China"
      },
      content: "我的朋友都很友善友好这个取道了日本之行，虽然我们预计项目会这只是调查，但心理影响很真实的，我们人为日本政府应该做更多工作来清洁这些有外学校场。",
      timestamp: "20m ago",
      likes: 18,
      difficulty: "Advanced",
      translated: false,
      translation: "My friends are all very friendly and this route to Japan, although we expect the project to be just a survey, the psychological impact is real, and we think the Japanese government should do more work to clean up these foreign schools."
    },
    {
      id: 2,
      user: {
        name: "Yuki Tanaka",
        avatar: "YT",
        badge: "Native Speaker",
        location: "Tokyo, Japan"
      },
      content: "このラーメン店は本当に素晴らしいです！家族で経営していて、味も最高です。",
      timestamp: "15m ago",
      likes: 24,
      difficulty: "Intermediate",
      translated: false,
      translation: "This ramen shop is really wonderful! It's family-run and the taste is excellent."
    },
    {
      id: 3,
      user: {
        name: "Sarah Johnson",
        avatar: "SJ",
        badge: "Japanese Learner",
        location: "New York, USA"
      },
      content: "日本の文化はとても興味深いです。もっと学びたいです！",
      timestamp: "10m ago",
      likes: 12,
      difficulty: "Beginner",
      translated: false,
      translation: "Japanese culture is very interesting. I want to learn more!"
    }
  ]);

  const [newComment, setNewComment] = useState('');
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);

  const toggleTranslation = (commentId) => {
    setComments(comments.map(comment => 
      comment.id === commentId 
        ? { ...comment, translated: !comment.translated }
        : comment
    ));
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-700';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'Advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getBadgeColor = (badge) => {
    switch(badge) {
      case 'Native Speaker': return 'bg-blue-100 text-blue-700';
      case 'Chinese Learner': return 'bg-purple-100 text-purple-700';
      case 'Japanese Learner': return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const mockDictionary = [
    { word: "ラーメン", reading: "ramen", meaning: "ramen noodles" },
    { word: "文化", reading: "bunka", meaning: "culture" },
    { word: "興味深い", reading: "kyōmibukai", meaning: "interesting" },
    { word: "素晴らしい", reading: "subarashii", meaning: "wonderful" }
  ];

  if (!isJapanese) {
    return null;
  }

  return (
    <div className="mt-6 border-t border-gray-200 pt-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Language Learning Comments ({comments.length})
      </h3>
      
      {/* Comments List */}
      <div className="space-y-4 mb-6">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            {/* User Header */}
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-orange-700">
                  {comment.user.avatar}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">{comment.user.name}</span>
                  <Badge className={getBadgeColor(comment.user.badge)}>
                    {comment.user.badge}
                  </Badge>
                  <Badge className={getDifficultyColor(comment.difficulty)}>
                    {comment.difficulty}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  {comment.user.location} • {comment.timestamp}
                </div>
              </div>
            </div>

            {/* Comment Content */}
            <div className="mb-3">
              <p className="text-gray-800 mb-2">
                {comment.translated ? comment.translation : comment.content}
              </p>
              {comment.translated && (
                <p className="text-sm text-gray-600 italic border-l-2 border-gray-300 pl-3">
                  Original: {comment.content}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-red-600">
                <Heart className="w-4 h-4 mr-1" />
                {comment.likes}
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600">
                <MessageCircle className="w-4 h-4 mr-1" />
                Reply
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-600 hover:text-blue-600"
                onClick={() => toggleTranslation(comment.id)}
              >
                <Languages className="w-4 h-4 mr-1" />
                {comment.translated ? 'Show Original' : 'Translate'}
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-green-600">
                <BookOpen className="w-4 h-4 mr-1" />
                Add to Dictionary
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Comment Input */}
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts on this topic... (You can write in any language)"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              rows={3}
            />
            
            {/* Input Controls */}
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={autoTranslate}
                    onChange={(e) => setAutoTranslate(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Languages className="w-4 h-4" />
                  <span>Auto-translate</span>
                </label>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDictionary(!showDictionary)}
                  className="text-gray-600"
                >
                  <BookOpen className="w-4 h-4 mr-1" />
                  Language: Auto-detect
                </Button>
              </div>
              
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <Send className="w-4 h-4 mr-1" />
                Post Comment
              </Button>
            </div>
          </div>
        </div>

        {/* Dictionary Panel */}
        {showDictionary && (
          <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Your Dictionary</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {mockDictionary.map((entry, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded">
                  <div className="font-medium">{entry.word}</div>
                  <div className="text-gray-600">{entry.reading}</div>
                  <div className="text-gray-500">{entry.meaning}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSystem;

