"use client";

import React, { useState } from "react";

interface PostImage {
  filename: string;
  mimetype: string;
  size: number;
}

interface PostImagesProps {
  postId: string;
  images: PostImage[];
  className?: string;
}

const PostImages: React.FC<PostImagesProps> = ({
  postId,
  images,
  className = "",
}) => {
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const handleImageError = (index: number) => {
    setFailedImages((prev) => new Set([...prev, index]));
  };

  const openImageModal = (index: number) => {
    setSelectedImage(index);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  if (!images || images.length === 0) return null;

  const getGridClass = () => {
    switch (images.length) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-2";
      case 4:
        return "grid-cols-2";
      default:
        return "grid-cols-2";
    }
  };

  return (
    <>
      <div className={`mt-3 grid ${getGridClass()} gap-2 ${className}`}>
        {images.map((image, index) => {
          if (failedImages.has(index)) {
            return (
              <div
                key={index}
                className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center"
              >
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <div className="text-2xl mb-2">🖼️</div>
                  <div className="text-sm">Image failed to load</div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={index}
              className={`relative cursor-pointer group overflow-hidden rounded-lg ${
                images.length === 3 && index === 0 ? "row-span-2" : ""
              }`}
            >
              <img
                src={`/api/image/${postId}/${index}`}
                alt={`Post image ${index + 1}`}
                className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={() => handleImageError(index)}
                onClick={() => openImageModal(index)}
              />

              {/* Overlay with image info */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-end">
                <div className="p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  {image.filename}
                </div>
              </div>

              {/* Image count indicator for multiple images */}
              {images.length > 1 && (
                <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
                  {index + 1}/{images.length}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Image Modal */}
      {selectedImage !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={`/api/image/${postId}/${selectedImage}`}
              alt={`Post image ${selectedImage + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Close button */}
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 bg-black bg-opacity-60 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-80 transition-colors"
            >
              ×
            </button>

            {/* Navigation buttons for multiple images */}
            {images.length > 1 && (
              <>
                {selectedImage > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(selectedImage - 1);
                    }}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-80 transition-colors"
                  >
                    ‹
                  </button>
                )}

                {selectedImage < images.length - 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(selectedImage + 1);
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-60 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-80 transition-colors"
                  >
                    ›
                  </button>
                )}
              </>
            )}

            {/* Image info */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-2 rounded-lg">
              <div className="text-sm font-medium">
                {images[selectedImage].filename}
              </div>
              <div className="text-xs text-gray-300">
                {(images[selectedImage].size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PostImages;
