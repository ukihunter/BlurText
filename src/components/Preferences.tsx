"use client";

import React, { useState, useEffect } from "react";
import { TranslatedText } from "@/hooks/useTranslation";
import { useTheme } from "@/contexts/ThemeContext";

interface PreferencesProps {
  onComplete: () => void;
  isOnboarding?: boolean;
}

const Preferences: React.FC<PreferencesProps> = ({
  onComplete,
  isOnboarding = true,
}) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Preference states (simplified)
  const [interests, setInterests] = useState<string[]>([]);

  const interestOptions = [
    { id: "technology", label: "Technology", icon: "💻" },
    { id: "art", label: "Art", icon: "🎨" },
    { id: "music", label: "Music", icon: "🎵" },
    { id: "sports", label: "Sports", icon: "⚽" },
    { id: "travel", label: "Travel", icon: "✈️" },
    { id: "food", label: "Food", icon: "🍕" },
    { id: "gaming", label: "Gaming", icon: "🎮" },
    { id: "movies", label: "Movies", icon: "🎬" },
    { id: "fitness", label: "Fitness", icon: "💪" },
    { id: "lifestyle", label: "Lifestyle", icon: "✨" },
  ];

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSave = () => {
    setValidationError("");

    // Validate interests
    if (interests.length === 0) {
      setValidationError("Please select at least one interest");
      return;
    }

    handleSavePreferences();
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          interests,
          completeOnboarding: isOnboarding,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onComplete();
      } else {
        const errorData = await response.json();
        console.error("Failed to save preferences:", errorData);
        alert("Failed to save preferences. Please try again.");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert("Error saving preferences. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            <TranslatedText>What interests you?</TranslatedText>
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            <TranslatedText>
              Select topics you&apos;d like to see more of (choose at least one)
            </TranslatedText>
          </p>
        </div>

        {validationError && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded">
            {validationError}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {interestOptions.map((interest) => (
            <button
              key={interest.id}
              onClick={() => toggleInterest(interest.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                interests.includes(interest.id)
                  ? "border-purple-500 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                  : "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-purple-300 dark:hover:border-purple-500"
              }`}
            >
              <div className="text-2xl mb-2">{interest.icon}</div>
              <div className="text-sm font-medium">{interest.label}</div>
            </button>
          ))}
        </div>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <span>Selected: {interests.length} interests</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 dark:from-[#1a1625] dark:via-[#262335] dark:to-[#2d1b3d] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="bg-white/90 dark:bg-[#262335]/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src={
                  theme === "light" ? "icons/blur-dark.png" : "icons/blur.png"
                }
                alt="BlurText Logo"
                width={80}
                height={80}
                className="mx-auto"
              />
            </div>
            {isOnboarding && (
              <div>
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent">
                  <TranslatedText>Welcome to BlurText!</TranslatedText>
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  <TranslatedText>
                    Let&apos;s personalize your experience
                  </TranslatedText>
                </p>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="mb-8">{renderStep()}</div>

          {/* Save Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-8 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-700 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <TranslatedText>Saving...</TranslatedText>
                </div>
              ) : (
                <TranslatedText>Complete Setup</TranslatedText>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preferences;
