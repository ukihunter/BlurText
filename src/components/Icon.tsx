"use client";

import React from "react";

interface IconProps {
  name: string;
  width?: number;
  height?: number;
  className?: string;
}

const Icon: React.FC<IconProps> = ({
  name,
  width = 24,
  height = 24,
  className = "",
}) => {
  const iconComponents: { [key: string]: React.ReactNode } = {
    "home.svg": (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 24 24"
        className={`fill-current ${className}`}
      >
        <path d="M21.591 7.146L12.52 1.157c-.316-.21-.724-.21-1.04 0l-9.071 5.99c-.26.173-.409.456-.409.757v13.183c0 .502.418.913.929.913H9.14c.51 0 .929-.41.929-.913v-7.075h3.909v7.075c0 .502.417.913.928.913h6.165c.511 0 .929-.41.929-.913V7.904c0-.301-.158-.584-.408-.758z" />
      </svg>
    ),
    "explore.svg": (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 24 24"
        className={`fill-current ${className}`}
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
    "notification.svg": (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 24 24"
        className={`fill-current ${className}`}
      >
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
      </svg>
    ),
    "message.svg": (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 24 24"
        className={`fill-current ${className}`}
      >
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
      </svg>
    ),
    "ghost.svg": (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
      >
        {/* Ghost body with smooth curves */}
        <path
          d="M12 2C8.13401 2 5 5.13401 5 9V16.5C5 17.3284 5.67157 18 6.5 18C7.32843 18 8 17.3284 8 16.5V15.5C8 14.6716 8.67157 14 9.5 14C10.3284 14 11 14.6716 11 15.5V17C11 17.5523 11.4477 18 12 18C12.5523 18 13 17.5523 13 17V15.5C13 14.6716 13.6716 14 14.5 14C15.3284 14 16 14.6716 16 15.5V16.5C16 17.3284 16.6716 18 17.5 18C18.3284 18 19 17.3284 19 16.5V9C19 5.13401 15.866 2 12 2Z"
          fill="currentColor"
          fillOpacity="0.9"
        />

        {/* Ghost eyes - larger and more expressive */}
        <ellipse cx="9.5" cy="8.5" rx="1.8" ry="2" fill="white" />
        <ellipse cx="14.5" cy="8.5" rx="1.8" ry="2" fill="white" />

        {/* Eye pupils for more character */}
        <circle cx="9.5" cy="8.8" r="0.8" fill="#1f2937" />
        <circle cx="14.5" cy="8.8" r="0.8" fill="#1f2937" />

        {/* Small highlight in eyes */}
        <circle cx="9.2" cy="8.5" r="0.3" fill="white" />
        <circle cx="14.2" cy="8.5" r="0.3" fill="white" />

        {/* Mouth - small oval for friendly look */}
        <ellipse cx="12" cy="12" rx="0.8" ry="1.2" fill="white" />
        <ellipse cx="12" cy="12" rx="0.5" ry="0.8" fill="#1f2937" />

        {/* Floating effect - subtle shadow/glow */}
        <path
          d="M6 19C6 19.5523 6.44772 20 7 20H17C17.5523 20 18 19.5523 18 19C18 18.4477 17.5523 18 17 18H7C6.44772 18 6 18.4477 6 19Z"
          fill="currentColor"
          fillOpacity="0.2"
        />
      </svg>
    ),
    "bookmark.svg": (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 24 24"
        className={`fill-current ${className}`}
      >
        <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
      </svg>
    ),
    "profile.svg": (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 24 24"
        className={`fill-current ${className}`}
      >
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    ),
    "more.svg": (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 24 24"
        className={`fill-current ${className}`}
      >
        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
      </svg>
    ),
    "post.svg": (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 24 24"
        className={`fill-current ${className}`}
      >
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
      </svg>
    ),
    "search.svg": (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 24 24"
        className={`fill-current ${className}`}
      >
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
      </svg>
    ),
    "cross.svg": (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={width}
        height={height}
        viewBox="0 0 24 24"
        fill="none"
        className={className}
      >
        {/* Enhanced cross/X symbol with better proportions */}
        <g
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* First diagonal line */}
          <path d="M17.5 6.5L6.5 17.5" opacity="0.9" />
          {/* Second diagonal line */}
          <path d="M6.5 6.5L17.5 17.5" opacity="0.9" />
        </g>

        {/* Optional: Add subtle shadow effect */}
        <g
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.1"
        >
          <path d="M18 7L7 18" />
          <path d="M7 7L18 18" />
        </g>
      </svg>
    ),
  };

  return (
    <div
      className={`text-gray-700 dark:text-white transition-colors duration-300 ${className}`}
    >
      {iconComponents[name] || (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={width}
          height={height}
          viewBox="0 0 24 24"
          className="fill-current"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      )}
    </div>
  );
};

export default Icon;
