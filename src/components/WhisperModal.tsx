"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { TranslatedText } from "@/hooks/useTranslation";
import { generateConsistentAvatar } from "@/utils/avatarUtils";
import ImageUpload from "./ImageUpload";
import Icon from "./Icon";

interface EncryptedImageData {
  data: string;
  iv: string;
  key: string;
  filename: string;
  mimetype: string;
  size: number;
}

interface WhisperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: () => void;
  user?: {
    username: string;
    id: string;
  } | null;
}

const WhisperModal: React.FC<WhisperModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
  user,
}) => {
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<EncryptedImageData[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Portal mount state
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Body scroll lock effect
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  const availableTags = [
    "technology",
    "art",
    "music",
    "sports",
    "travel",
    "food",
    "gaming",
    "movies",
    "fitness",
    "lifestyle",
    "news",
    "opinion",
    "funny",
    "inspiration",
    "question",
    "personal",
    "work",
    "study",
  ];

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [content]);

  useEffect(() => {
    // Prevent body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleImageUpload = (images: EncryptedImageData[]) => {
    setUploadedImages(images);
    setError(""); // Clear any previous errors
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    setError("");

    if (!content.trim()) {
      setError("Please write something to share");
      return;
    }

    if (selectedTags.length === 0) {
      setError("Please select at least one tag");
      return;
    }

    if (content.length > 1000) {
      setError("Post must be 1000 characters or less");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          content: content.trim(),
          images: uploadedImages, // Use encrypted images
          tags: selectedTags,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create post");
      }

      // Reset form
      setContent("");
      setSelectedTags([]);
      setUploadedImages([]);

      onPostCreated();
      onClose();
    } catch (error) {
      console.error("Error creating post:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create post"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setContent("");
      setSelectedTags([]);
      setUploadedImages([]);
      setError("");
      onClose();
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      style={{ zIndex: 999999 }}
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-[#262335] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative my-8"
        style={{ zIndex: 999999 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            <TranslatedText>Share a Whisper</TranslatedText>
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50"
          >
            <Icon name="cross.svg" width={20} height={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full overflow-hidden relative">
              <Image
                src={generateConsistentAvatar(user?.username || "anonymous")}
                alt={user?.username || "Anonymous"}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white capitalize">
                {user?.username || "Anonymous"}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                @{user?.username?.toLowerCase() || "anonymous"}
              </p>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Text Content */}
          <div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind? Share your whisper..."
              className="w-full min-h-[120px] max-h-[300px] p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              disabled={isLoading}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {content.length}/1000
              </span>
            </div>
          </div>

          {/* Image Upload Section */}
          {content.trim() && (
            <div>
              <ImageUpload
                onImagesUploaded={handleImageUpload}
                maxImages={4}
                disabled={isLoading}
              />
            </div>
          )}

          {/* Tags Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              <TranslatedText>Select Tags (required)</TranslatedText>
            </h3>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  disabled={isLoading}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors disabled:opacity-50 ${
                    selectedTags.includes(tag)
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-500"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Selected: {selectedTags.length} tags
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {uploadedImages.length > 0 && (
                  <span>{uploadedImages.length} image(s) ready</span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <TranslatedText>Cancel</TranslatedText>
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  isLoading || !content.trim() || selectedTags.length === 0
                }
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>
                  <TranslatedText>Share Whisper</TranslatedText>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default WhisperModal;
