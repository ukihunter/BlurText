"use client";

import React, { useState, useRef, useEffect } from "react";
import { TranslatedText } from "@/hooks/useTranslation";
import {
  generateConsistentAvatar,
  generateFallbackAvatar,
} from "@/utils/avatarUtils";
import Icon from "@/components/Icon";
import MessageStatus from "@/components/MessageStatus";
import MessageOptions from "@/components/MessageOptions";
import ChatOptions from "@/components/ChatOptions";
import MessageSelectionBar from "@/components/MessageSelectionBar";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

interface MessageData {
  createdAt: string | Date;
  readAt?: string | Date | null;
  [key: string]: unknown;
}

interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
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
  messageType: "text" | "emoji";
  status: "sending" | "sent" | "delivered" | "read";
  createdAt: Date | string;
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

const Messages: React.FC<MessagesProps> = ({
  selectedUserId,
  selectedUser,
}) => {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [chatUsers, setChatUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [followingStates, setFollowingStates] = useState<{
    [key: string]: boolean;
  }>({});

  // Selection mode states
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(
    new Set()
  );

  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Handle image load error
  const handleImageError = (
    event: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    const target = event.target as HTMLImageElement;
    // Fallback to a simple colored avatar
    const username = target.alt || "user";
    target.src = generateFallbackAvatar(username);
  };

  // Fetch existing chats
  const fetchChats = async (preserveSelectedChat = false) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/chats");
      if (response.ok) {
        const data = await response.json();
        const newChats = data.chats || [];
        setChats(newChats);

        // If we have a selected chat, update it with fresh data from the chats list
        if (preserveSelectedChat && selectedChat) {
          const updatedSelectedChat = newChats.find(
            (chat: Chat) => chat.id === selectedChat.id
          );
          if (updatedSelectedChat) {
            setSelectedChat(updatedSelectedChat);
          }
        }
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
          if (window.location.pathname.includes("messages")) {
            window.dispatchEvent(new CustomEvent("navigateToExplore"));
          }
          setChatUsers([]);
        } else {
          setChatUsers(contacts);
        }
      } else if (response.status === 401) {
        if (window.location.pathname.includes("messages")) {
          window.dispatchEvent(new CustomEvent("navigateToExplore"));
        }
        setChatUsers([]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn(
          "Failed to fetch chat contacts:",
          response.status,
          errorData
        );
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

        // Ensure all message dates are properly converted to Date objects
        const formattedMessages = (data.messages || []).map(
          (msg: MessageData) => ({
            ...msg,
            createdAt: new Date(msg.createdAt),
            readAt: msg.readAt ? new Date(msg.readAt) : null,
          })
        );

        setMessages(formattedMessages);

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
  const createOrGetChat = async (
    otherUsername: string
  ): Promise<Chat | null> => {
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
    console.log(
      "🔔 Messages useEffect - selectedUser:",
      selectedUser,
      "selectedUserId:",
      selectedUserId
    );

    if (selectedUser) {
      // Create or get chat with selected user
      console.log("🔔 Creating chat with selectedUser:", selectedUser);
      createOrGetChat(selectedUser.username).then(async (chat) => {
        if (chat) {
          setSelectedChat(chat);
          await fetchMessages(chat.id);

          // Update chats list in the background
          setTimeout(() => {
            fetchChats(true); // preserve selected chat
          }, 100);
        }
      });
    } else if (selectedUserId && chats.length > 0) {
      // Find chat by user ID
      const chat = chats.find((c) => c.otherUser.username === selectedUserId);
      if (chat) {
        console.log("🔔 Found chat by ID:", chat);
        setSelectedChat(chat);
        fetchMessages(chat.id);
      }
    }
    // Removed the automatic clearing when no user is selected to prevent unwanted redirects
  }, [selectedUser, selectedUserId, chats]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChat) return;

    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      content: messageText.trim(),
      sender: "current-user", // We'll get the actual username from the API response
      messageType: "text",
      status: "sending",
      createdAt: new Date(),
      isSent: true,
      isRead: false,
    };

    // Add temporary message with "sending" status
    setMessages((prev) => [...prev, tempMessage]);
    const messageContent = messageText.trim();
    setMessageText("");

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: selectedChat.id,
          content: messageContent,
          messageType: "text",
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const newMessage = result.message;

        // Replace temporary message with actual message from server
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempMessage.id
              ? {
                  ...newMessage,
                  createdAt: new Date(newMessage.createdAt), // Ensure proper Date object
                  isSent: true,
                }
              : msg
          )
        );

        // Update the selected chat's last message info without refetching all chats
        setSelectedChat((prevChat) =>
          prevChat
            ? {
                ...prevChat,
                lastMessage: newMessage.content,
                lastMessageTime: new Date(newMessage.createdAt),
                lastMessageSender: newMessage.sender,
                updatedAt: new Date(),
              }
            : null
        );

        // Update chats list in the background without affecting selected chat
        setTimeout(() => {
          fetchChats(true); // preserve selected chat
        }, 100);
      } else {
        // Remove temporary message on failure
        setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
        setMessageText(messageContent); // Restore message text
        console.error("Failed to send message:", response.status);
      }
    } catch (error) {
      // Remove temporary message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
      setMessageText(messageContent); // Restore message text
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
    setShowNewChatModal(false); // Close modal immediately to prevent flickering

    const chat = await createOrGetChat(user.username);
    if (chat) {
      setSelectedChat(chat);
      await fetchMessages(chat.id);

      // Update chats list in the background without affecting selected chat
      setTimeout(() => {
        fetchChats(true); // preserve selected chat
      }, 100);
    }
  };

  const handleDeleteMessage = async (
    messageId: string,
    deleteType: "delete-for-me" | "delete-for-everyone"
  ) => {
    try {
      const response = await fetch("/api/messages/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messageIds: [messageId], deleteType }),
      });

      if (response.ok) {
        // Remove message from local state
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));

        // Refresh chat list to update last message if needed
        setTimeout(() => {
          fetchChats(true);
        }, 100);
      } else {
        console.error("Failed to delete message:", response.status);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  // Selection mode functions
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedMessages(new Set());
  };

  const toggleMessageSelection = (messageId: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);

    // Auto-exit selection mode if no messages selected
    if (newSelected.size === 0) {
      setIsSelectionMode(false);
    }
  };

  const selectAllMessages = () => {
    const allMessageIds = new Set(messages.map((msg) => msg.id));
    setSelectedMessages(allMessageIds);
  };

  const cancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedMessages(new Set());
  };

  const handleBulkDelete = async (
    deleteType: "delete-for-me" | "delete-for-everyone"
  ) => {
    if (selectedMessages.size === 0) return;

    try {
      const messageIds = Array.from(selectedMessages);
      const response = await fetch("/api/messages/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messageIds, deleteType }),
      });

      if (response.ok) {
        // Remove deleted messages from local state
        setMessages((prev) =>
          prev.filter((msg) => !selectedMessages.has(msg.id))
        );

        // Exit selection mode
        cancelSelection();

        // Refresh chat list
        setTimeout(() => {
          fetchChats(true);
        }, 100);
      } else {
        console.error("Failed to delete messages:", response.status);
      }
    } catch (error) {
      console.error("Error deleting messages:", error);
    }
  };

  // Check if selected messages are all sent by current user (for delete-for-everyone option)
  const areSelectedMessagesSentByUser = () => {
    if (selectedMessages.size === 0) return false;
    return Array.from(selectedMessages).every((messageId) => {
      const message = messages.find((msg) => msg.id === messageId);
      return message?.isSent === true;
    });
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const response = await fetch("/api/chats/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatId }),
      });

      if (response.ok) {
        // Go back to chat list
        setSelectedChat(null);
        setMessages([]);

        // Update chat list
        fetchChats();
      } else {
        console.error("Failed to delete chat:", response.status);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
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

  const formatMessageTime = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return "Invalid Date";
    }

    return dateObj.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatChatTime = (date?: Date | string) => {
    if (!date) return "";

    const messageDate = typeof date === "string" ? new Date(date) : date;

    // Check if date is valid
    if (isNaN(messageDate.getTime())) {
      return "Invalid Date";
    }

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return formatMessageTime(messageDate);
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  if (selectedChat) {
    return (
      <div className="h-screen flex flex-col">
        {/* Selection Mode Bar */}
        {isSelectionMode ? (
          <MessageSelectionBar
            selectedCount={selectedMessages.size}
            hasOnlySentMessages={areSelectedMessagesSentByUser()}
            onDelete={handleBulkDelete}
            onCancel={cancelSelection}
          />
        ) : (
          /* Regular Chat Header */
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
                  onError={handleImageError}
                />
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

            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={toggleSelectionMode}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  title="Select messages"
                >
                  <svg
                    className="w-5 h-5 text-gray-600 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
              )}

              <ChatOptions
                chatId={selectedChat.id}
                otherUserName={selectedChat.otherUser.displayName}
                onDeleteChat={handleDeleteChat}
              />
            </div>
          </div>
        )}

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
                  <TranslatedText>Start a conversation with</TranslatedText>{" "}
                  {selectedChat.otherUser.displayName}
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`group flex mb-4 ${
                  message.isSent ? "justify-end" : "justify-start"
                }`}
              >
                <div className="relative flex items-end gap-3 max-w-[75%]">
                  {/* Selection mode checkbox */}
                  {isSelectionMode && (
                    <button
                      onClick={() => toggleMessageSelection(message.id)}
                      className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 transform hover:scale-110 ${
                        selectedMessages.has(message.id)
                          ? "bg-gradient-to-r from-green-500 to-green-100 border-green-500 shadow-lg"
                          : "border-gray-300 dark:border-gray-600 hover:border-green-400 bg-white dark:bg-gray-700"
                      } ${
                        message.isSent ? "order-first ml-2" : "order-last mr-2"
                      }`}
                    >
                      {selectedMessages.has(message.id) && (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  )}

                  {/* Avatar for received messages */}
                  {!message.isSent && !isSelectionMode && (
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 p-0.5">
                        <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                            {selectedChat?.otherUser.username
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    {/* Message bubble with enhanced design */}
                    <div
                      onClick={
                        isSelectionMode
                          ? () => toggleMessageSelection(message.id)
                          : undefined
                      }
                      className={`relative px-5 py-3 rounded-3xl shadow-lg backdrop-blur-sm transition-all duration-300 transform hover:scale-[1.02] ${
                        message.isSent
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-green-500/25"
                          : "bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white border border-gray-200/50 dark:border-gray-700/50 shadow-gray-500/10"
                      } ${
                        isSelectionMode
                          ? `cursor-pointer ${
                              selectedMessages.has(message.id)
                                ? "ring-4 ring-blue-300/50 dark:ring-blue-500/30"
                                : "hover:ring-4 hover:ring-gray-300/30"
                            }`
                          : ""
                      }`}
                      style={{
                        borderRadius: message.isSent
                          ? "24px 24px 8px 24px"
                          : "24px 24px 24px 8px",
                      }}
                    >
                      {/* Message content */}
                      <p
                        className={`text-sm font-medium leading-relaxed ${
                          message.isSent
                            ? "text-white"
                            : "text-gray-800 dark:text-gray-100"
                        }`}
                      >
                        {message.content}
                      </p>

                      {/* Decorative elements for sent messages */}
                      {message.isSent && (
                        <>
                          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-3xl pointer-events-none"></div>
                        </>
                      )}
                    </div>

                    {/* Message info and status */}
                    <div
                      className={`flex items-center justify-between mt-2 px-2 ${
                        message.isSent ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <div
                        className={`flex items-center space-x-2 ${
                          message.isSent
                            ? "flex-row-reverse space-x-reverse"
                            : ""
                        }`}
                      >
                        <p
                          className={`text-xs font-medium ${
                            message.isSent
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {formatMessageTime(message.createdAt)}
                        </p>

                        {message.isSent && (
                          <div className="flex items-center">
                            <MessageStatus
                              status={message.isRead ? "read" : message.status}
                              isFromSender={true}
                              className="scale-90"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Individual message options - only show when not in selection mode */}
                  {!isSelectionMode && (
                    <MessageOptions
                      messageId={message.id}
                      isSent={message.isSent}
                      messageAge={
                        Date.now() - new Date(message.createdAt).getTime()
                      }
                      onDeleteMessage={handleDeleteMessage}
                      className={`transition-opacity duration-200 ${
                        message.isSent ? "order-first mr-2" : "order-last ml-2"
                      }`}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-gradient-to-r from-white/95 to-gray-50/95 dark:from-gray-800/95 dark:to-gray-900/95 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50 p-6">
          <div className="flex items-end gap-4">
            <div className="flex-1 relative group">
              <div className="relative">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Send your Ghost ... 👻"
                  className="w-full px-6 py-4 pr-16 rounded-3xl border-2 border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 dark:focus:border-green-400 transition-all duration-300 shadow-sm focus:shadow-lg font-medium"
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                />

                {/* Emoji button */}
                <div
                  className="absolute right-4 top-1/2 transform -translate-y-1/2"
                  ref={emojiPickerRef}
                >
                  <button
                    onClick={handleEmojiClick}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all duration-200 hover:scale-110"
                    aria-label="Add emoji"
                  >
                    <span className="text-xl">😊</span>
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-full right-0 mb-4 z-50 shadow-2xl rounded-2xl overflow-hidden">
                      <EmojiPicker onEmojiClick={handleEmojiSelect} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Send button */}
            <button
              onClick={handleSendMessage}
              disabled={!messageText.trim()}
              className="group relative p-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-110 disabled:transform-none"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <svg
                className="relative w-6 h-6 text-white transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-200"
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

          {/* Typing indicator placeholder */}
          {messageText.length > 0 && (
            <div className="mt-3 flex items-center justify-center">
              <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Press Enter to send
                </span>
              </div>
            </div>
          )}
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
                <TranslatedText>
                  Start chatting with people you follow
                </TranslatedText>
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
              className="group flex items-center hover:bg-gray-50 dark:hover:bg-[#1a1625] transition-colors border-b border-gray-100 dark:border-gray-700"
            >
              <div
                onClick={() => handleChatSelect(chat)}
                className="flex items-center gap-3 p-4 cursor-pointer flex-1"
              >
                <div className="relative">
                  <img
                    src={chat.otherUser.avatar}
                    alt={chat.otherUser.displayName}
                    className="w-12 h-12 rounded-full"
                    onError={handleImageError}
                  />
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

              {/* Quick delete button for chat list */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteChat(chat.id);
                }}
                className="p-3 opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500 transition-all rounded-r-lg"
                title="Delete Chat"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
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
                        window.dispatchEvent(
                          new CustomEvent("navigateToExplore")
                        );
                      }}
                    >
                      <TranslatedText>
                        Explore to find people to follow
                      </TranslatedText>
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
                          onError={handleImageError}
                        />
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
