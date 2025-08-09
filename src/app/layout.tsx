"use client";

import React, { useState, useEffect, useCallback } from "react";
import LeftBar from "@/components/LeftBar";
import "./globals.css";
import RightBar from "@/components/RightBar";
import Loading from "@/components/Loading";
import Login from "@/components/Login";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TranslationProvider } from "@/contexts/TranslationContext";

// Import page components
import Home from "@/content/Home";
import Explore from "@/content/Explore";
import Messages from "@/content/Messages";
import FollowersList from "@/components/FollowersList";
import More from "@/options/More";
import Privacy from "@/options/Privacy";
import { TranslatedText } from "@/hooks/useTranslation";

//export const metadata = {
//title: "BLUR TEXT",
//description: "Anonymous app.",
//};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Page content mapping function
  const getPageContent = (pageName: string): React.ReactNode => {
    switch (pageName) {
      case "Home":
        return <Home />;
      case "Explore":
        return <Explore />;
      case "Messages":
        return <Messages key={messageKey} selectedUser={selectedMessageUser} />;
      case "Notification":
        return (
          <div>
            <TranslatedText>Notification Content</TranslatedText>
          </div>
        );
      case "Bookmarks":
        return (
          <div>
            <TranslatedText>Bookmarks Content</TranslatedText>
          </div>
        );
      case "Profile":
        return (
          <FollowersList onBack={() => handleMenuClick(<Home />, "Home")} />
        );
      case "More":
        return <More />;
      case "Privacy":
        return <Privacy />;
      default:
        return children; // Fallback to default content
    }
  };

  // Initialize with null first, then load from localStorage or fallback to Home
  const [activeContent, setActiveContent] = useState<React.ReactNode>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showInitialLoading, setShowInitialLoading] = useState(true);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [currentPage, setCurrentPage] = useState<string>("Home");
  const [selectedMessageUser, setSelectedMessageUser] = useState<any>(null);
  const [messageKey, setMessageKey] = useState(0);
  const [user, setUser] = useState<{
    username: string;
    id: string;
  } | null>(null);

  // Restore page state from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPage = localStorage.getItem("blurtext-current-page");
      const pageToLoad = savedPage || "Home";
      setCurrentPage(pageToLoad);
      setActiveContent(getPageContent(pageToLoad));
    }
  }, []);

  // Save current page to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined" && currentPage) {
      localStorage.setItem("blurtext-current-page", currentPage);
    }
  }, [currentPage]);

  // Check if user is logged in when component mounts
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const userData = await response.json();
        const userInfo = {
          username: userData.user.username,
          id: userData.user.id,
        };
        setIsLoggedIn(true);
        setUser(userInfo);
        // Dispatch user change event
        window.dispatchEvent(
          new CustomEvent("userChanged", { detail: userInfo })
        );
      } else {
        setIsLoggedIn(false);
        setUser(null);
        // Dispatch user change event for logout
        window.dispatchEvent(new CustomEvent("userChanged", { detail: null }));
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsLoggedIn(false);
      setUser(null);
      // Dispatch user change event for error case
      window.dispatchEvent(new CustomEvent("userChanged", { detail: null }));
    } finally {
      setIsAuthChecked(true);
    }
  };

  // Initial loading effect - shows before login, but only if not authenticated
  useEffect(() => {
    const initialTimer = setTimeout(
      () => {
        setShowInitialLoading(false);
      },
      isAuthChecked && isLoggedIn ? 500 : 2000
    ); // Shorter delay if already logged in

    return () => {
      clearTimeout(initialTimer);
    };
  }, [isAuthChecked, isLoggedIn]);

  // Loading effect - only run after login, and skip on initial load
  useEffect(() => {
    if (!isLoggedIn || !isAuthChecked) return; // Don't run loading effect if not logged in or auth not checked

    // Skip loading on initial page load to prevent redirect to home
    if (!showInitialLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 500); // Reduced from 2000ms to prevent long delays

      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isLoggedIn) {
        setIsLoading(true);
        setTimeout(() => {
          setIsLoading(false);
        }, 1000); // Reduced delay
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoggedIn, isAuthChecked, showInitialLoading]);

  const handleMenuClick = (content: React.ReactNode, pageName?: string) => {
    // Clear selected message user when navigating to Messages normally (not via message button)
    if (pageName === "Messages") {
      setSelectedMessageUser(null);
      setMessageKey((prev) => prev + 1);
    }
    // Clear selected message user when navigating away from Messages
    if (pageName && pageName !== "Messages") {
      setSelectedMessageUser(null);
      setMessageKey((prev) => prev + 1);
    }

    setIsLoading(true);
    setTimeout(() => {
      setActiveContent(content);
      if (pageName) {
        setCurrentPage(pageName);
      }
      setIsLoading(false);
    }, 300);
  };

  // Function to navigate to Messages with a specific user selected
  const handleMessageUser = useCallback((user: any) => {
    console.log("🔔 handleMessageUser called with:", user);

    // Force clear any existing selected user first
    setSelectedMessageUser(null);
    setMessageKey((prev) => prev + 1); // Force new component instance

    // Set the new user after a brief delay to ensure state is cleared
    setTimeout(() => {
      setSelectedMessageUser(user);
      setIsLoading(true);

      setTimeout(() => {
        console.log(
          "🔔 Navigating to Messages with selectedMessageUser:",
          user
        );
        setCurrentPage("Messages");
        setActiveContent(getPageContent("Messages"));
        setIsLoading(false);
      }, 100);
    }, 50);
  }, []);

  const handleLogin = (userData?: { username: string; id: string }) => {
    setIsLoggedIn(true);
    setIsAuthChecked(true);
    if (userData) {
      // Set user data directly from login response
      setUser(userData);
      // Dispatch user change event
      window.dispatchEvent(
        new CustomEvent("userChanged", { detail: userData })
      );
    } else {
      // Fallback to checking auth status
      setTimeout(() => {
        checkAuthStatus();
      }, 100);
    }
    setIsLoading(true); // Reset loading state when logging in
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        console.log("Logout successful");
        setIsLoggedIn(false);
        setUser(null);
        setIsAuthChecked(true);
        // Dispatch user change event
        window.dispatchEvent(new CustomEvent("userChanged", { detail: null }));
      } else {
        console.error("Logout failed");
        setIsLoggedIn(false);
        setUser(null);
        setIsAuthChecked(true);
      }
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggedIn(false);
      setUser(null);
      setIsAuthChecked(true);
    }
  };

  // Show initial loading screen only for first time load or when not authenticated
  if (showInitialLoading && (!isAuthChecked || !isLoggedIn)) {
    return (
      <html lang="en">
        <head>
          <title>BlurText - Anonymous Social Platform</title>
          <meta
            name="description"
            content="Anonymous social interaction through unique credentials. Share thoughts freely without revealing your identity."
          />
          <link rel="icon" href="icons/icone.png" />
        </head>
        <body>
          <ThemeProvider>
            <TranslationProvider>
              <Loading />
            </TranslationProvider>
          </ThemeProvider>
        </body>
      </html>
    );
  }

  // Show login page if not logged in (and auth check is complete)
  if (isAuthChecked && !isLoggedIn) {
    return (
      <html lang="en">
        <head>
          <title>BlurText - Anonymous Social Platform</title>
          <meta
            name="description"
            content="Anonymous social interaction through unique credentials. Share thoughts freely without revealing your identity."
          />
          <link rel="icon" href="icons/icone.png" />
        </head>
        <body>
          <ThemeProvider>
            <TranslationProvider>
              <Login onLogin={handleLogin} />
            </TranslationProvider>
          </ThemeProvider>
        </body>
      </html>
    );
  }

  // Show loading only when transitioning between content (not during auth check)
  if (isLoggedIn && isAuthChecked && isLoading) {
    return (
      <html lang="en">
        <head>
          <title>BlurText - Anonymous Social Platform</title>
          <meta
            name="description"
            content="Anonymous social interaction through unique credentials. Share thoughts freely without revealing your identity."
          />
          <link rel="icon" href="icons/icone.png" />
        </head>
        <body>
          <ThemeProvider>
            <TranslationProvider>
              <Loading />
            </TranslationProvider>
          </ThemeProvider>
        </body>
      </html>
    );
  }

  // Show main app only when logged in and auth is checked
  if (isLoggedIn && isAuthChecked) {
    return (
      <html lang="en">
        <head>
          <title>BlurText - Anonymous Social Platform</title>
          <meta
            name="description"
            content="Anonymous social interaction through unique credentials. Share thoughts freely without revealing your identity."
          />
          <link rel="icon" href="icons/icone.png" />
        </head>
        <body>
          <ThemeProvider>
            <TranslationProvider>
              <div className="max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl xxl:max-w-screen-xxl mx-auto flex justify-between bg-white dark:bg-[#262335] text-black dark:text-[#ededed] transition-colors duration-300 h-screen overflow-hidden">
                <div className="px-3 xsm:px-4 xxl:px-8 sticky top-0 h-screen overflow-y-auto scrollable-content">
                  <LeftBar
                    onMenuClick={handleMenuClick}
                    onLogout={handleLogout}
                    user={user}
                    currentPage={currentPage}
                  />
                </div>
                <div className="flex-1 lg:min-w-[600px] border-x-[1px] border-gray-200 dark:border-borderGray h-screen overflow-y-auto scrollable-content">
                  {activeContent}
                </div>
                <div className="hidden ml-4 md:ml-8 lg:block lg:w-80 xl:w-96 sticky top-0 h-screen overflow-y-auto scrollable-content">
                  <RightBar onMenuClick={handleMenuClick} />
                </div>
              </div>
            </TranslationProvider>
          </ThemeProvider>
        </body>
      </html>
    );
  }

  // Fallback: show loading if none of the conditions are met
  return (
    <html lang="en">
      <head>
        <title>BlurText - Anonymous Social Platform</title>
        <meta
          name="description"
          content="Anonymous social interaction through unique credentials. Share thoughts freely without revealing your identity."
        />
        <link rel="icon" href="icons/icone.png" />
      </head>
      <body>
        <ThemeProvider>
          <TranslationProvider>
            <Loading />
          </TranslationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
