"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Icon from "@/components/Icon";
import { generateConsistentAvatar } from "@/utils/avatarUtils";
import { showErrorToast } from "@/utils/toast";

interface Comment {
  _id: string;
  postId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postContent: string;
  postAuthor: string;
  onCommentAdded: () => void;
}

const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  onClose,
  postId,
  postContent,
  postAuthor,
  onCommentAdded,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch comments when modal opens
  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts/comments?postId=${postId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
      // Focus on textarea when modal opens
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, fetchComments]);

  // Handle escape key and click outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/posts/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          content: newComment.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments([data.comment, ...comments]);
        setNewComment("");
        onCommentAdded();
        // Scroll to top to see the new comment
        const commentsContainer = document.getElementById("comments-container");
        if (commentsContainer) {
          commentsContainer.scrollTop = 0;
        }
      } else {
        const errorData = await response.json();
        showErrorToast(errorData.error || "Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      showErrorToast("Failed to add comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl mx-4 max-h-[90vh] bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 flex flex-col overflow-hidden"
      >
        {/* Enhanced Header with gradient */}
        <div className="relative flex items-center justify-between p-6 border-b border-gray-200/30 dark:border-gray-700/30 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5"></div>
          <div className="relative flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text">
                Comments
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Join the conversation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="relative p-2 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-2xl transition-all duration-200 hover:scale-110 group"
          >
            <Icon name="cross.svg" width={24} height={24} className="text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200" />
          </button>
        </div>

        {/* Enhanced Original Post */}
        <div className="relative p-6 border-b border-gray-200/30 dark:border-gray-700/30 bg-gradient-to-br from-gray-50/80 to-blue-50/40 dark:from-gray-800/60 dark:to-blue-900/20 backdrop-blur-sm">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none"></div>
          
          <div className="relative flex items-start space-x-4">
            {/* Enhanced avatar */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-75 blur-sm"></div>
              <Image
                src={generateConsistentAvatar(postAuthor)}
                alt={`${postAuthor}'s avatar`}
                width={50}
                height={50}
                className="relative rounded-full ring-3 ring-white dark:ring-gray-800 shadow-lg"
              />
              {/* Author badge */}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center shadow-sm">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Author info */}
              <div className="flex items-center space-x-3 mb-3">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text">
                  {postAuthor}
                </h3>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-full">
                  Original Post
                </span>
              </div>
              
              {/* Post content with enhanced styling */}
              <div className="relative bg-white/60 dark:bg-gray-700/40 p-4 rounded-2xl border border-gray-200/50 dark:border-gray-600/50 backdrop-blur-sm">
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-medium line-clamp-4">
                  {postContent}
                </p>
                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-blue-400/20 to-transparent rounded-tl-2xl rounded-br-2xl"></div>
              </div>
            </div>
            
            {/* Post engagement hint */}
            <div className="flex flex-col items-center space-y-2 opacity-60">
              <button className="p-2 hover:bg-white/50 rounded-full transition-colors">
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
              <button className="p-2 hover:bg-white/50 rounded-full transition-colors">
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Comment Form */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/10 dark:to-purple-900/10">
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <div className="relative group">
              {/* Animated border */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm"></div>
              
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts... ✨"
                  className="relative w-full p-5 border-2 border-gray-300 dark:border-gray-600 rounded-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 shadow-sm focus:shadow-lg"
                  rows={4}
                  maxLength={500}
                  disabled={isSubmitting}
                  style={{
                    minHeight: '120px'
                  }}
                />
                
                {/* Character counter with animated progress */}
                <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                  <div className="relative w-8 h-8">
                    <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        className="text-gray-300 dark:text-gray-600"
                      />
                      <circle
                        cx="16"
                        cy="16"
                        r="14"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray={87.92}
                        strokeDashoffset={87.92 - (87.92 * newComment.length) / 500}
                        className={`transition-all duration-300 ${
                          newComment.length > 400
                            ? "text-red-500"
                            : newComment.length > 250
                            ? "text-yellow-500"
                            : "text-blue-500"
                        }`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-xs font-bold ${
                        newComment.length > 400
                          ? "text-red-500"
                          : newComment.length > 250
                          ? "text-yellow-500"
                          : "text-gray-500 dark:text-gray-400"
                      }`}>
                        {500 - newComment.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                {/* Quick action buttons */}
                <button
                  type="button"
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4zM9 6v10a1 1 0 102 0V6a1 1 0 10-2 0zm4 0v10a1 1 0 102 0V6a1 1 0 10-2 0z" />
                  </svg>
                  <span>📷</span>
                </button>
                
                <button
                  type="button"
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all duration-200"
                >
                  <span>😊</span>
                </button>
                
                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">
                  <kbd className="font-mono">Ctrl</kbd> + <kbd className="font-mono">Enter</kbd> to post
                </div>
              </div>
              
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="group relative px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none transform hover:scale-[1.02] disabled:transform-none"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Posting...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Comment</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Comments List */}
        <div
          id="comments-container"
          className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative mb-8">
                {/* Floating icons animation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800/30 dark:to-purple-800/30 rounded-full flex items-center justify-center">
                      <Icon
                        name="comment.svg"
                        width={40}
                        height={40}
                        className="text-blue-500 dark:text-blue-400 opacity-80"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Floating decorative elements */}
                <div className="absolute top-4 left-8 w-3 h-3 bg-blue-400 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="absolute top-12 right-6 w-2 h-2 bg-purple-400 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute bottom-8 left-12 w-4 h-4 bg-pink-400 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '1s' }}></div>
                <div className="absolute bottom-4 right-10 w-2.5 h-2.5 bg-indigo-400 rounded-full opacity-60 animate-bounce" style={{ animationDelay: '1.5s' }}></div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  No comments yet
                </h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                  Be the first to share your thoughts and start the conversation! 💭
                </p>
                
                {/* Call to action */}
                <div className="flex items-center justify-center space-x-2 mt-6">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">💬</span>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✨</span>
                    </div>
                    <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-pink-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">🎉</span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Join the discussion!
                  </span>
                </div>
              </div>
            </div>
          ) : (
            comments.map((comment) => (
              <div
                key={comment._id}
                className="group relative flex items-start space-x-4 p-5 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/30 dark:hover:from-blue-900/20 dark:hover:to-purple-900/10 rounded-2xl transition-all duration-300 ease-in-out transform hover:scale-[1.01] border border-transparent hover:border-blue-200/30 dark:hover:border-blue-700/30"
              >
                {/* Avatar with gradient ring */}
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                  <Image
                    src={generateConsistentAvatar(comment.username)}
                    alt={`${comment.username}'s avatar`}
                    width={44}
                    height={44}
                    className="relative rounded-full ring-2 ring-white dark:ring-gray-800 shadow-lg"
                  />
                  {/* Online indicator */}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full shadow-sm"></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Header with username and time */}
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-gray-900 dark:text-white text-base bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text">
                        {comment.username}
                      </h4>
                      {/* Verified badge */}
                      <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  
                  {/* Comment content with enhanced styling */}
                  <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm group-hover:shadow-md transition-shadow duration-300">
                    <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-sm font-medium">
                      {comment.content}
                    </p>
                    {/* Decorative gradient border */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex items-center space-x-4 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="flex items-center space-x-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span>Like</span>
                    </button>
                    <button className="flex items-center space-x-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition-colors">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>Reply</span>
                    </button>
                    <button className="text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Floating menu dots */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CommentModal;
