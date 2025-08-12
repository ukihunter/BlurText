"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { TranslatedText } from "@/hooks/useTranslation";
import { generateConsistentAvatar } from "@/utils/avatarUtils";
import Icon from "./Icon";

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
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + selectedImages.length > 4) {
      setError("You can upload maximum 4 images");
      return;
    }

    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        setError("Each image must be less than 5MB");
        return false;
      }
      return file.type.startsWith("image/");
    });

    setSelectedImages((prev) => [...prev, ...validFiles]);

    // Create preview URLs
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviewUrls((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));
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
      // For now, we'll just send the post without image upload
      // In a real app, you'd upload images to a cloud service first
      const imageUrls: string[] = [];

      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          content: content.trim(),
          images: imageUrls,
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
      setSelectedImages([]);
      setImagePreviewUrls([]);

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
      setSelectedImages([]);
      setImagePreviewUrls([]);
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

          {/* Image Previews */}
          {imagePreviewUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {imagePreviewUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <Image
                    src={url}
                    alt={`Preview ${index + 1}`}
                    width={200}
                    height={128}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Icon name="cross.svg" width={16} height={16} />
                  </button>
                </div>
              ))}
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
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || selectedImages.length >= 4}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon name="image.svg" width={20} height={20} />
                <span className="text-sm">
                  <TranslatedText>Photo</TranslatedText>
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={isLoading}
              />
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
