"use client";

import React, { useState, useRef, useEffect } from "react";
import { TranslatedText } from "@/hooks/useTranslation";
import Icon from "@/components/Icon";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  isOnline: boolean;
  followedAt?: string;
  joinedAt?: string;
  isFollower?: boolean;
  isFollowing?: boolean;
  isMutual?: boolean;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  messageType: 'text' | 'emoji' | 'image' | 'file';
  createdAt: Date;
  isSent: boolean;
  isRead: boolean;
}

interface Chat {
  id: string;
  participants: string[];
  otherUser: {
    username: string;
    displayName: string;
    avatar: string;
    isOnline: boolean;
  };
  lastMessage?: string;
  lastMessageTime?: Date;
  lastMessageSender?: string;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface MessagesProps {
  selectedUserId?: string;
  selectedUser?: User;
}

const Messages: React.FC<MessagesProps> = ({ selectedUserId, selectedUser }) => {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [chatUsers, setChatUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [followingStates, setFollowingStates] = useState<{ [key: string]: boolean }>({});
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Fetch existing chats
  const fetchChats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/chats");
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      } else if (response.status === 401) {
        console.warn("User not authenticated");
        setChats([]);
      } else {
        console.warn("Failed to fetch chats:", response.status);
        setChats([]);
      }
    } catch (error) {
      console.warn("Error fetching chats:", error);
      setChats([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch chat contacts (followers/following) for new chat modal
  const fetchChatUsers = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch("/api/users/chat-contacts");

      if (response.ok) {
        const data = await response.json();
        const contacts = data.contacts || [];
        
        if (contacts.length === 0) {
          if (window.location.pathname.includes('messages')) {
            window.dispatchEvent(new CustomEvent('navigateToExplore'));
          }
          setChatUsers([]);
        } else {
          setChatUsers(contacts);
        }
      } else if (response.status === 401) {
        if (window.location.pathname.includes('messages')) {
          window.dispatchEvent(new CustomEvent('navigateToExplore'));
        }
        setChatUsers([]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn("Failed to fetch chat contacts:", response.status, errorData);
        setChatUsers([]);
      }
      
    } catch (error) {
      console.warn("Error fetching chat users:", error);
      setChatUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch messages for a specific chat
  const fetchMessages = async (chatId: string) => {
    try {
      setIsLoadingMessages(true);
      const response = await fetch(`/api/messages?chatId=${chatId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        
        // Mark messages as read
        await fetch("/api/messages/mark-read", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ chatId }),
        });
      } else {
        console.warn("Failed to fetch messages:", response.status);
        setMessages([]);
      }
    } catch (error) {
      console.warn("Error fetching messages:", error);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Create or get existing chat
  const createOrGetChat = async (otherUsername: string): Promise<Chat | null> => {
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ otherUsername }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Create Chat object from response
        const newChat: Chat = {
          id: data.chatId,
          participants: data.participants,
          otherUser: data.otherUser,
          lastMessage: undefined,
          lastMessageTime: undefined,
          lastMessageSender: undefined,
          unreadCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        return newChat;
      } else {
        console.error("Failed to create/get chat:", response.status);
        return null;
      }
    } catch (error) {
      console.error("Error creating/getting chat:", error);
      return null;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch chats when component mounts
  useEffect(() => {
    fetchChats();
    fetchChatUsers();
  }, []);

  // Handle pre-selected user
  useEffect(() => {
    console.log("🔔 Messages useEffect - selectedUser:", selectedUser, "selectedUserId:", selectedUserId);
    
    if (selectedUser) {
      // Create or get chat with selected user
      console.log("🔔 Creating chat with selectedUser:", selectedUser);
      createOrGetChat(selectedUser.username).then((chat) => {
        if (chat) {
          setSelectedChat(chat);
          fetchMessages(chat.id);
        }
      });
    } else if (selectedUserId && chats.length > 0) {
      // Find chat by user ID (this would need to be implemented if needed)
      const chat = chats.find(c => c.otherUser.username === selectedUserId);
      if (chat) {
        console.log("🔔 Found chat by ID:", chat);
        setSelectedChat(chat);
        fetchMessages(chat.id);
      }
    } else if (!selectedUser && !selectedUserId) {
      console.log("🔔 Clearing selectedChat");
      setSelectedChat(null);
      setMessages([]);
    }
  }, [selectedUser, selectedUserId, chats]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChat) return;

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: selectedChat.id,
          content: messageText.trim(),
          messageType: 'text',
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        setMessages((prev) => [...prev, newMessage]);
        setMessageText("");
        
        // Refresh chats to update last message
        fetchChats();
      } else {
        console.error("Failed to send message:", response.status);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleEmojiClick = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    setMessageText((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
    fetchMessages(chat.id);
  };

  const handleUserSelect = async (user: User) => {
    const chat = await createOrGetChat(user.username);
    if (chat) {
      setSelectedChat(chat);
      fetchMessages(chat.id);
      setShowNewChatModal(false);
      // Refresh chats to include new chat
      fetchChats();
    }
  };

  const handleBackToMessages = () => {
    setSelectedChat(null);
    setMessages([]);
  };

  const handleOpenNewChat = () => {
    setShowNewChatModal(true);
  };

  const handleCloseNewChat = () => {
    setShowNewChatModal(false);
  };

  const formatMessageTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatChatTime = (date?: Date) => {
    if (!date) return '';
    
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return formatMessageTime(messageDate);
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  if (selectedChat) {
    return (
      <div className="h-screen flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#262335]">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToMessages}
              className="p-2 hover:bg-gray-500 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-600 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="relative">
              <img
                src={selectedChat.otherUser.avatar}
                alt={selectedChat.otherUser.displayName}
                className="w-10 h-10 rounded-full"
              />
              {selectedChat.otherUser.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#262335]"></div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {selectedChat.otherUser.displayName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{selectedChat.otherUser.username}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-[#1a1625]">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-gray-500 dark:text-gray-400">
                <TranslatedText>Loading messages...</TranslatedText>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <p className="mb-2">
                  <TranslatedText>No messages yet</TranslatedText>
                </p>
                <p className="text-sm">
                  <TranslatedText>Start a conversation with</TranslatedText> {selectedChat.otherUser.displayName}
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.isSent ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    message.isSent
                      ? "bg-blue-500 text-white"
                      : "bg-white dark:bg-[#262335] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.isSent
                        ? "text-blue-100"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {formatMessageTime(message.createdAt)}
                    {message.isSent && message.isRead && (
                      <span className="ml-1">✓✓</span>
                    )}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white dark:bg-[#262335] border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="w-full px-4 py-2 pr-12 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1625] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <div
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                ref={emojiPickerRef}
              >
                <button
                  onClick={handleEmojiClick}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  aria-label="Add emoji"
                >
                  <span className="text-xl">😊</span>
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-full right-0 mb-2 z-50">
                    <EmojiPicker onEmojiClick={handleEmojiSelect} />
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!messageText.trim()}
              className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 rounded-full transition-colors"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Messages Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#262335]">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            <TranslatedText>Messages</TranslatedText>
          </h1>
          <button
            onClick={handleOpenNewChat}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white dark:bg-[#262335]">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-gray-500 dark:text-gray-400">
              <TranslatedText>Loading...</TranslatedText>
            </div>
          </div>
        ) : chats.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p className="mb-2">
                <TranslatedText>No conversations yet</TranslatedText>
              </p>
              <p className="text-sm mb-4">
                <TranslatedText>Start chatting with people you follow</TranslatedText>
              </p>
              <button
                onClick={handleOpenNewChat}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium transition-colors"
              >
                <TranslatedText>Start New Chat</TranslatedText>
              </button>
            </div>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleChatSelect(chat)}
              className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-[#1a1625] cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700"
            >
              <div className="relative">
                <img
                  src={chat.otherUser.avatar}
                  alt={chat.otherUser.displayName}
                  className="w-12 h-12 rounded-full"
                />
                {chat.otherUser.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#262335]"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {chat.otherUser.displayName}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatChatTime(chat.lastMessageTime)}
                    </span>
                    {chat.unreadCount > 0 && (
                      <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {chat.lastMessage ? (
                      <>
                        {chat.lastMessageSender && (
                          <span className="font-medium">
                            {chat.lastMessageSender}: 
                          </span>
                        )}
                        {chat.lastMessage}
                      </>
                    ) : (
                      <TranslatedText>No messages yet</TranslatedText>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#262335] rounded-lg w-96 max-h-96 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                <TranslatedText>Start a new chat</TranslatedText>
              </h2>
              <button
                onClick={handleCloseNewChat}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* People You Follow List */}
            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-gray-500 dark:text-gray-400">
                    <TranslatedText>Loading...</TranslatedText>
                  </div>
                </div>
              ) : chatUsers.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <p className="mb-2">
                      <TranslatedText>No users found</TranslatedText>
                    </p>
                    <a
                      href="#explore"
                      className="text-blue-500 hover:text-blue-600 text-sm underline"
                      onClick={(e) => {
                        e.preventDefault();
                        // Dispatch custom event to trigger explore navigation
                        window.dispatchEvent(new CustomEvent('navigateToExplore'));
                      }}
                    >
                      <TranslatedText>Explore to find people to follow</TranslatedText>
                    </a>
                  </div>
                </div>
              ) : (
                chatUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-[#1a1625] transition-colors border-b border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={user.avatar}
                          alt={user.displayName}
                          className="w-10 h-10 rounded-full"
                        />
                        {user.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#262335]"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {user.displayName}
                          </h3>
                          {user.isMutual && (
                            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 px-2 py-1 rounded-full">
                              <TranslatedText>Mutual</TranslatedText>
                            </span>
                          )}
                          {user.isFollowing && !user.isMutual && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-full">
                              <TranslatedText>Following</TranslatedText>
                            </span>
                          )}
                          {user.isFollower && !user.isMutual && (
                            <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-2 py-1 rounded-full">
                              <TranslatedText>Follower</TranslatedText>
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUserSelect(user)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium transition-colors"
                      >
                        <TranslatedText>Message</TranslatedText>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
