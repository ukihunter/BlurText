"use client";

import React, { useState, useEffect, useCallback } from "react";
import LeftBar from "@/components/LeftBar";
import "./globals.css";
import RightBar from "@/components/RightBar";
import Loading from "@/components/Loading";
import Login from "@/components/Login";
import Preferences from "@/components/Preferences";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TranslationProvider } from "@/contexts/TranslationContext";

// Import page components
import Home from "@/content/Home";
import Explore from "@/content/Explore";
import Messages from "@/content/Messages";
import Profile from "@/content/Profile";
import More from "@/options/More";
import Privacy from "@/options/Privacy";
import { TranslatedText } from "@/hooks/useTranslation";

interface User {
  username: string;
  id: string;
  _id?: string;
}

//export const metadata = {
//title: "BLUR TEXT",
//description: "Anonymous app.",
//};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Initialize with null first, then load from localStorage or fallback to Home
  const [activeContent, setActiveContent] = useState<React.ReactNode>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showInitialLoading, setShowInitialLoading] = useState(true);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [currentPage, setCurrentPage] = useState<string>("Home");
  const [selectedMessageUser, setSelectedMessageUser] = useState<User | null>(
    null
  );
  const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(
    null
  );
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [messageKey, setMessageKey] = useState(0);
  const [user, setUser] = useState<{
    username: string;
    id: string;
  } | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isCheckingPreferences, setIsCheckingPreferences] = useState(false);

  // Page content mapping function
  const getPageContent = useCallback(
    (pageName: string): React.ReactNode => {
      switch (pageName) {
        case "Home":
          return <Home selectedHashtag={selectedHashtag} />;
        case "Explore":
          return <Explore />;
        case "Messages":
          return (
            <Messages
              key={messageKey}
              selectedUser={selectedMessageUser || undefined}
            />
          );
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
          return <Profile selectedUser={selectedProfileUser || undefined} />;
        case "More":
          return <More />;
        case "Privacy":
          return <Privacy />;
        default:
          return children; // Fallback to default content
      }
    },
    [
      selectedHashtag,
      messageKey,
      selectedMessageUser,
      selectedProfileUser,
      children,
    ]
  );

  // Restore page state from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPage = localStorage.getItem("blurtext-current-page");
      const pageToLoad = savedPage || "Home";
      setCurrentPage(pageToLoad);
      setActiveContent(getPageContent(pageToLoad));
    }
  }, [getPageContent]);

  // Save current page to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined" && currentPage) {
      localStorage.setItem("blurtext-current-page", currentPage);
    }
  }, [currentPage]);

  // Check if user is logged in when component mounts
  useEffect(() => {
    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthStatus = useCallback(async () => {
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

        // Check if user needs onboarding
        await checkUserPreferences();

        // Dispatch user change event
        window.dispatchEvent(
          new CustomEvent("userChanged", { detail: userInfo })
        );
      } else {
        setIsLoggedIn(false);
        setUser(null);
        setNeedsOnboarding(false);
        // Dispatch user change event for logout
        window.dispatchEvent(new CustomEvent("userChanged", { detail: null }));
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsLoggedIn(false);
      setUser(null);
      setNeedsOnboarding(false);
      // Dispatch user change event for error case
      window.dispatchEvent(new CustomEvent("userChanged", { detail: null }));
    } finally {
      setIsAuthChecked(true);
    }
  }, []);

  const checkUserPreferences = async () => {
    try {
      setIsCheckingPreferences(true);
      const response = await fetch("/api/preferences", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setNeedsOnboarding(!data.preferences.hasCompletedOnboarding);
      } else {
        // If preferences don't exist, user needs onboarding
        setNeedsOnboarding(true);
      }
    } catch (error) {
      console.error("Error checking preferences:", error);
      // Default to needing onboarding if there's an error
      setNeedsOnboarding(true);
    } finally {
      setIsCheckingPreferences(false);
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

  // Function to navigate to user profile
  const handleViewUserProfile = useCallback(
    (user: User) => {
      console.log("Viewing user profile:", user);
      setSelectedProfileUser(user);
      setIsLoading(true);
      setTimeout(() => {
        setCurrentPage("Profile");
        setActiveContent(getPageContent("Profile"));
        setIsLoading(false);
      }, 300);
    },
    [getPageContent]
  );

  // Function to filter by hashtag
  const handleFilterByHashtag = useCallback(
    (hashtag: string) => {
      console.log("Filtering by hashtag:", hashtag);
      setSelectedHashtag(hashtag);
      setIsLoading(true);
      setTimeout(() => {
        setCurrentPage("Home");
        setActiveContent(getPageContent("Home"));
        setIsLoading(false);
      }, 300);
    },
    [getPageContent]
  );

  const handleLogin = (userData?: { username: string; id: string }) => {
    setIsLoggedIn(true);
    setIsAuthChecked(true);
    if (userData) {
      // Set user data directly from login response
      setUser(userData);
      // Check if user needs onboarding after login
      setTimeout(() => {
        checkUserPreferences();
      }, 100);
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

  const handleOnboardingComplete = () => {
    setNeedsOnboarding(false);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
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

  // Show preferences/onboarding page for new users
  if (
    isLoggedIn &&
    isAuthChecked &&
    !isCheckingPreferences &&
    needsOnboarding
  ) {
    return (
      <html lang="en">
        <head>
          <title>BlurText - Set Your Preferences</title>
          <meta
            name="description"
            content="Personalize your BlurText experience with custom preferences."
          />
          <link rel="icon" href="icons/icone.png" />
        </head>
        <body>
          <ThemeProvider>
            <TranslationProvider>
              <Preferences
                onComplete={handleOnboardingComplete}
                isOnboarding={true}
              />
            </TranslationProvider>
          </ThemeProvider>
        </body>
      </html>
    );
  }

  // Show loading while checking preferences
  if (isLoggedIn && isAuthChecked && isCheckingPreferences) {
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
                  <RightBar
                    onMenuClick={handleMenuClick}
                    onUserSelect={handleViewUserProfile}
                    onHashtagSelect={handleFilterByHashtag}
                  />
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
