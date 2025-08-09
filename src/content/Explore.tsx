"use client";

import React, { useState, useEffect } from "react";
import { TranslatedText } from "@/hooks/useTranslation";
import { generateConsistentAvatar } from "@/utils/avatarUtils";

interface User {
  _id: string;
  username: string;
  email: string;
  isOnline: boolean;
  joinedAt: string;
}

const Explore = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingStates, setFollowingStates] = useState<{ [key: string]: boolean }>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Check current user for user switching detection
  const checkCurrentUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const data = await response.json();
        return data.user?.id || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // Fetch suggested users (unfollowed users)
  const fetchSuggestedUsers = async () => {
    try {
      setIsLoading(true);
      console.log("Fetching unfollowed users...");
      
      const response = await fetch("/api/users/unfollowed?limit=20");
      
      if (response.ok) {
        const data = await response.json();
        console.log("Unfollowed users response:", data);
        setUsers(data.users || []);
      } else if (response.status === 401) {
        // User not authenticated
        console.log("User not authenticated");
        setUsers([]);
      } else {
        console.warn("Failed to fetch unfollowed users:", response.status);
        const errorData = await response.json().catch(() => ({}));
        console.warn("Error details:", errorData);
        setUsers([]);
      }
    } catch (error) {
      console.warn("Error fetching unfollowed users:", error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle follow/unfollow
  const handleFollowToggle = async (userId: string, username: string, event?: React.MouseEvent) => {
    console.log("🔄 Explore: Follow button clicked for user:", username, userId);
    
    // Prevent any default behavior and event bubbling
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const isCurrentlyFollowing = followingStates[userId];
    console.log("📊 Explore: Current following state:", isCurrentlyFollowing);
    
    try {
      const endpoint = isCurrentlyFollowing ? "/api/unfollow" : "/api/follow";
      const method = isCurrentlyFollowing ? "DELETE" : "POST";
      
      console.log("🌐 Explore: Making API call to:", endpoint, "with method:", method);
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      console.log("✅ Explore: API response status:", response.status);

      if (response.ok) {
        console.log("🎉 Explore: Follow/unfollow successful, triggering full page refresh...");
        
        // Trigger full page refresh
        window.location.reload();
        
        console.log("✅ Explore: Page refresh triggered");
      } else {
        console.error("❌ Explore: Failed to toggle follow status:", response.status);
      }
    } catch (error) {
      console.error("💥 Explore: Error toggling follow status:", error);
    }
    
    console.log("🏁 Explore: handleFollowToggle completed");
  };

  useEffect(() => {
    fetchSuggestedUsers();
    
    // Listen for user change events
    const handleUserChange = (event: any) => {
      const userData = event.detail;
      const newUserId = userData?.id || null;
      
      if (newUserId !== currentUserId) {
        setCurrentUserId(newUserId);
        setFollowingStates({}); // Reset following states
        if (newUserId) {
          // User logged in or changed, fetch new suggestions
          fetchSuggestedUsers();
        } else {
          // User logged out, clear users
          setUsers([]);
        }
      }
    };

    window.addEventListener('userChanged', handleUserChange);

    // Initial user check
    checkCurrentUser().then(setCurrentUserId);

    return () => {
      window.removeEventListener('userChanged', handleUserChange);
    };
  }, [currentUserId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500 dark:text-gray-400">
          <TranslatedText>Loading...</TranslatedText>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          <TranslatedText>Explore</TranslatedText>
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          <TranslatedText>Discover new people to follow</TranslatedText>
        </p>
      </div>

      {users.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-gray-500 dark:text-gray-400">
            <TranslatedText>No new users to discover at the moment</TranslatedText>
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-4 bg-white dark:bg-[#262335] rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={generateConsistentAvatar(user.username)}
                    alt={user.username}
                    className="w-12 h-12 rounded-full"
                  />
                  {user.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#262335]"></div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {user.username}
                    </h3>
                    {user.isOnline && (
                      <span className="text-xs text-green-600 dark:text-green-400">
                        <TranslatedText>Online</TranslatedText>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    @{user.username.toLowerCase()}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    <TranslatedText>Joined</TranslatedText> {new Date(user.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => handleFollowToggle(user._id, user.username, e)}
                disabled={followingStates[user._id]}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  followingStates[user._id]
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
              >
                <TranslatedText>
                  {followingStates[user._id] ? "Following" : "Follow"}
                </TranslatedText>
              </button>
            </div>
          ))}
        </div>
      )}

      {users.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={fetchSuggestedUsers}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            <TranslatedText>Refresh</TranslatedText>
          </button>
        </div>
      )}
    </div>
  );
};

export default Explore;
