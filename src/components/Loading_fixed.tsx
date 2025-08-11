"use client";

import React from "react";

const Loading = () => {
  return (
    <div className="fixed inset-0 bg-white dark:bg-[#262335] flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        {/* Spinning Animation */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin">
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
        </div>

        <h2 className="mt-4 text-2xl font-bold text-black dark:text-white">
          BlurText
        </h2>

        {/* Loading Text - Static text to avoid translation API calls */}
        <p className="mt-2 text-gray-500 dark:text-gray-400 animate-pulse">
          Loading your anonymous experience...
        </p>

        {/* Dots Animation */}
        <div className="flex space-x-1 mt-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
