import React from "react";

interface MessageStatusProps {
  status: "sending" | "sent" | "delivered" | "read";
  className?: string;
  isFromSender?: boolean; // For better color adaptation in sent messages
}

const MessageStatus: React.FC<MessageStatusProps> = ({ 
  status, 
  className = "", 
  isFromSender = false 
}) => {
  const getStatusIcon = () => {
    // Color scheme for different states
    const colors = {
      sending: isFromSender ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.4)',
      sent: isFromSender ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
      delivered: isFromSender ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)',
      read: isFromSender ? '#000000' : '#3b82f6' // Black for own messages, lighter blue for others
    };    switch (status) {
      case "sending":
        return (
          <div className={`w-4 h-4 ${className}`}>
            {/* Clock icon for sending */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="7" stroke={colors.sending} strokeWidth="1.2" fill="none"/>
              <path d="M8 4v4l2.5 2.5" stroke={colors.sending} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      
      case "sent":
        return (
          <div className={`w-4 h-4 ${className}`}>
            {/* Single checkmark */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.5 4.5L6 12L2.5 8.5" stroke={colors.sent} strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
        );
      
      case "delivered":
        return (
          <div className={`w-4 h-4 ${className}`}>
            {/* Double checkmark - bigger size */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.5 3.5L5.5 8.5L3 6" stroke={colors.delivered} strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M13.5 3.5L8.5 8.5L7 7" stroke={colors.delivered} strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
        );
      
      case "read":
        return (
          <div className={`w-4 h-4 ${className}`}>
            {/* Double checkmark - Black/Dark blue - bigger size */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.5 3.5L5.5 8.5L3 6" stroke={colors.read} strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M13.5 3.5L8.5 8.5L7 7" stroke={colors.read} strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
        );
      
      default:
        return null;
    }
  };

  return getStatusIcon();
};

export default MessageStatus;
