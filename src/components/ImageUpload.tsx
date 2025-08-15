"use client";

import React, { useState, useRef } from "react";
import Icon from "./Icon";

interface EncryptedImageData {
  data: string;
  iv: string;
  key: string;
  filename: string;
  mimetype: string;
  size: number;
}

interface ImageUploadProps {
  onImagesUploaded: (images: EncryptedImageData[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImagesUploaded,
  maxImages = 4,
  disabled = false,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (files.length + selectedFiles.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    // Create previews for new files
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0) return [];

    setIsUploading(true);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("images", file);
    });

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        onImagesUploaded(data.images);
        // Clear the selected files and previews after successful upload
        setSelectedFiles([]);
        setPreviews([]);
        return data.images;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert(`Image upload failed: ${error}`);
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setSelectedFiles((files) => files.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setSelectedFiles([]);
    setPreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id="image-upload"
        disabled={disabled || isUploading}
      />

      <div className="flex items-center gap-2">
        <label
          htmlFor="image-upload"
          className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            disabled || isUploading
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          <Icon name="image" className="w-4 h-4" />
          Add Images ({selectedFiles.length}/{maxImages})
        </label>

        {selectedFiles.length > 0 && !isUploading && (
          <button
            onClick={clearAll}
            className="px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              />
              {!isUploading && (
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                >
                  ×
                </button>
              )}
              <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {selectedFiles[index]?.name}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <button
          onClick={uploadImages}
          disabled={isUploading || disabled}
          className={`w-full py-3 rounded-lg transition-colors font-medium ${
            isUploading || disabled
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-500 text-white hover:bg-green-600"
          }`}
        >
          {isUploading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Encrypting & Uploading...
            </div>
          ) : (
            "Upload Images"
          )}
        </button>
      )}

      {selectedFiles.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <p>💡 Images will be encrypted before storage for maximum privacy</p>
          <p>
            📁 Total size:{" "}
            {(
              selectedFiles.reduce((acc, file) => acc + file.size, 0) /
              1024 /
              1024
            ).toFixed(2)}{" "}
            MB
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
