import React from "react";
import { TranslatedText } from "@/hooks/useTranslation";

interface MessageSelectionBarProps {
  selectedCount: number;
  hasOnlySentMessages: boolean;
  onDelete: (deleteType: 'delete-for-me' | 'delete-for-everyone') => void;
  onCancel: () => void;
  className?: string;
}

const MessageSelectionBar: React.FC<MessageSelectionBarProps> = ({
  selectedCount,
  hasOnlySentMessages,
  onDelete,
  onCancel,
  className = ""
}) => {
  const [showDeleteOptions, setShowDeleteOptions] = React.useState(false);

  const handleDeleteForMe = () => {
    onDelete('delete-for-me');
    setShowDeleteOptions(false);
  };

  const handleDeleteForEveryone = () => {
    onDelete('delete-for-everyone');
    setShowDeleteOptions(false);
  };

  const handleCancel = () => {
    onCancel();
    setShowDeleteOptions(false);
  };

  return (
    <>
      <div className={`bg-blue-500 text-white p-4 flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-1 hover:bg-blue-600 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span className="font-medium">
            {selectedCount} <TranslatedText>selected</TranslatedText>
          </span>
        </div>
        
        <button
          onClick={() => setShowDeleteOptions(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <TranslatedText>Delete</TranslatedText>
        </button>
      </div>

      {/* Delete Options Modal */}
      {showDeleteOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white dark:bg-[#262335] rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              <TranslatedText>Delete</TranslatedText> {selectedCount} <TranslatedText>messages?</TranslatedText>
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={handleDeleteForMe}
                className="w-full p-3 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <div>
                    <p className="font-medium"><TranslatedText>Delete for me</TranslatedText></p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <TranslatedText>Messages will be removed from your chat</TranslatedText>
                    </p>
                  </div>
                </div>
              </button>

              {hasOnlySentMessages && (
                <button
                  onClick={handleDeleteForEveryone}
                  className="w-full p-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <div>
                      <p className="font-medium"><TranslatedText>Delete for everyone</TranslatedText></p>
                      <p className="text-sm opacity-75">
                        <TranslatedText>Messages will be removed for all participants</TranslatedText>
                      </p>
                    </div>
                  </div>
                </button>
              )}

              <button
                onClick={handleCancel}
                className="w-full p-3 text-center text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <TranslatedText>Cancel</TranslatedText>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MessageSelectionBar;
