import React, { useState, useRef, useEffect } from "react";
import { TranslatedText } from "@/hooks/useTranslation";

interface ChatOptionsProps {
  chatId: string;
  otherUserName: string;
  onDeleteChat: (chatId: string) => void;
  className?: string;
}

const ChatOptions: React.FC<ChatOptionsProps> = ({
  chatId,
  otherUserName,
  onDeleteChat,
  className = ""
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Close options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
        setShowConfirmDialog(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDeleteChat = () => {
    setShowOptions(false);
    setShowConfirmDialog(true);
  };

  const confirmDeleteChat = () => {
    onDeleteChat(chatId);
    setShowConfirmDialog(false);
  };

  const cancelConfirm = () => {
    setShowConfirmDialog(false);
  };

  return (
    <div className={`relative ${className}`} ref={optionsRef}>
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        aria-label="Chat options"
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
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </button>

      {showOptions && (
        <div className="absolute right-0 top-full mt-2 z-50 bg-white dark:bg-[#262335] border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-2 min-w-[180px]">
          <button
            onClick={handleDeleteChat}
            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <TranslatedText>Delete for Me</TranslatedText>
            </div>
          </button>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white dark:bg-[#262335] rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              <TranslatedText>Delete Chat?</TranslatedText>
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              <TranslatedText>This will delete your chat with</TranslatedText> {otherUserName} <TranslatedText>from your view only. The other person will still see the chat unless they also delete it.</TranslatedText>
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelConfirm}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <TranslatedText>Cancel</TranslatedText>
              </button>
              
              <button
                onClick={confirmDeleteChat}
                className="px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
              >
                <TranslatedText>Delete</TranslatedText>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatOptions;
