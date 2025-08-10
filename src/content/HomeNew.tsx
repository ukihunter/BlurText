import React, { useState, useEffect } from "react";
import { TranslatedText } from "@/hooks/useTranslation";
import { generateConsistentAvatar } from "@/utils/avatarUtils";

const Home = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [algorithm, setAlgorithm] = useState('mixed');

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/recommendations');
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations);
        setAlgorithm(data.algorithm);
      } else {
        console.error('Failed to fetch recommendations');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string | Date) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return '🖼️';
      case 'video': return '🎥';
      case 'link': return '🔗';
      case 'poll': return '📊';
      default: return '📝';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      technology: '💻',
      science: '🔬',
      art: '🎨',
      music: '🎵',
      sports: '⚽',
      travel: '✈️',
      food: '🍕',
      fashion: '👗',
      photography: '📷',
      gaming: '🎮',
      books: '📚',
      movies: '🎬',
      fitness: '💪',
      health: '🏥',
      business: '💼',
      education: '🎓',
      lifestyle: '✨',
      nature: '🌿',
      comedy: '😂',
      news: '📰',
      general: '💬'
    };
    return icons[category] || '💬';
  };

  return (
    <div className="bg-[#262335]">
      {/* Header */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-xl border border-white/20 dark:border-slate-700/30 p-6">
          <h1 className="text-2xl font-bold bg-white bg-clip-text text-transparent">
            <TranslatedText>Home</TranslatedText>
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm">
            <TranslatedText>Discover and share amazing content</TranslatedText>
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              <TranslatedText>Algorithm:</TranslatedText> {algorithm}
            </span>
            {getCategoryIcon('general')}
          </div>
        </div>
      </div>

      {/* Create Post Section */}
      <div className="max-w-4xl mx-auto mb-2">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl border border-white/20 dark:border-slate-700/30 p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 flex-shrink-0 overflow-hidden">
              <img
                src={generateConsistentAvatar("youruser")}
                alt="Your Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 mb-4">
                <textarea
                  placeholder="Share whispers..."
                  className="w-full bg-transparent placeholder-slate-500 dark:placeholder-slate-400 resize-none border-none outline-none text-lg"
                  rows={1}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex space-x-3">
                  <button className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-purple-100 dark:bg-purple-200/30">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm font-medium">Photo</span>
                  </button>
                </div>
                <button className="text-white border-white border px-8 py-2 rounded-full font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg">
                  <TranslatedText>Share</TranslatedText>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Feed */}
      <div className="max-w-4xl mx-auto space-y-6 p-3">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500 dark:text-gray-400">
              <TranslatedText>Loading personalized content...</TranslatedText>
            </div>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center p-8">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              <TranslatedText>No recommendations available</TranslatedText>
            </div>
            <button 
              onClick={fetchRecommendations}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <TranslatedText>Refresh</TranslatedText>
            </button>
          </div>
        ) : (
          recommendations.map((post) => (
            <div key={post.id} className="bg-slate-800/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-700/30 p-6">
              {/* Post Header */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-2xl overflow-hidden">
                  <img
                    src={generateConsistentAvatar(post.author)}
                    alt={post.author}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{post.author}</h4>
                  <div className="flex items-center gap-2">
                    <p className="text-slate-400 text-sm">
                      {formatTimeAgo(post.timestamp)}
                    </p>
                    {post.trending && (
                      <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                        <TranslatedText>Trending</TranslatedText>
                      </span>
                    )}
                    <span className="text-sm">{getCategoryIcon(post.category)}</span>
                    <span className="text-sm">{getContentTypeIcon(post.type)}</span>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <p className="text-slate-200 text-lg leading-relaxed mb-4">
                {post.content}
              </p>

              {/* Media Content */}
              {post.type === 'image' && post.imageUrl && (
                <div className="bg-gradient-to-br from-purple-100 via-pink-500 to-orange-500 rounded-2xl h-64 mb-4 flex items-center justify-center overflow-hidden">
                  <img
                    src={post.imageUrl}
                    alt="Post content"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {post.type === 'video' && (
                <div className="bg-gradient-to-br from-blue-400 via-purple-500 to-pink-600 rounded-2xl h-64 mb-4 flex items-center justify-center">
                  <div className="text-white text-center">
                    <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.5 5.5l6 4-6 4v-8z"/>
                    </svg>
                    <p><TranslatedText>Video Content</TranslatedText></p>
                  </div>
                </div>
              )}

              {post.type === 'link' && post.linkUrl && (
                <div className="bg-slate-700/50 rounded-2xl p-4 mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-20 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-xl flex-shrink-0 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
                      </svg>
                    </div>
                    <div>
                      <h5 className="font-semibold text-white text-lg">
                        <TranslatedText>External Link</TranslatedText>
                      </h5>
                      <p className="text-slate-400 text-sm">{post.linkUrl}</p>
                    </div>
                  </div>
                </div>
              )}

              {post.type === 'poll' && post.pollOptions && (
                <div className="space-y-2 mb-4">
                  {post.pollOptions.map((option: string, index: number) => (
                    <button
                      key={index}
                      className="w-full p-3 text-left rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors text-white"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-6">
                  <button className="flex items-center space-x-2 text-slate-400 hover:text-blue-400 transition-colors">
                    <div className="p-2 rounded-xl hover:bg-slate-700/50">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </div>
                    <span className="text-sm">{post.engagement}</span>
                  </button>

                  <button className="flex items-center space-x-2 text-slate-400 hover:text-green-400 transition-colors">
                    <div className="p-2 rounded-xl hover:bg-slate-700/50">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                  </button>

                  <button className="flex items-center space-x-2 text-slate-400 hover:text-purple-400 transition-colors">
                    <div className="p-2 rounded-xl hover:bg-slate-700/50">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                        />
                      </svg>
                    </div>
                  </button>
                </div>

                <button className="text-slate-400 hover:text-yellow-400 transition-colors">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Home;
