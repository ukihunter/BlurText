"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { TranslatedText } from "@/hooks/useTranslation";
import { generateConsistentAvatar } from "@/utils/avatarUtils";
import FollowersList from "@/components/FollowersList";
import WhisperModal from "@/components/WhisperModal";
import CommentModal from "@/components/CommentModal";
import Icon from "@/components/Icon";
import PostImages from "@/components/PostImages";
import { showSuccessToast, showErrorToast } from "@/utils/toast";

interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  joinedAt: string;
}

interface ProfileStats {
  followersCount: number;
  followingCount: number;
}

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
  isLikedByUser?: boolean;
  isBookmarkedByUser?: boolean;
}

interface SelectedUser {
  username: string;
  id: string;
  _id?: string;
}

interface ProfileProps {
  selectedUser?: SelectedUser;
}

const Profile: React.FC<ProfileProps> = ({ selectedUser }) => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    followersCount: 0,
    followingCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  // Force initial state to false and prevent any external state interference
  const [showFollowersList, setShowFollowersList] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [mounted, setMounted] = useState(false);

  // New state for posts and modals
  const [activeTab, setActiveTab] = useState<"whispers" | "likes">("whispers");
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [isPostsLoading, setIsPostsLoading] = useState(false);
  const [showWhisperModal, setShowWhisperModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; postId: string | null }>({ show: false, postId: null });

  // Fix hydration issues by only rendering after mount and ensure clean state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch current user data or use selected user
  const fetchUserData = async () => {
    try {
      // If selectedUser is provided, use that data instead of fetching current user
      if (selectedUser) {
        setUser({
          id: selectedUser._id || selectedUser.id,
          username: selectedUser.username,
          displayName: selectedUser.username,
          avatar: generateConsistentAvatar(selectedUser.username),
          joinedAt: new Date().toISOString(), // We don't have joinedAt from search
        });
        return;
      }

      // Otherwise fetch current user data
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        const userData = data.user;

        setUser({
          id: userData.id,
          username: userData.username,
          displayName: userData.username,
          avatar: generateConsistentAvatar(userData.username),
          joinedAt: userData.createdAt || new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // Fetch profile stats (followers and following counts)
  const fetchProfileStats = async () => {
    try {
      // If viewing another user's profile, set default stats for now
      if (selectedUser) {
        setStats({ followersCount: 0, followingCount: 0 });
        setIsLoading(false);
        return;
      }

      // Fetch followers count for current user
      const followersResponse = await fetch("/api/users/followers");
      let followersCount = 0;
      if (followersResponse.ok) {
        const followersData = await followersResponse.json();
        followersCount = followersData.count || 0;
      }

      // Fetch following count for current user
      const followingResponse = await fetch("/api/users/followed");
      let followingCount = 0;
      if (followingResponse.ok) {
        const followingData = await followingResponse.json();
        followingCount = followingData.count || 0;
      }

      setStats({ followersCount, followingCount });
    } catch (error) {
      console.error("Error fetching profile stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchProfileStats();
  }, [selectedUser]);

  // Fetch user's own posts
  const fetchUserPosts = useCallback(async () => {
    if (!user?.id) return;

    setIsPostsLoading(true);
    try {
      const response = await fetch(`/api/users/posts?userId=${user.id}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUserPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Error fetching user posts:", error);
    } finally {
      setIsPostsLoading(false);
    }
  }, [user?.id]);

  // Fetch user posts when user data is available
  useEffect(() => {
    if (user?.id) {
      fetchUserPosts();
    }
  }, [user?.id, fetchUserPosts]);

  // Fetch posts the user has liked
  const fetchLikedPosts = async () => {
    setIsPostsLoading(true);
    try {
      const response = await fetch("/api/users/liked-posts", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setLikedPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Error fetching liked posts:", error);
    } finally {
      setIsPostsLoading(false);
    }
  };

  // Handle tab change and fetch appropriate posts
  const handleTabChange = (tab: "whispers" | "likes") => {
    setActiveTab(tab);
    if (tab === "likes" && likedPosts.length === 0) {
      fetchLikedPosts();
    }
  };

  // Handle post interactions
  const handleLike = async (postId: string) => {
    try {
      const response = await fetch("/api/posts/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ postId }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update both userPosts and likedPosts arrays
        const updatePost = (post: Post) =>
          post._id === postId
            ? { ...post, likes: data.likes, isLikedByUser: data.isLiked }
            : post;

        setUserPosts((prev) => prev.map(updatePost));
        setLikedPosts((prev) => prev.map(updatePost));

        // If post was unliked, remove from liked posts
        if (!data.isLiked && activeTab === "likes") {
          setLikedPosts((prev) => prev.filter((post) => post._id !== postId));
        }
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleBookmark = async (postId: string) => {
    try {
      const response = await fetch("/api/posts/bookmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ postId }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatePost = (post: Post) =>
          post._id === postId
            ? { ...post, isBookmarkedByUser: data.isBookmarked }
            : post;

        setUserPosts((prev) => prev.map(updatePost));
        setLikedPosts((prev) => prev.map(updatePost));
      }
    } catch (error) {
      console.error("Error bookmarking post:", error);
    }
  };

  const handleShare = async (postId: string) => {
    try {
      const response = await fetch("/api/posts/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ postId }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatePost = (post: Post) =>
          post._id === postId ? { ...post, shares: data.shares } : post;

        setUserPosts((prev) => prev.map(updatePost));
        setLikedPosts((prev) => prev.map(updatePost));

        if (navigator.clipboard && navigator.clipboard.writeText) {
          try {
            await navigator.clipboard.writeText(
              `${window.location.origin}/post/${postId}`
            );
            showSuccessToast("Link copied to clipboard!", 2500);
          } catch (error) {
            console.log("Clipboard access denied");
          }
        }
      }
    } catch (error) {
      console.error("Error sharing post:", error);
    }
  };

  const handleComment = (postId: string) => {
    const allPosts = [...userPosts, ...likedPosts];
    const post = allPosts.find((p) => p._id === postId);
    if (post) {
      setSelectedPost(post);
      setShowCommentModal(true);
    }
  };

  const handleCommentAdded = () => {
    // Refresh posts to get updated comment count
    fetchUserPosts();
    if (activeTab === "likes") {
      fetchLikedPosts();
    }
  };

  const handlePostCreated = () => {
    fetchUserPosts(); // Refresh user posts after creating a new one
  };

  const handleDeletePost = async (postId: string) => {
    try {
      console.log("Attempting to delete post:", postId);
      const response = await fetch(`/api/posts/delete?postId=${postId}`, {
        method: "DELETE",
        credentials: "include",
      });

      console.log("Delete response status:", response.status);
      
      if (response.ok) {
        // Remove the post from both userPosts and likedPosts state
        setUserPosts((prev) => prev.filter((post) => post._id !== postId));
        setLikedPosts((prev) => prev.filter((post) => post._id !== postId));
        showSuccessToast("Post deleted successfully!");
        setDeleteConfirmation({ show: false, postId: null });
      } else {
        const error = await response.json();
        console.error("Error deleting post:", error);
        showErrorToast("Failed to delete post. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      showErrorToast("Failed to delete post. Please try again.");
    }
  };

  const showDeleteConfirmation = (postId: string) => {
    setDeleteConfirmation({ show: true, postId });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.postId) {
      handleDeletePost(deleteConfirmation.postId);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ show: false, postId: null });
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

  // Listen for user changes to update profile data
  useEffect(() => {
    const handleUserChange = () => {
      fetchUserData();
      fetchProfileStats();
    };

    window.addEventListener("userChanged", handleUserChange);
    return () => {
      window.removeEventListener("userChanged", handleUserChange);
    };
  }, []);

  const handleShowFollowers = () => {
    setShowFollowersList(true);
  };

  const handleShowFollowing = () => {
    setShowFollowersList(true);
  };

  const handleBackFromFollowers = () => {
    setShowFollowersList(false);
    // Refresh stats when coming back from followers list
    fetchProfileStats();
  };

  const handleEditProfile = () => {
    setShowEditProfile(true);
  };

  const handleBackFromEdit = () => {
    setShowEditProfile(false);
    // Refresh user data when coming back from edit
    fetchUserData();
  };

  // Clean up all debug logs for production

  // Early return for hydration safety
  if (!mounted) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500 dark:text-gray-400">
          <TranslatedText>Loading...</TranslatedText>
        </div>
      </div>
    );
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500 dark:text-gray-400">
          <TranslatedText>Loading...</TranslatedText>
        </div>
      </div>
    );
  }

  // Render error state
  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500 dark:text-gray-400">
          <TranslatedText>Unable to load profile</TranslatedText>
        </div>
      </div>
    );
  }

  // Render conditional components based on state - ONLY if explicitly set to true
  if (showFollowersList === true) {
    return <FollowersList onBack={handleBackFromFollowers} />;
  }

  if (showEditProfile === true) {
    return <EditProfile user={user} onBack={handleBackFromEdit} />;
  }

  // Default: render main profile view
  return (
    <div className="min-h-screen bg-white dark:bg-[#262335]">
      {/* Anonymous Header */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-[#262335] backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="p-3 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-xl transition-all duration-300">
                <svg
                  className="w-5 h-5 text-gray-700 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Profile View
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <TranslatedText>{user.displayName}</TranslatedText>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        {/* Anonymous Profile Header */}
        <div className="bg-white dark:bg-[#262335] border-b border-gray-200 dark:border-gray-800 relative overflow-hidden">
          {/* Pattern Background */}
          <div className="absolute inset-0 opacity-5 dark:opacity-10">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20"></div>
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            ></div>
          </div>

          {/* Profile Content */}
          <div className="relative px-4 md:px-6 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              {/* Anonymous Avatar Section */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  {/* Glowing ring effect */}
                  <div className="absolute -inset-2 bg-gray-500 rounded-full opacity-40 dark:opacity-75 blur-md animate-pulse"></div>
                  <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-300 dark:border-gray-600 overflow-hidden shadow-2xl">
                    <Image
                      src={user.avatar}
                      alt="Anonymous User"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover opacity-90 dark:opacity-80"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                      <TranslatedText>{user.displayName}</TranslatedText>
                    </h2>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    @{user.username.toLowerCase()}
                  </p>
                </div>
              </div>

              {/* Privacy Controls */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleEditProfile}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <TranslatedText>Edit profile</TranslatedText>
                </button>
                <div className="text-xs text-gray-500 dark:text-gray-500 text-center">
                  <TranslatedText>End-to-end encrypted</TranslatedText>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="mt-6 flex flex-wrap items-center gap-6 text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2" suppressHydrationWarning>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>
                  <TranslatedText>Anonymous since</TranslatedText>{" "}
                  {user.joinedAt
                    ? new Date(user.joinedAt).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })
                    : "Recently"}
                </span>
              </div>
            </div>

            {/* Anonymous Stats */}
            <div className="mt-6 flex gap-8">
              <button
                onClick={handleShowFollowing}
                className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
              >
                <div className="text-center flex flex-col gap-1">
                  <div className="text-gray-500 dark:text-gray-400 text-sm">
                    <TranslatedText>Following</TranslatedText>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {stats.followingCount}
                  </div>
                </div>
              </button>
              <button
                onClick={handleShowFollowers}
                className="hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
              >
                <div className="text-center">
                  <div className="text-gray-500 dark:text-gray-400 text-sm">
                    <TranslatedText>Followers</TranslatedText>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {stats.followersCount}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Anonymous Navigation */}
        <div className="bg-white dark:bg-[#262335] border-b border-gray-200 dark:border-gray-800 sticky top-[88px] z-40">
          <div className="flex">
            <button
              onClick={() => handleTabChange("whispers")}
              className={`flex-1 py-4 px-4 text-center font-semibold border-b-2 transition-all duration-300 relative ${
                activeTab === "whispers"
                  ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-500/10"
                  : "text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-800 dark:hover:text-gray-300"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4"
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
                <TranslatedText>Whispers</TranslatedText>
              </span>
            </button>

            <button
              onClick={() => handleTabChange("likes")}
              className={`flex-1 py-4 px-4 text-center font-semibold border-b-2 transition-all duration-300 ${
                activeTab === "likes"
                  ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-500/10"
                  : "text-gray-600 dark:text-gray-400 border-transparent hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-800 dark:hover:text-gray-300"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-4 h-4"
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
                <TranslatedText>likes</TranslatedText>
              </span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white dark:bg-[#262335] min-h-96">
          {isPostsLoading ? (
            // Loading State
            <div className="px-4 md:px-6 py-20 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">
                <TranslatedText>Loading...</TranslatedText>
              </p>
            </div>
          ) : activeTab === "whispers" ? (
            // Whispers Tab
            userPosts.length === 0 ? (
              // Empty State for Whispers
              <div className="px-4 md:px-6 py-20 text-center">
                <div className="max-w-lg mx-auto">
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    <TranslatedText>Your whispers Remain silent</TranslatedText>
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg leading-relaxed">
                    <TranslatedText>
                      Share your thoughts anonymously. Your words will echo in
                      the shadows, heard but never traced.
                    </TranslatedText>
                  </p>
                  <button
                    onClick={() => setShowWhisperModal(true)}
                    className="group px-4 py-4 bg-blue-500 text-white font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-3 mx-auto hover:bg-blue-600"
                  >
                    <svg
                      className="w-5 h-5 group-hover:scale-110 transition-transform"
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
                    <TranslatedText>Send your first whisper</TranslatedText>
                  </button>
                  <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
                    <TranslatedText>
                      End-to-end encrypted • Fully anonymous
                    </TranslatedText>
                  </p>
                </div>
              </div>
            ) : (
              // User Posts List
              <div className="p-4 space-y-6">
                {userPosts.map((post) => (
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
                      <PostImages
                        postId={post._id}
                        images={post.images || []}
                        className="mb-4"
                      />

                      {/* Interaction Buttons */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex space-x-8">
                          <button
                            onClick={() => handleComment(post._id)}
                            className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                          >
                            <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                              <Icon name="comment.svg" width={18} height={18} />
                            </div>
                            <span className="text-sm font-medium">
                              {post.comments}
                            </span>
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
                            <span className="text-sm font-medium">
                              {post.likes}
                            </span>
                          </button>

                          <button
                            onClick={() => handleShare(post._id)}
                            className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors group"
                          >
                            <div className="p-2 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-900/20 transition-colors">
                              <Icon name="share.svg" width={18} height={18} />
                            </div>
                            <span className="text-sm font-medium">
                              {post.shares}
                            </span>
                          </button>
                        </div>

                        <div className="flex items-center space-x-2">
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

                          {/* Show delete button only for user's own posts */}
                          {(!selectedUser || selectedUser.username === user?.username) && (
                            <button
                              onClick={() => {
                                console.log("Delete button clicked for post:", post._id);
                                console.log("selectedUser:", selectedUser);
                                console.log("user:", user);
                                showDeleteConfirmation(post._id);
                              }}
                              className="p-2 rounded-full transition-all duration-200 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Delete post"
                            >
                              <Icon name="cross.svg" width={18} height={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : // Likes Tab
          likedPosts.length === 0 ? (
            // Empty State for Likes
            <div className="px-4 md:px-6 py-20 text-center">
              <div className="max-w-lg mx-auto">
                <div className="text-gray-500 dark:text-gray-400 mb-4">
                  <Icon
                    name="like.svg"
                    width={48}
                    height={48}
                    className="mx-auto mb-4 opacity-50"
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  <TranslatedText>No liked posts yet</TranslatedText>
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                  <TranslatedText>
                    When you like posts, they&apos;ll appear here for easy
                    access.
                  </TranslatedText>
                </p>
              </div>
            </div>
          ) : (
            // Liked Posts List
            <div className="p-4 space-y-6">
              {likedPosts.map((post) => (
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
                    <PostImages
                      postId={post._id}
                      images={post.images || []}
                      className="mb-4"
                    />

                    {/* Interaction Buttons */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex space-x-8">
                        <button
                          onClick={() => handleComment(post._id)}
                          className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                        >
                          <div className="p-2 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors">
                            <Icon name="comment.svg" width={18} height={18} />
                          </div>
                          <span className="text-sm font-medium">
                            {post.comments}
                          </span>
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
                          <span className="text-sm font-medium">
                            {post.likes}
                          </span>
                        </button>

                        <button
                          onClick={() => handleShare(post._id)}
                          className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 transition-colors group"
                        >
                          <div className="p-2 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-900/20 transition-colors">
                            <Icon name="share.svg" width={18} height={18} />
                          </div>
                          <span className="text-sm font-medium">
                            {post.shares}
                          </span>
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
          )}
        </div>

        {/* Modals */}
        <WhisperModal
          isOpen={showWhisperModal}
          onClose={() => setShowWhisperModal(false)}
          onPostCreated={handlePostCreated}
          user={user}
        />

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
            currentUser={user}
            onCommentAdded={handleCommentAdded}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmation.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4 w-full">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                <TranslatedText>Confirm Delete</TranslatedText>
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                <TranslatedText>Are you sure you want to delete this post? This action cannot be undone.</TranslatedText>
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <TranslatedText>Cancel</TranslatedText>
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <TranslatedText>Delete</TranslatedText>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// EditProfile Component
interface EditProfileProps {
  user: User | null;
  onBack: () => void;
}

const EditProfile: React.FC<EditProfileProps> = ({ user, onBack }) => {
  const [formData, setFormData] = useState({
    displayName: user?.displayName || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [anonymitySettings, setAnonymitySettings] = useState({
    enableDisappearingMessages: false,
    autoDeleteMessages: false,
    blockScreenshots: false,
    enableTwoFactor: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAnonymityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setAnonymitySettings((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handlePasswordChange = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters",
      });
      return;
    }

    if (!formData.currentPassword) {
      setMessage({
        type: "error",
        text: "Current password is required",
      });
      return;
    }

    setIsPasswordLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Password updated successfully" });
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to update password",
        });
      }
    } catch (error) {
      console.error("Password change error:", error);
      setMessage({
        type: "error",
        text: "Network error. Please check your connection and try again.",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/auth/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies
        body: JSON.stringify({
          anonymitySettings,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Profile updated successfully" });
        // Trigger a user data refresh in the parent component
        window.dispatchEvent(new CustomEvent("userChanged"));
      } else {
        setMessage({
          type: "error",
          text: data.message || "Failed to update profile",
        });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setMessage({
        type: "error",
        text: "Network error. Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      console.log("Attempting to delete account...");
      const response = await fetch("/api/auth/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          password: deleteAccountPassword,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Account deleted successfully:", data);
        showSuccessToast("Account deleted successfully!");
        
        // Redirect to home page after a short delay
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      } else {
        const error = await response.json();
        console.error("Error deleting account:", error);
        showErrorToast(error.error || "Failed to delete account. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      showErrorToast("Failed to delete account. Please try again.");
    }
  };

  const showDeleteAccountConfirmation = () => {
    setShowDeleteAccountModal(true);
    setDeleteAccountPassword("");
  };

  const confirmDeleteAccount = () => {
    if (!deleteAccountPassword) {
      showErrorToast("Please enter your password to confirm account deletion.");
      return;
    }
    handleDeleteAccount();
    setShowDeleteAccountModal(false);
  };

  const cancelDeleteAccount = () => {
    setShowDeleteAccountModal(false);
    setDeleteAccountPassword("");
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#262335]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-[#262335] backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-xl transition-all duration-300"
              >
                <svg
                  className="w-5 h-5 text-gray-700 dark:text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  <TranslatedText>Edit Profile</TranslatedText>
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <TranslatedText>
                    Manage your anonymous identity
                  </TranslatedText>
                </p>
              </div>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              <TranslatedText>
                {isLoading ? "Saving..." : "Save"}
              </TranslatedText>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile Information */}
        <div className="bg-white dark:bg-[#3b3b52] rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            <TranslatedText>Profile Information</TranslatedText>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <TranslatedText>Display Name</TranslatedText>
              </label>
              <div className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-medium">
                {formData.displayName || user?.username || 'Anonymous'}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <TranslatedText>Display name is set to your username and cannot be changed</TranslatedText>
              </p>
            </div>
          </div>
        </div>

        {/* Password Security */}
        <div className="bg-white dark:bg-[#3b3b52] rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            <TranslatedText>Password Security</TranslatedText>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <TranslatedText>Current Password</TranslatedText>
              </label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#262335] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <TranslatedText>New Password</TranslatedText>
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#262335] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <TranslatedText>Confirm New Password</TranslatedText>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#262335] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Confirm new password"
              />
            </div>
            <button
              onClick={handlePasswordChange}
              disabled={
                isPasswordLoading ||
                !formData.currentPassword ||
                !formData.newPassword
              }
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              <TranslatedText>
                {isPasswordLoading ? "Updating..." : "Update Password"}
              </TranslatedText>
            </button>
          </div>
        </div>

        {/* Anonymity & Privacy Settings */}
        <div className="bg-white dark:bg-[#3b3b52] rounded-2xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            <TranslatedText>Anonymity & Privacy Settings</TranslatedText>
          </h3>
          <div className="space-y-6">
            {/* Disappearing Messages */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  <TranslatedText>Disappearing Messages</TranslatedText>
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <TranslatedText>
                    Messages auto-delete after being read
                  </TranslatedText>
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="enableDisappearingMessages"
                  checked={anonymitySettings.enableDisappearingMessages}
                  onChange={handleAnonymityChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Auto-Delete Messages */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  <TranslatedText>Auto-Delete Messages</TranslatedText>
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <TranslatedText>
                    Automatically delete messages after 30 days
                  </TranslatedText>
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="autoDeleteMessages"
                  checked={anonymitySettings.autoDeleteMessages}
                  onChange={handleAnonymityChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Block Screenshots */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  <TranslatedText>Block Screenshots</TranslatedText>
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <TranslatedText>
                    Prevent screenshots in sensitive areas
                  </TranslatedText>
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="blockScreenshots"
                  checked={anonymitySettings.blockScreenshots}
                  onChange={handleAnonymityChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Two-Factor Authentication */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  <TranslatedText>Two-Factor Authentication</TranslatedText>
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <TranslatedText>
                    Add extra security to your account
                  </TranslatedText>
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="enableTwoFactor"
                  checked={anonymitySettings.enableTwoFactor}
                  onChange={handleAnonymityChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white dark:bg-[#3b3b52] rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            <TranslatedText>Account Actions</TranslatedText>
          </h3>
          <div className="space-y-4">
            <button 
              onClick={showDeleteAccountConfirmation}
              className="w-full px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              <TranslatedText>Delete Account Permanently</TranslatedText>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              <TranslatedText>Delete Account Permanently</TranslatedText>
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              <TranslatedText>This action cannot be undone. All your posts, messages, and data will be permanently deleted.</TranslatedText>
            </p>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              <TranslatedText>Type "DELETE" to confirm:</TranslatedText>
            </p>
            <input
              type="password"
              value={deleteAccountPassword}
              onChange={(e) => setDeleteAccountPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-6 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter your password"
            />
            <div className="flex space-x-3">
              <button
                onClick={cancelDeleteAccount}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <TranslatedText>Cancel</TranslatedText>
              </button>
              <button
                onClick={confirmDeleteAccount}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                disabled={!deleteAccountPassword}
              >
                <TranslatedText>Delete Account</TranslatedText>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
