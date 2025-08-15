"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { TranslatedText } from "@/hooks/useTranslation";
import { generateConsistentAvatar } from "@/utils/avatarUtils";
import Icon from "@/components/Icon";
import PostImages from "@/components/PostImages";

interface Post {
  _id: string;
  userId: string;
  username: string;
  content: string;
  images?: {
    data: string;
    iv: string;
    key: string;
    filename: string;
    mimetype: string;
    size: number;
  }[];
  tags: string[];
  likes: number;
  likedBy: string[];
  comments: number;
  shares: number;
  createdAt: string;
}

const Bookmarks = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const response = await fetch("/api/posts/bookmark", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        console.error("Failed to fetch bookmarks");
      }
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveBookmark = async (postId: string) => {
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
        // Remove from local state
        setPosts(posts.filter((post) => post._id !== postId));
      }
    } catch (error) {
      console.error("Error removing bookmark:", error);
    }
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
    <div className="bg-[#262335] min-h-screen">
      {/* Header */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-xl border border-white/20 dark:border-slate-700/30 p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            <TranslatedText>Bookmarks</TranslatedText>
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm">
            <TranslatedText>Your saved whispers</TranslatedText>
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="max-w-4xl mx-auto p-6 text-center">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-300">
              <TranslatedText>Loading bookmarks...</TranslatedText>
            </p>
          </div>
        </div>
      )}

      {/* Bookmarks Feed */}
      <div className="max-w-4xl mx-auto space-y-6 p-3">
        {posts.length === 0 && !isLoading && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/30 p-8 text-center">
            <Icon
              name="bookmark.svg"
              width={48}
              height={48}
              className="mx-auto mb-4 text-gray-400"
            />
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              <TranslatedText>No bookmarks yet</TranslatedText>
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
              <TranslatedText>
                Save whispers you want to read later
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
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
                <button
                  onClick={() => handleRemoveBookmark(post._id)}
                  className="text-red-500 hover:text-red-600 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  title="Remove bookmark"
                >
                  <Icon name="cross.svg" width={20} height={20} />
                </button>
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
              <PostImages
                postId={post._id}
                images={post.images || []}
                className="mb-4"
              />

              <div className="flex items-center justify-between">
                <div className="flex space-x-6">
                  <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                    <Icon name="comment.svg" width={20} height={20} />
                    <span className="font-medium">{post.comments}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                    <Icon name="like.svg" width={20} height={20} />
                    <span className="font-medium">{post.likes}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                    <Icon name="share.svg" width={20} height={20} />
                    <span className="font-medium">{post.shares}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Bookmarks;
