"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { TranslatedText } from "@/hooks/useTranslation";
import { generateConsistentAvatar } from "@/utils/avatarUtils";
import FollowersList from "@/components/FollowersList";

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

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    followersCount: 0,
    followingCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showFollowersList, setShowFollowersList] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Fix hydration issues by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch current user data
  const fetchUserData = async () => {
    try {
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
      // Fetch followers count
      const followersResponse = await fetch("/api/users/followers");
      let followersCount = 0;
      if (followersResponse.ok) {
        const followersData = await followersResponse.json();
        followersCount = followersData.count || 0;
      }

      // Fetch following count
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
  }, []);

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

  if (showFollowersList) {
    return <FollowersList onBack={handleBackFromFollowers} />;
  }

  if (showEditProfile) {
    return <EditProfile user={user} onBack={handleBackFromEdit} />;
  }

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500 dark:text-gray-400">
          <TranslatedText>Loading...</TranslatedText>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500 dark:text-gray-400">
          <TranslatedText>Unable to load profile</TranslatedText>
        </div>
      </div>
    );
  }

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
            <button className="flex-1 py-4 px-4 text-center font-semibold text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all duration-300 relative">
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

            <button className="flex-1 py-4 px-4 text-center font-semibold text-gray-600 dark:text-gray-400 border-b-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-800 dark:hover:text-gray-300 transition-all duration-300">
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

        {/* Content Area - Anonymous Empty State */}
        <div className="bg-white dark:bg-[#262335] min-h-96">
          <div className="px-4 md:px-6 py-20 text-center">
            <div className="max-w-lg mx-auto">
              {/* Anonymous Empty State */}

              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                <TranslatedText>Your whispers Remain silent</TranslatedText>
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg leading-relaxed">
                <TranslatedText>
                  Share your thoughts anonymously. Your words will echo in the
                  shadows, heard but never traced.
                </TranslatedText>
              </p>
              <button className="group px-4 py-4 bg-blue-500 font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-3 mx-auto">
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
        </div>
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
    hideOnlineStatus: false,
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
          displayName: formData.displayName,
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
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#262335] text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Your anonymous display name"
              />
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
            {/* Hide Online Status */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  <TranslatedText>Hide Online Status</TranslatedText>
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <TranslatedText>
                    Others won&apos;t see when you&apos;re online
                  </TranslatedText>
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="hideOnlineStatus"
                  checked={anonymitySettings.hideOnlineStatus}
                  onChange={handleAnonymityChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

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
            <button className="w-full px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors">
              <TranslatedText>Delete Account Permanently</TranslatedText>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
