import React, { useState, useEffect } from "react";
import { TranslatedText } from "@/hooks/useTranslation";
import { generateConsistentAvatar } from "@/utils/avatarUtils";

interface FollowerUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  isOnline: boolean;
  followedAt?: string;
}

interface FollowersListProps {
  onBack: () => void;
}

const FollowersList: React.FC<FollowersListProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<"followers" | "following">("followers");
  const [followers, setFollowers] = useState<FollowerUser[]>([]);
  const [following, setFollowing] = useState<FollowerUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [followingStates, setFollowingStates] = useState<{ [key: string]: boolean }>({});
  const [processingFollow, setProcessingFollow] = useState<{ [key: string]: boolean }>({});
  const [processingUnfollow, setProcessingUnfollow] = useState<{ [key: string]: boolean }>({});
  const [dataLoaded, setDataLoaded] = useState({ followers: false, following: false });

  // Check which followers we're already following
  const updateFollowingStates = (followersList: FollowerUser[]) => {
    // Get current following usernames - handle case where following might be empty initially
    const followingUsernames = following.map(user => user.username);
    const states: { [key: string]: boolean } = {};
    
    followersList.forEach(follower => {
      // Check if this follower is in our following list
      states[follower.id] = followingUsernames.includes(follower.username);
    });
    
    console.log("Updating following states:", {
      followersCount: followersList.length,
      followingCount: following.length,
      followingUsernames,
      states
    });
    
    setFollowingStates(states);
  };

  // Handle follow back functionality
  const handleFollowBack = async (user: FollowerUser) => {
    try {
      setProcessingFollow(prev => ({ ...prev, [user.id]: true }));

      const response = await fetch("/api/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add user to following list first
        const updatedFollowing = following.find(f => f.id === user.id) 
          ? following 
          : [...following, user];
        
        if (!following.find(f => f.id === user.id)) {
          setFollowing(updatedFollowing);
        }
        
        // Update following states immediately based on the new following list
        setFollowingStates(prev => ({ ...prev, [user.id]: true }));
        
        console.log("Follow back successful:", data.message);
      } else {
        const errorData = await response.json();
        console.error("Follow back failed:", errorData.error);
      }
    } catch (error) {
      console.error("Error following back:", error);
    } finally {
      setProcessingFollow(prev => ({ ...prev, [user.id]: false }));
    }
  };

  // Handle unfollow functionality
  const handleUnfollow = async (user: FollowerUser) => {
    try {
      setProcessingUnfollow(prev => ({ ...prev, [user.id]: true }));

      const response = await fetch("/api/unfollow", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Remove user from following list immediately
        setFollowing(prev => prev.filter(f => f.id !== user.id));
        
        // Update following states immediately
        setFollowingStates(prev => ({ ...prev, [user.id]: false }));
        
        console.log("Unfollow successful:", data.message);
      } else {
        const errorData = await response.json();
        console.error("Unfollow failed:", errorData.error);
      }
    } catch (error) {
      console.error("Error unfollowing:", error);
    } finally {
      setProcessingUnfollow(prev => ({ ...prev, [user.id]: false }));
    }
  };

  // Fetch followers or following based on active tab
  const fetchData = async (type: "followers" | "following") => {
    try {
      setIsLoading(true);
      
      // Use the correct existing API endpoints
      const endpoint = type === "followers" ? "/api/users/followers" : "/api/users/followed";
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        if (type === "followers") {
          // Map the response data to match our interface
          const followersData = data.followers || [];
          const mappedFollowers = followersData.map((user: any) => ({
            id: user.id,
            username: user.username,
            displayName: user.displayName || user.username,
            avatar: generateConsistentAvatar(user.username),
            isOnline: user.isOnline || Math.random() > 0.5,
            followedAt: user.followedAt || user.joinedAt
          }));
          setFollowers(mappedFollowers);
          setDataLoaded(prev => ({ ...prev, followers: true }));
          
          // Don't update following states here - wait for both datasets to load
        } else {
          // Map the following data
          const followingData = data.following || [];
          const mappedFollowing = followingData.map((user: any) => ({
            id: user.id,
            username: user.username,
            displayName: user.displayName || user.username,
            avatar: generateConsistentAvatar(user.username),
            isOnline: user.isOnline || Math.random() > 0.5,
            followedAt: user.followedAt || user.joinedAt
          }));
          setFollowing(mappedFollowing);
          setDataLoaded(prev => ({ ...prev, following: true }));
        }
      } else {
        console.error(`Failed to fetch ${type}:`, response.status);
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch both followers and following data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      // Fetch both followers and following in parallel for accurate counts
      await Promise.all([
        fetchData("followers"),
        fetchData("following")
      ]);
    };
    
    fetchAllData();
  }, []); // Only run on mount

  // Update following states only when both datasets are fully loaded
  useEffect(() => {
    if (dataLoaded.followers && dataLoaded.following && followers.length > 0) {
      console.log("Both datasets loaded, updating following states");
      updateFollowingStates(followers);
    }
  }, [dataLoaded.followers, dataLoaded.following, followers, following]);

  const currentData = activeTab === "followers" ? followers : following;

  return (
    <div className="bg-white dark:bg-[#262335] text-black dark:text-white min-h-screen">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors mr-4"
        >
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h1 className="text-xl font-bold">
          <TranslatedText>Connections</TranslatedText>
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("followers")}
          className={`flex-1 py-4 text-center font-medium transition-colors ${
            activeTab === "followers"
              ? "text-blue-500 border-b-2 border-blue-500"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <TranslatedText>Followers</TranslatedText> ({followers.length})
        </button>
        <button
          onClick={() => setActiveTab("following")}
          className={`flex-1 py-4 text-center font-medium transition-colors ${
            activeTab === "following"
              ? "text-blue-500 border-b-2 border-blue-500"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          <TranslatedText>Following</TranslatedText> ({following.length})
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500 dark:text-gray-400">
              <TranslatedText>Loading...</TranslatedText>
            </div>
          </div>
        ) : currentData.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              {activeTab === "followers" ? (
                <TranslatedText>No followers yet</TranslatedText>
              ) : (
                <TranslatedText>Not following anyone yet</TranslatedText>
              )}
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {activeTab === "followers" ? (
                <TranslatedText>When people follow you, they'll show up here</TranslatedText>
              ) : (
                <TranslatedText>Find people to follow and connect with them</TranslatedText>
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentData.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#1a1625] rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={user.avatar}
                      alt={user.displayName}
                      className="w-12 h-12 rounded-full"
                    />
                    {user.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#262335]"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{user.displayName}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      @{user.username}
                    </p>
                    {user.followedAt && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {activeTab === "followers" ? "Followed you " : "Following since "}
                        {new Date(user.followedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Show Follow Back button only for followers that we're not following */}
                  {activeTab === "followers" && !followingStates[user.id] && (
                    <button
                      onClick={() => handleFollowBack(user)}
                      disabled={processingFollow[user.id]}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        processingFollow[user.id] 
                          ? 'bg-gray-400 cursor-not-allowed text-white' 
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      }`}
                    >
                      {processingFollow[user.id] ? (
                        <span className="flex items-center gap-1">
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <TranslatedText>Following...</TranslatedText>
                        </span>
                      ) : (
                        <TranslatedText>Follow Back</TranslatedText>
                      )}
                    </button>
                  )}
                  
                  {/* Show Following status for followers we're already following */}
                  {activeTab === "followers" && followingStates[user.id] && (
                    <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium">
                      <TranslatedText>Following</TranslatedText>
                    </span>
                  )}
                  
                  {/* Show Unfollow button only in Following tab */}
                  {activeTab === "following" && (
                    <button
                      onClick={() => handleUnfollow(user)}
                      disabled={processingUnfollow[user.id]}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        processingUnfollow[user.id] 
                          ? 'bg-gray-400 cursor-not-allowed text-white' 
                          : 'bg-red-500 hover:bg-red-600 text-white'
                      }`}
                    >
                      {processingUnfollow[user.id] ? (
                        <span className="flex items-center gap-1">
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <TranslatedText>Unfollowing...</TranslatedText>
                        </span>
                      ) : (
                        <TranslatedText>Unfollow</TranslatedText>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowersList;
