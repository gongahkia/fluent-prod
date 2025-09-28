import React, { useState, useEffect } from 'react';
import {
  fetchPosts,
  getAvailableSources,
  checkApiConfiguration,
  fetchRedditPosts
} from '../services/newsService';
import { ExternalLink, Clock, User, Tag, Settings, Refresh } from 'lucide-react';
import LoadingSpinner from './ui/LoadingSpinner';

export default function RealNewsFeed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSources, setSelectedSources] = useState(['hackernews', 'reddit']);
  const [query, setQuery] = useState('technology');
  const [showSettings, setShowSettings] = useState(false);
  const [apiStatus, setApiStatus] = useState({});

  const availableSources = getAvailableSources();

  useEffect(() => {
    const status = checkApiConfiguration();
    setApiStatus(status);
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);

    try {
      const enabledSources = selectedSources.filter(source =>
        apiStatus[source]?.enabled && apiStatus[source]?.hasApiKey
      );

      if (enabledSources.length === 0) {
        throw new Error('No enabled sources available. Please check your API configuration.');
      }

      const postsData = await fetchPosts({
        sources: enabledSources,
        query: query,
        limit: 20,
        shuffle: true
      });

      setPosts(postsData);
    } catch (err) {
      setError(err.message);
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [selectedSources, query]);

  const handleSourceToggle = (sourceId) => {
    setSelectedSources(prev =>
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSourceBadgeColor = (source) => {
    const colors = {
      hackernews: 'bg-orange-500',
      reddit: 'bg-red-500',
      newsapi: 'bg-blue-500',
      guardian: 'bg-blue-700',
      nytimes: 'bg-gray-800',
      mediastack: 'bg-green-500',
      gnews: 'bg-purple-500'
    };
    return colors[source] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading real-time posts..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-700 font-medium mb-2">Error Loading Posts</div>
        <div className="text-red-600 text-sm mb-4">{error}</div>
        <button
          onClick={loadPosts}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 mx-auto"
        >
          <Refresh className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Real-Time News Feed</h1>
            <p className="text-gray-600">Live posts from {selectedSources.length} sources</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadPosts}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Refresh className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="border-t border-gray-200 pt-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Query Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Query</label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter keywords..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Sources Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">News Sources</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(apiStatus).map(([sourceId, config]) => (
                    <label key={sourceId} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedSources.includes(sourceId)}
                        onChange={() => handleSourceToggle(sourceId)}
                        disabled={!config.enabled || !config.hasApiKey}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className={`text-sm ${
                        !config.enabled || !config.hasApiKey
                          ? 'text-gray-400'
                          : 'text-gray-700'
                      }`}>
                        {config.name}
                        {(!config.enabled || !config.hasApiKey) && (
                          <span className="text-xs text-red-500 ml-1">(API key needed)</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-600">No posts found. Try adjusting your search query or sources.</div>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <div key={`${post.source}-${post.id}-${index}`} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-white text-xs font-medium ${getSourceBadgeColor(post.source)}`}>
                      {apiStatus[post.source]?.name || post.source}
                    </span>
                    <div className="flex items-center text-sm text-gray-500 space-x-2">
                      <User className="w-4 h-4" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDate(post.publishedAt)}</span>
                    </div>
                  </div>
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>

                {/* Content */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-600 transition-colors"
                    >
                      {post.title}
                    </a>
                  </h3>
                  {post.content && (
                    <p className="text-gray-700 leading-relaxed line-clamp-3">
                      {post.content}
                    </p>
                  )}
                </div>

                {/* Image */}
                {post.image && (
                  <div className="mb-4">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-48 object-cover rounded-lg"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex items-center space-x-2 flex-wrap">
                    <Tag className="w-4 h-4 text-gray-400" />
                    {post.tags.slice(0, 5).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {posts.length > 0 && (
        <div className="text-center">
          <button
            onClick={loadPosts}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Load More Posts
          </button>
        </div>
      )}
    </div>
  );
}
