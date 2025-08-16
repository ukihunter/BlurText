"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { TranslatedText } from "@/hooks/useTranslation";
import { generateConsistentAvatar } from "@/utils/avatarUtils";
import Icon from "./Icon";
import Image from "next/image";

interface User {
  _id: string;
  username: string;
  email: string;
}

interface Hashtag {
  hashtag: string;
  postCount: number;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserSelect?: (selectedUser: User) => void;
  onHashtagSelect?: (selectedHashtag: string) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onUserSelect,
  onHashtagSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "hashtags">("users");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search function with debouncing
  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      if (activeTab === "users") {
        const response = await fetch(
          `/api/search/users?q=${encodeURIComponent(searchQuery)}&limit=10`
        );
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
        }
      } else {
        const response = await fetch(
          `/api/search/hashtags?q=${encodeURIComponent(searchQuery)}&limit=10`
        );
        if (response.ok) {
          const data = await response.json();
          setHashtags(data.hashtags || []);
        }
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, activeTab]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch();
      } else {
        setUsers([]);
        setHashtags([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const handleUserClick = (user: User) => {
    onUserSelect?.(user);
    onClose();
  };

  const handleHashtagClick = (hashtag: string) => {
    onHashtagSelect?.(hashtag);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white dark:bg-[#262335] rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/30 w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-slate-700/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              <TranslatedText>Search BlurText</TranslatedText>
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
            >
              <Icon name="cross.svg" width={24} height={24} />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for users or hashtags..."
              className="w-full bg-gray-100 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-600 text-black dark:text-white rounded-2xl py-3 px-4 pl-12 focus:border-blue-500 focus:outline-none transition-colors duration-300"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <Icon
                name="search.svg"
                width={20}
                height={20}
                className="text-gray-400"
              />
            </div>
          </div>

          {/* Tabs */}
          <div className="flex mt-4 bg-gray-100 dark:bg-slate-800/50 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "users"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <TranslatedText>Users</TranslatedText>
            </button>
            <button
              onClick={() => setActiveTab("hashtags")}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "hashtags"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <TranslatedText>Hashtags</TranslatedText>
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {isLoading && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <TranslatedText>Searching...</TranslatedText>
              </p>
            </div>
          )}

          {!isLoading && searchQuery && (
            <>
              {activeTab === "users" && (
                <div className="p-2">
                  {users.length === 0 ? (
                    <div className="p-8 text-center">
                      <Icon
                        name="profile.svg"
                        width={48}
                        height={48}
                        className="mx-auto mb-4 text-gray-400"
                      />
                      <p className="text-gray-600 dark:text-gray-400">
                        <TranslatedText>No users found</TranslatedText>
                      </p>
                    </div>
                  ) : (
                    users.map((user) => (
                      <button
                        key={user._id}
                        onClick={() => handleUserClick(user)}
                        className="w-full p-4 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-left"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden relative">
                            <Image
                              src={generateConsistentAvatar(user.username)}
                              alt={user.username}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                              {user.username}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                              @{user.username.toLowerCase()}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {activeTab === "hashtags" && (
                <div className="p-2">
                  {hashtags.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-4xl mb-4">#</div>
                      <p className="text-gray-600 dark:text-gray-400">
                        <TranslatedText>No hashtags found</TranslatedText>
                      </p>
                    </div>
                  ) : (
                    hashtags.map((item) => (
                      <button
                        key={item.hashtag}
                        onClick={() => handleHashtagClick(item.hashtag)}
                        className="w-full p-4 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              #{item.hashtag}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                              {item.postCount}{" "}
                              {item.postCount === 1 ? "post" : "posts"}
                            </p>
                          </div>
                          <div className="text-2xl text-blue-500">#</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </>
          )}

          {!searchQuery && (
            <div className="p-8 text-center">
              <Icon
                name="search.svg"
                width={48}
                height={48}
                className="mx-auto mb-4 text-gray-400"
              />
              <p className="text-gray-600 dark:text-gray-400">
                <TranslatedText>
                  Start typing to search for users or hashtags
                </TranslatedText>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
