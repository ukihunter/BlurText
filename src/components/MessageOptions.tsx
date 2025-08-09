import React, { useState, useRef, useEffect } from "react";
import { TranslatedText } from "@/hooks/useTranslation";

interface MessageOptionsProps {
  messageId: string;
  isSent: boolean;
  messageAge: number; // in milliseconds
  onDeleteMessage: (messageId: string, deleteType: 'delete-for-me' | 'delete-for-everyone') => void;
  className?: string;
}

const MessageOptions: React.FC<MessageOptionsProps> = ({
  messageId,
  isSent,
  messageAge,
  onDeleteMessage,
  className = ""
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Close options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDeleteForMe = () => {
    onDeleteMessage(messageId, 'delete-for-me');
    setShowOptions(false);
  };

  const handleDeleteForEveryone = () => {
    onDeleteMessage(messageId, 'delete-for-everyone');
    setShowOptions(false);
  };

  // Check if message can be deleted for everyone (within 48 hours and sent by user)
  const canDeleteForEveryone = isSent && messageAge < (48 * 60 * 60 * 1000);

  return (
    <div className={`relative ${className}`} ref={optionsRef}>
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Message options"
      >
        <svg
          className="w-4 h-4 text-gray-500 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </button>

      {showOptions && (
        <div className={`absolute z-50 bg-white dark:bg-[#262335] border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-2 min-w-[160px] ${
          isSent ? 'right-0' : 'left-0'
        }`}>
          <button
            onClick={handleDeleteForMe}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <TranslatedText>Delete for me</TranslatedText>
            </div>
          </button>

          {canDeleteForEveryone && (
            <button
              onClick={handleDeleteForEveryone}
              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <TranslatedText>Delete for everyone</TranslatedText>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageOptions;
