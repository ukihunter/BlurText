"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/contexts/TranslationContext";

export const useTranslatedText = (originalText: string) => {
  const { translate, currentLanguage } = useTranslation();
  const [translatedText, setTranslatedText] = useState(originalText);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Don't translate if language is English or text is empty
    if (currentLanguage === "en" || !originalText.trim()) {
      setTranslatedText(originalText);
      return;
    }

    const translateText = async () => {
      setIsLoading(true);
      try {
        const result = await translate(originalText);
        setTranslatedText(result);
      } catch (error) {
        console.warn('Translation hook error:', error);
        setTranslatedText(originalText); // Fallback to original
      } finally {
        setIsLoading(false);
      }
    };

    // Add a small delay to avoid too many rapid API calls
    const timeoutId = setTimeout(translateText, 100);
    return () => clearTimeout(timeoutId);
  }, [originalText, currentLanguage, translate]);

  return { translatedText, isLoading };
};

// Component wrapper for translating text
export const TranslatedText: React.FC<{ 
  children: string; 
  className?: string;
  fallback?: string;
}> = ({ children, className = "", fallback = "" }) => {
  const { translatedText, isLoading } = useTranslatedText(children);
  
  if (isLoading && fallback) {
    return <span className={className}>{fallback}</span>;
  }
  
  return <span className={className}>{translatedText}</span>;
};
