"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { TranslatedText } from "@/hooks/useTranslation";
import { generateConsistentAvatar } from "@/utils/avatarUtils";
import Icon from "@/components/Icon";

interface Notification {
  _id: string;
  userId: string;
  fromUserId: string;
  fromUsername: string;
  postId?: string;
  type: "like" | "comment" | "share" | "follow";
  message: string;
  isRead: boolean;
  createdAt: string;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        console.error("Failed to fetch notifications");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ notificationIds }),
      });

      if (response.ok) {
        // Update local state
        setNotifications(notifications.map(notif => 
          notificationIds.includes(notif._id) 
            ? { ...notif, isRead: true }
            : notif
        ));
        setUnreadCount(Math.max(0, unreadCount - notificationIds.length));
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const markAllAsRead = () => {
    const unreadIds = notifications
      .filter(notif => !notif.isRead)
      .map(notif => notif._id);
    
    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Icon name="like.svg" width={20} height={20} className="text-red-500" />;
      case "comment":
        return <Icon name="comment.svg" width={20} height={20} className="text-blue-500" />;
      case "share":
        return <Icon name="share.svg" width={20} height={20} className="text-green-500" />;
      case "follow":
        return <Icon name="profile.svg" width={20} height={20} className="text-purple-500" />;
      default:
        return <Icon name="notification.svg" width={20} height={20} className="text-gray-500" />;
    }
  };

  return (
    <div className="bg-[#262335] min-h-screen">
      {/* Header */}
      <div className="max-w-3xl mx-auto">
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl shadow-xl border border-white/20 dark:border-slate-700/30 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                <TranslatedText>Notifications</TranslatedText>
              </h1>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                {unreadCount > 0 ? (
                  <span>{unreadCount} unread notifications</span>
                ) : (
                  <TranslatedText>All caught up!</TranslatedText>
                )}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                <TranslatedText>Mark all as read</TranslatedText>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="max-w-4xl mx-auto p-6 text-center">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-300">
              <TranslatedText>Loading notifications...</TranslatedText>
            </p>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="max-w-4xl mx-auto space-y-3 p-3">
        {notifications.length === 0 && !isLoading && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/30 p-8 text-center">
            <Icon name="notification.svg" width={48} height={48} className="mx-auto mb-4 text-gray-400" />
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              <TranslatedText>No notifications yet</TranslatedText>
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
              <TranslatedText>When people interact with your posts, you&apos;ll see it here</TranslatedText>
            </p>
          </div>
        )}

        {notifications.map((notification) => (
          <div
            key={notification._id}
            className={`bg-white/80 dark:bg-[#262335] rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/30 p-4 transition-all hover:shadow-lg ${
              !notification.isRead ? "ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-900/10" : ""
            }`}
            onClick={() => !notification.isRead && markAsRead([notification._id])}
          >
            <div className="flex items-start space-x-4">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full overflow-hidden relative">
                <Image
                  src={generateConsistentAvatar(notification.fromUsername)}
                  alt={notification.fromUsername}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-slate-700 dark:text-slate-100">
                      <span className="font-semibold capitalize">
                        {notification.fromUsername}
                      </span>{" "}
                      {notification.message}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                  
                  {/* Action Icon */}
                  <div className="flex items-center space-x-2 ml-4">
                    {getNotificationIcon(notification.type)}
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
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

export default Notifications;
