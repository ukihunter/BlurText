"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { TranslatedText } from "@/hooks/useTranslation";
import { generateConsistentAvatar } from "@/utils/avatarUtils";
import WhisperModal from "@/components/WhisperModal";
import CommentModal from "@/components/CommentModal";
import Icon from "@/components/Icon";
import { showSuccessToast } from "@/utils/toast";

interface Post {
  _id: string;
  userId: string;
  username: string;
  content: string;
  images?: string[];
  tags: string[];
  likes: number;
  likedBy: string[];
  comments: number;
  shares: number;
  createdAt: string;
  // Add interactive state tracking
  isLikedByUser?: boolean;
  isBookmarkedByUser?: boolean;
}

const Home = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWhisperModal, setShowWhisperModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [user, setUser] = useState<{ username: string; id: string } | null>(
    null
  );
  const [postContent, setPostContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const availableTags = [
    "technology",
    "art",
    "music",
    "sports",
    "travel",
    "food",
    "gaming",
    "movies",
    "fitness",
    "lifestyle",
    "news",
    "opinion",
    "funny",
    "inspiration",
    "question",
    "personal",
    "work",
    "study",
  ];

  useEffect(() => {
    fetchPosts();

    // Listen for user changes
    const handleUserChange = (event: CustomEvent) => {
      setUser(event.detail);
    };

    window.addEventListener("userChanged", handleUserChange as EventListener);
    return () => {
      window.removeEventListener(
        "userChanged",
        handleUserChange as EventListener
      );
    };
  }, []);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [postContent]);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/posts", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        console.error("Failed to fetch posts");
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleQuickPost = async () => {
    if (!postContent.trim() || selectedTags.length === 0) return;

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          content: postContent.trim(),
          images: [],
          tags: selectedTags,
        }),
      });

      if (response.ok) {
        setPostContent("");
        setSelectedTags([]);
        fetchPosts(); // Refresh posts
      }
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handlePostCreated = () => {
    fetchPosts();
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch("/api/posts/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ postId }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the post in local state
        setPosts(
          posts.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  likes: data.likes,
                  isLikedByUser: data.isLiked,
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleBookmark = async (postId: string) => {
    try {
      const response = await fetch("/api/posts/bookmark", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ postId }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the post in local state
        setPosts(
          posts.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  isBookmarkedByUser: data.isBookmarked,
                }
              : post
          )
        );
      }
    } catch (error) {
      console.error("Error bookmarking post:", error);
    }
  };

  const handleShare = async (postId: string) => {
    try {
      const response = await fetch("/api/posts/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ postId }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update the post in local state
        setPosts(
          posts.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  shares: data.shares,
                }
              : post
          )
        );

        // Show success message or copy link to clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
            await navigator.clipboard.writeText(
              `${window.location.origin}/post/${postId}`
            );
            showSuccessToast("Link copied to clipboard!", 2500);
          } catch (error) {
            console.log('Clipboard access denied');
          }
        }
      }
    } catch (error) {
      console.error("Error sharing post:", error);
    }
  };

  const handleComment = (postId: string) => {
    const post = posts.find((p) => p._id === postId);
    if (post) {
      setSelectedPost(post);
      setShowCommentModal(true);
    }
  };

  const handleCommentAdded = () => {
    // Refresh posts to get updated comment count
    fetchPosts();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return "now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="bg-[#262335] ">
      {/* Header */}
      <div className="max-w-3xl mx-auto ">
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-xl border border-white/20 dark:border-slate-700/30 p-6">
          <h1 className="text-2xl font-bold bg-white bg-clip-text text-transparent ">
            <TranslatedText>Home</TranslatedText>
          </h1>
          <p className="text-slate-600 dark:text-slate-300  text-sm">
            <TranslatedText>Discover and share amazing content</TranslatedText>
          </p>
        </div>
      </div>

      {/* Create Post Section */}
      <div className="max-w-4xl mx-auto mb-2 ">
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl  shadow-xl border border-white/20 dark:border-slate-700/30 p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 flex-shrink-0 overflow-hidden relative rounded-full">
              <Image
                src={generateConsistentAvatar(user?.username || "anonymous")}
                alt="Your Avatar"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 mb-4">
                <textarea
                  ref={textareaRef}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Share whispers..."
                  className="w-full bg-transparent placeholder-slate-500 dark:placeholder-slate-400 resize-none border-none outline-none text-lg"
                  rows={1}
                />
              </div>

              {/* Tags Selection */}
              {postContent.trim() && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <TranslatedText>Add tags (required)</TranslatedText>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {availableTags.slice(0, 8).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          selectedTags.includes(tag)
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-500"
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowWhisperModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-purple-100 dark:bg-purple-200/30"
                  >
                    <Icon name="image.svg" width={20} height={20} />
                    <span className="text-sm font-medium">
                      <TranslatedText>Photo</TranslatedText>
                    </span>
                  </button>
                </div>
                <button
                  onClick={handleQuickPost}
                  disabled={!postContent.trim() || selectedTags.length === 0}
                  className="text-white border-white border px-8 py-2 rounded-full font-semibold hover:bg-blue-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <TranslatedText>Share</TranslatedText>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="max-w-4xl mx-auto p-6 text-center">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-300">
              <TranslatedText>Loading whispers...</TranslatedText>
            </p>
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <div className="max-w-4xl mx-auto space-y-6 p-3">
        {posts.length === 0 && !isLoading && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/30 p-8 text-center">
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              <TranslatedText>
                No whispers yet. Be the first to share!
              </TranslatedText>
            </p>
          </div>
        )}

        {posts.map((post) => (
          <div
            key={post._id}
            className="bg-white/80 dark:bg-[#262335] rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/30 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden relative">
                  <Image
                    src={generateConsistentAvatar(post.username)}
                    alt={post.username}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                    {post.username}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">
                    @{post.username.toLowerCase()} •{" "}
                    {formatTimeAgo(post.createdAt)}
                  </p>
                </div>
              </div>

              <p className="text-slate-700 dark:text-slate-100 text-lg leading-relaxed mb-4">
                {post.content}
              </p>

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Images */}
              {post.images && post.images.length > 0 && (
                <div
                  className={`grid gap-3 mb-4 ${
                    post.images.length === 1
                      ? "grid-cols-1"
                      : post.images.length === 2
                      ? "grid-cols-2"
                      : "grid-cols-2"
                  }`}
                >
                  {post.images.map((image, index) => (
                    <div
                      key={index}
                      className="bg-gradient-to-br from-purple-100 via-pink-500 to-orange-500 rounded-2xl h-64 flex items-center justify-center relative"
                    >
                      <Image
                        src={image}
                        alt={`Post image ${index + 1}`}
                        fill
                        className="object-cover rounded-2xl"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex space-x-8">
                  <button
                    onClick={() => handleComment(post._id)}
                    className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                  >
                    <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                      <Icon name="comment.svg" width={18} height={18} />
                    </div>
                    <span className="text-sm font-medium">{post.comments}</span>
                  </button>

                  <button
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center space-x-2 transition-colors group ${
                      post.isLikedByUser
                        ? "text-red-500 dark:text-red-400"
                        : "text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-full transition-colors ${
                        post.isLikedByUser
                          ? "bg-red-50 dark:bg-red-900/20"
                          : "group-hover:bg-red-50 dark:group-hover:bg-red-900/20"
                      }`}
                    >
                      <Icon name="like.svg" width={18} height={18} />
                    </div>
                    <span className="text-sm font-medium">{post.likes}</span>
                  </button>

                  <button
                    onClick={() => handleShare(post._id)}
                    className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors group"
                  >
                    <div className="p-2 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-900/20 transition-colors">
                      <Icon name="share.svg" width={18} height={18} />
                    </div>
                    <span className="text-sm font-medium">{post.shares}</span>
                  </button>
                </div>

                <button
                  onClick={() => handleBookmark(post._id)}
                  className={`p-2 rounded-full transition-all duration-200 ${
                    post.isBookmarkedByUser
                      ? "bg-blue-500 text-white hover:bg-blue-600 shadow-lg"
                      : "text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  }`}
                >
                  <Icon name="bookmark.svg" width={18} height={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Whisper Modal */}
      <WhisperModal
        isOpen={showWhisperModal}
        onClose={() => setShowWhisperModal(false)}
        onPostCreated={handlePostCreated}
        user={user}
      />

      {/* Comment Modal */}
      {selectedPost && (
        <CommentModal
          isOpen={showCommentModal}
          onClose={() => {
            setShowCommentModal(false);
            setSelectedPost(null);
          }}
          postId={selectedPost._id}
          postContent={selectedPost.content}
          postAuthor={selectedPost.username}
          onCommentAdded={handleCommentAdded}
        />
      )}
    </div>
  );
};

export default Home;
