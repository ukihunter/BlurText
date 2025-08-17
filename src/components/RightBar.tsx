import React, { useEffect, useState } from "react";
import Icon from "./Icon";
import Privacy from "@/options/Privacy";
import SearchModal from "./SearchModal";
import { TranslatedText } from "@/hooks/useTranslation";
import { useTranslation } from "@/contexts/TranslationContext";
import { generateConsistentAvatar } from "@/utils/avatarUtils";

interface CryptoData {
  id: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
}

interface CoinData {
  id?: string;
  symbol?: string;
  name?: string;
  price_usd?: string;
  percent_change_24h?: string;
}

interface NewsArticle {
  title?: string;
  url?: string;
  description?: string;
  publishedAt?: string;
}

interface User {
  username: string;
  id: string;
  _id?: string;
}

interface SuggestedUser {
  _id: string;
  username: string;
  email: string;
}

const RightBar = ({
  onMenuClick,
  onUserSelect,
  onHashtagSelect,
}: {
  onMenuClick?: (_content: React.ReactNode, _pageName?: string) => void;
  onUserSelect?: (_user: User) => void;
  onHashtagSelect?: (_hashtag: string) => void;
}) => {
  const { translate } = useTranslation();
  const [searchPlaceholder, setSearchPlaceholder] = useState("search");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Fetch news articles from the API
  const [news, setNews] = useState<
    {
      title: string;
      url: string;
      description?: string;
      publishedAt?: string;
      timeAgo?: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Cybersecurity alerts state
  const [cyberAlerts, setCyberAlerts] = useState<
    {
      title: string;
      description: string;
      severity: string;
      date: string;
      url?: string;
    }[]
  >([]);
  const [cyberLoading, setCyberLoading] = useState(true);
  const [cyberDataIsReal, setCyberDataIsReal] = useState(false);

  // Cryptocurrency state
  const [crypto, setCrypto] = useState<CryptoData[]>([]);
  const [cryptoLoading, setCryptoLoading] = useState(true);

  // News state
  const [newsDataIsReal, setNewsDataIsReal] = useState(false);

  // Suggested users state
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [followingStates, setFollowingStates] = useState<{
    [key: string]: boolean;
  }>({});
  const [usersLoading, setUsersLoading] = useState(true);
  const [processingUsers, setProcessingUsers] = useState<{
    [key: string]: boolean;
  }>({});

  // Translate search placeholder
  useEffect(() => {
    const translatePlaceholder = async () => {
      const translated = await translate("search");
      setSearchPlaceholder(translated);
    };
    translatePlaceholder();
  }, [translate]);

  // Handle Privacy Policy click
  const handlePrivacyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onMenuClick) {
      onMenuClick(<Privacy />, "Privacy");
    }
  };

  // Handle search functionality
  const handleSearchClick = () => {
    setIsSearchModalOpen(true);
  };

  const handleSearchModalClose = () => {
    setIsSearchModalOpen(false);
  };

  const handleUserSelect = (user: {
    _id: string;
    username: string;
    email: string;
  }) => {
    console.log("Selected user:", user);
    const mappedUser: User = {
      id: user._id,
      username: user.username,
      _id: user._id,
    };
    onUserSelect?.(mappedUser);
  };

  const handleHashtagSelect = (hashtag: string) => {
    console.log("Selected hashtag:", hashtag);
    onHashtagSelect?.(hashtag);
  };

  // Fetch suggested users
  const fetchSuggestedUsers = async () => {
    try {
      setUsersLoading(true);

      const response = await fetch("/api/users/suggested?limit=3"); // Limit to 3 for "Who to follow"

      if (response.ok) {
        const data = await response.json();
        setSuggestedUsers(data.users || []);

        // Initialize following states (these are suggested users, so not following yet)
        const states: { [key: string]: boolean } = {};
        (data.users || []).forEach((user: SuggestedUser) => {
          states[user._id] = false;
        });
        setFollowingStates(states);
      } else if (response.status === 401) {
        // User not authenticated - this is expected, just don't show suggestions
        setSuggestedUsers([]);
      } else {
        const errorData = await response.json();
        console.error(
          "Failed to fetch suggested users:",
          response.status,
          errorData
        );
        setSuggestedUsers([]);
      }
    } catch (error) {
      console.error("Error fetching suggested users:", error);
      setSuggestedUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  // Refresh suggested users (for manual refresh)
  const refreshSuggestions = () => {
    fetchSuggestedUsers();
  };

  // Handle follow/unfollow action
  const handleFollowToggle = async (
    userId: string,
    event?: React.MouseEvent
  ) => {
    console.log("Follow button clicked for user:", userId);

    // Prevent any default behavior and event bubbling
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Prevent multiple clicks while processing
    if (processingUsers[userId]) {
      console.log("Already processing for user:", userId);
      return;
    }

    try {
      // Set processing state
      setProcessingUsers((prev) => ({ ...prev, [userId]: true }));

      const isCurrentlyFollowing = followingStates[userId];
      console.log("Current following state:", isCurrentlyFollowing);

      const endpoint = isCurrentlyFollowing ? "/api/unfollow" : "/api/follow";
      const method = isCurrentlyFollowing ? "DELETE" : "POST";

      console.log("Making API call to:", endpoint, "with method:", method);

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: userId }),
      });

      console.log("API response status:", response.status);

      if (response.ok) {
        console.log(
          "Follow/unfollow successful, triggering full page refresh..."
        );

        // Trigger full page refresh
        window.location.reload();

        console.log("Page refresh triggered");
      } else {
        const errorData = await response.json();
        console.error("❌ Follow/unfollow failed:", errorData.error);
      }
    } catch (error) {
      console.error("💥 Error in handleFollowToggle:", error);
    } finally {
      // Clear processing state
      setProcessingUsers((prev) => ({ ...prev, [userId]: false }));
      console.log("handleFollowToggle completed");
    }
  };

  // Fetch news with comprehensive error handling
  const fetchNews = async () => {
    setLoading(true);

    try {
      console.log(
        "Attempting to fetch latest real news data via server API..."
      );

      // Use our server-side API instead of direct NewsAPI calls
      const response = await fetch("/api/news?type=general", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const articles = await response.json();

        if (Array.isArray(articles) && articles.length > 0) {
          console.log(
            `Successfully fetched ${articles.length} real news articles from server API`
          );

          // Filter and process articles for freshness
          const freshArticles = articles.filter((article: NewsArticle) => {
            if (!article.publishedAt) return false;

            const publishedDate = new Date(article.publishedAt);
            const hoursOld =
              (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60);

            // Only include articles less than 72 hours old
            return hoursOld <= 72 && article.title && article.title.length > 10;
          });

          if (freshArticles.length > 0) {
            const newsItems = freshArticles
              .slice(0, 4)
              .map((article: NewsArticle) => {
                // Calculate time ago for display
                const publishedDate = new Date(article.publishedAt!);
                const timeDiff = Date.now() - publishedDate.getTime();
                const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
                const minutesAgo = Math.floor(timeDiff / (1000 * 60));

                let timeAgoText = "";
                if (minutesAgo < 60) {
                  timeAgoText = `${minutesAgo}m ago`;
                } else if (hoursAgo < 24) {
                  timeAgoText = `${hoursAgo}h ago`;
                } else {
                  const daysAgo = Math.floor(hoursAgo / 24);
                  timeAgoText = `${daysAgo}d ago`;
                }

                return {
                  title: article.title || "Breaking News Update",
                  url: article.url || "#",
                  description: article.description || "",
                  publishedAt: article.publishedAt,
                  timeAgo: timeAgoText,
                };
              });

            setNews(newsItems);
            setNewsDataIsReal(true);
            console.log(
              "Fresh real-time news data loaded successfully via server"
            );
            return; // Success, exit early
          }
        }
      } else {
        console.warn(`Server API responded with status: ${response.status}`);
      }

      // If server API fails, try RSS feeds or other sources
      console.log("Trying alternative news sources...");

      // Try fetching from a public RSS to JSON service
      const rssResponse = await fetch(
        "https://api.rss2json.com/v1/api.json?rss_url=https://feeds.reuters.com/reuters/technologyNews&api_key=YOUR_API_KEY&count=4"
      );

      if (rssResponse.ok) {
        const rssData = await rssResponse.json();
        if (rssData.items && rssData.items.length > 0) {
          const rssItems = rssData.items.slice(0, 4).map((item: any) => ({
            title: item.title || "News Update",
            url: item.link || "#",
            description: item.description?.replace(/<[^>]*>/g, "") || "",
            publishedAt: item.pubDate || new Date().toISOString(),
            timeAgo: "Recently",
          }));

          setNews(rssItems);
          setNewsDataIsReal(true);
          console.log("News loaded from RSS feed");
          return;
        }
      }

      throw new Error("All news sources failed");
    } catch (error) {
      console.error("❌ All news sources failed:", error);

      // Show error message with helpful info
      setNews([
        {
          title: "Real-time News Unavailable",
          url: "https://news.google.com/",
          description:
            "News services are temporarily unavailable. This could be due to network issues or API rate limits. Click to visit Google News.",
          publishedAt: new Date().toISOString(),
          timeAgo: "Now",
        },
        {
          title: "Trying to Connect...",
          url: "https://www.reuters.com/",
          description:
            "Attempting to fetch live news from multiple sources. Please wait or try refreshing.",
          publishedAt: new Date().toISOString(),
          timeAgo: "Now",
        },
      ]);
      setNewsDataIsReal(false);
    } finally {
      setLoading(false);
    }
  };

  // Fetch cybersecurity alerts and data breach information
  const fetchCyberAlerts = async () => {
    setCyberLoading(true);

    try {
      console.log(
        "Attempting to fetch real cybersecurity data via server API..."
      );

      // Use our server-side API for cybersecurity news
      const response = await fetch("/api/news?type=cyber", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const articles = await response.json();

        if (Array.isArray(articles) && articles.length > 0) {
          console.log(
            `Successfully fetched ${articles.length} real cybersecurity articles from server API`
          );

          // Filter articles for cybersecurity relevance
          const relevantArticles = articles.filter((article: NewsArticle) => {
            const content = (
              article.title +
              " " +
              article.description
            ).toLowerCase();
            return (
              content.includes("security") ||
              content.includes("cyber") ||
              content.includes("hack") ||
              content.includes("breach") ||
              content.includes("vulnerability") ||
              content.includes("malware") ||
              content.includes("ransomware") ||
              content.includes("phishing")
            );
          });

          if (relevantArticles.length > 0) {
            const cyberData = relevantArticles
              .slice(0, 4)
              .map((article: NewsArticle) => {
                // Determine severity based on keywords in title/description
                let severity = "Medium";
                const content = (
                  article.title +
                  " " +
                  article.description
                ).toLowerCase();

                if (
                  content.includes("critical") ||
                  content.includes("zero-day") ||
                  content.includes("data breach") ||
                  content.includes("major breach") ||
                  content.includes("massive hack")
                ) {
                  severity = "Critical";
                } else if (
                  content.includes("high") ||
                  content.includes("ransomware") ||
                  content.includes("cyber attack") ||
                  content.includes("exploit") ||
                  content.includes("compromised")
                ) {
                  severity = "High";
                } else if (
                  content.includes("vulnerability") ||
                  content.includes("malware") ||
                  content.includes("patch") ||
                  content.includes("warning")
                ) {
                  severity = "Medium";
                } else {
                  severity = "Low";
                }

                // Format date to be more recent-looking
                const publishedDate = article.publishedAt
                  ? new Date(article.publishedAt)
                  : new Date();
                const timeDiff = Date.now() - publishedDate.getTime();
                const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
                const daysAgo = Math.floor(hoursAgo / 24);

                let timeAgoText = "";
                if (hoursAgo < 1) {
                  timeAgoText = "Just now";
                } else if (hoursAgo < 24) {
                  timeAgoText = `${hoursAgo}h ago`;
                } else if (daysAgo < 7) {
                  timeAgoText = `${daysAgo}d ago`;
                } else {
                  timeAgoText = publishedDate.toLocaleDateString();
                }

                return {
                  title: article.title || "Security Alert",
                  description:
                    article.description || "Security-related incident reported",
                  severity: severity,
                  date: timeAgoText,
                  url: article.url || "#",
                };
              });

            setCyberAlerts(cyberData);
            setCyberDataIsReal(true);
            console.log(
              "Real cybersecurity data loaded successfully via server"
            );
            return; // Success, exit early
          }
        }
      } else {
        console.warn(`Server API responded with status: ${response.status}`);
      }

      // If server API fails, try some free security RSS feeds
      console.log("Trying alternative cybersecurity sources...");

      // Try US-CERT alerts (free feed)
      const certResponse = await fetch(
        "https://api.rss2json.com/v1/api.json?rss_url=https://www.us-cert.gov/ncas/alerts.xml&count=4"
      );

      if (certResponse.ok) {
        const certData = await certResponse.json();
        if (certData.items && certData.items.length > 0) {
          const certItems = certData.items.slice(0, 4).map((item: any) => ({
            title: item.title || "Security Alert",
            description:
              (
                item.description?.replace(/<[^>]*>/g, "") ||
                "US-CERT security alert"
              ).substring(0, 100) + "...",
            severity: "High",
            date: "Recently",
            url: item.link || "https://www.cisa.gov/alerts",
          }));

          setCyberAlerts(certItems);
          setCyberDataIsReal(true);
          console.log("Cybersecurity data loaded from US-CERT RSS");
          return;
        }
      }

      throw new Error("All cybersecurity sources failed");
    } catch (error) {
      console.error("❌ All cybersecurity sources failed:", error);

      // Show error message with helpful info
      setCyberAlerts([
        {
          title: "Real-time Data Unavailable",
          description:
            "Cybersecurity feeds are temporarily unavailable. This could be due to network issues or API rate limits. Click to visit CISA for latest alerts.",
          severity: "Info",
          date: "Now",
          url: "https://www.cisa.gov/alerts",
        },
      ]);
      setCyberDataIsReal(false);
    } finally {
      setCyberLoading(false);
    }
  };

  useEffect(() => {
    console.log("RightBar component loading - fetching real-time data...");

    // Add some immediate sample data while APIs load
    setNews([
      {
        title: "Loading Latest News...",
        url: "#",
        description: "Fetching real-time news from multiple sources...",
        publishedAt: new Date().toISOString(),
        timeAgo: "Loading...",
      },
    ]);

    setCyberAlerts([
      {
        title: "Loading Security Alerts...",
        description: "Fetching real-time cybersecurity data...",
        severity: "Info",
        date: "Loading...",
        url: "#",
      },
    ]);

    fetchNews();
    fetchCyberAlerts();

    // Refresh news every 15 minutes for more real-time updates
    const newsInterval = setInterval(fetchNews, 15 * 60 * 1000);
    // Refresh cyber alerts every 30 minutes for fresh security data
    const cyberInterval = setInterval(fetchCyberAlerts, 30 * 60 * 1000);

    return () => {
      clearInterval(newsInterval);
      clearInterval(cyberInterval);
    };
  }, []);

  // Fetch cryptocurrency data with comprehensive error handling
  const fetchCrypto = async () => {
    setCryptoLoading(true);

    // Helper function for safe fetch with timeout
    const safeFetch = async (url: string, timeoutMs: number = 10000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
            "User-Agent": "BlurText/1.0",
          },
          signal: controller.signal,
          mode: "cors",
        });
        clearTimeout(timeoutId);
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    };

    try {
      // Try CoinGecko API with timeout
      console.log("Attempting to fetch from CoinGecko API...");
      const response = await safeFetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=5&page=1&sparkline=false"
      );

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          console.log("Successfully fetched crypto data from CoinGecko");
          setCrypto(data);
          return; // Success, exit early
        }
      }

      throw new Error(`CoinGecko API failed with status: ${response.status}`);
    } catch (error) {
      console.warn("CoinGecko API failed, trying alternative methods:", error);

      try {
        // Try alternative API with timeout
        console.log("Attempting to fetch from alternative API...");
        const response = await safeFetch(
          "https://api.coinlore.net/api/tickers/?start=0&limit=5"
        );

        if (response.ok) {
          const fallbackData = await response.json();
          if (fallbackData.data && Array.isArray(fallbackData.data)) {
            const transformedData = fallbackData.data
              .slice(0, 5)
              .map((coin: CoinData) => ({
                id: coin.id || coin.symbol || "unknown",
                name: coin.name || "Unknown",
                current_price: parseFloat(coin.price_usd || "0") || 0,
                price_change_percentage_24h:
                  parseFloat(coin.percent_change_24h || "0") || 0,
              }));

            console.log(
              "Successfully fetched crypto data from alternative API"
            );
            setCrypto(transformedData);
            return; // Success, exit early
          }
        }

        throw new Error("Alternative API also failed");
      } catch (alternativeError) {
        console.warn("Alternative API also failed:", alternativeError);

        // Final fallback to static data
        console.log("Using static fallback crypto data");
        setCrypto([
          {
            id: "bitcoin",
            name: "Bitcoin",
            current_price: 45000,
            price_change_percentage_24h: 2.5,
          },
          {
            id: "ethereum",
            name: "Ethereum",
            current_price: 3000,
            price_change_percentage_24h: 1.8,
          },
          {
            id: "cardano",
            name: "Cardano",
            current_price: 0.45,
            price_change_percentage_24h: -1.2,
          },
        ]);
      }
    } finally {
      setCryptoLoading(false);
    }
  };

  useEffect(() => {
    fetchCrypto();

    // Set up interval to refresh crypto data every 5 minutes
    const interval = setInterval(fetchCrypto, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch suggested users on component mount
  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  // Function to handle search box click

  return (
    <div className="w-full h-full bg-white dark:bg-[#262335] text-black dark:text-white transition-colors duration-300 p-4">
      <div className="relative">
        <input
          type="text"
          placeholder={searchPlaceholder}
          readOnly
          className="bg-gray-100 dark:bg-[#262335] border border-gray-300 dark:border-[#3b3b3b] text-black dark:text-white rounded-full py-2 px-10 w-full mt-4 pl-3 focus:border-blue-500 focus:outline-none transition-colors duration-300 cursor-pointer"
          onClick={handleSearchClick}
        />
        <div className="absolute top-9 right-3 transform -translate-y-1/2 w-5 h-5 pointer-events-none">
          <Icon name="search.svg" width={20} height={20} />
        </div>
      </div>
      {/* Cybersecurity Alerts section */}
      <div className="mt-4 border border-gray-300 dark:border-zinc-600 rounded-3xl p-4 bg-gray-50 dark:bg-[#262335] mb-4 transition-colors duration-300">
        <div className="flex justify-between items-center mb-3">
          <div className="font-bold text-[19px] mb-1 flex items-center">
            <TranslatedText>Cybersecurity Alerts</TranslatedText>
            {cyberDataIsReal && (
              <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                LIVE
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              fetchCyberAlerts().catch(console.warn);
            }}
            className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
            disabled={cyberLoading}
          >
            {cyberLoading ? (
              <TranslatedText>Loading...</TranslatedText>
            ) : (
              <TranslatedText>Refresh</TranslatedText>
            )}
          </button>
        </div>

        {cyberLoading ? (
          <div className="text-center py-4 text-gray-500">
            <div className="animate-pulse">
              <TranslatedText>Loading security alerts...</TranslatedText>
            </div>
          </div>
        ) : Array.isArray(cyberAlerts) && cyberAlerts.length > 0 ? (
          <div className="space-y-3">
            {cyberAlerts.slice(0, 3).map((alert, index) => (
              <div
                key={index}
                className="border-l-4 border-red-400 pl-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-r-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                {alert.url ? (
                  <a
                    href={alert.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm text-red-700 dark:text-red-300 hover:underline">
                        {alert.title}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          alert.severity === "Critical"
                            ? "bg-red-500 text-white"
                            : alert.severity === "High"
                            ? "bg-orange-500 text-white"
                            : alert.severity === "Medium"
                            ? "bg-yellow-500 text-black"
                            : "bg-blue-500 text-white"
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                      {alert.description}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {alert.date}
                    </span>
                  </a>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm text-red-700 dark:text-red-300">
                        {alert.title}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          alert.severity === "Critical"
                            ? "bg-red-500 text-white"
                            : alert.severity === "High"
                            ? "bg-orange-500 text-white"
                            : alert.severity === "Medium"
                            ? "bg-yellow-500 text-black"
                            : "bg-blue-500 text-white"
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                      {alert.description}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {alert.date}
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <TranslatedText>No alerts available</TranslatedText>
          </div>
        )}

        <div className="mt-3 text-center">
          <div className="flex justify-center space-x-4 text-xs">
            <a
              href="https://cve.mitre.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              <TranslatedText>CVE Database</TranslatedText>
            </a>
            <a
              href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              <TranslatedText>CISA Alerts</TranslatedText>
            </a>
            <a
              href="https://krebsonsecurity.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              <TranslatedText>Security News</TranslatedText>
            </a>
          </div>
        </div>
      </div>

      {/* Cryptocurrency section */}
      <div className="mt-1 mb-2 border border-gray-300 dark:border-zinc-600 rounded-3xl p-4 bg-gray-50 dark:bg-[#262335] transition-colors duration-300">
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold">
            <TranslatedText>Trending Crypto</TranslatedText>
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              fetchCrypto().catch(console.warn);
            }}
            className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
            disabled={cryptoLoading}
          >
            {cryptoLoading ? (
              <TranslatedText>Loading...</TranslatedText>
            ) : (
              <TranslatedText>Refresh</TranslatedText>
            )}
          </button>
        </div>
        {cryptoLoading ? (
          <div className="text-center py-4 text-gray-500">
            <div className="animate-pulse">
              <TranslatedText>Loading crypto data...</TranslatedText>
            </div>
          </div>
        ) : Array.isArray(crypto) && crypto.length > 0 ? (
          <ul className="space-y-2">
            {crypto.slice(0, 3).map((coin, index) => (
              <li
                key={coin.id || index}
                className="flex justify-between items-center"
              >
                <div>
                  <span className="font-medium text-sm">
                    {coin.name || "Unknown"}
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    ${(coin.current_price || 0).toFixed(2)}
                  </div>
                </div>
                <div
                  className={`text-sm font-medium ${
                    (coin.price_change_percentage_24h || 0) >= 0
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {(coin.price_change_percentage_24h || 0) >= 0 ? "+" : ""}
                  {(coin.price_change_percentage_24h || 0).toFixed(2)}%
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <TranslatedText>No crypto data available</TranslatedText>
            <div className="mt-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  fetchCrypto().catch(console.warn);
                }}
                className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
              >
                <TranslatedText>Try again</TranslatedText>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* News section */}
      <div className="mt-17 border border-gray-300 dark:border-zinc-600 rounded-3xl p-4 bg-gray-50 dark:bg-[#262335] transition-colors duration-300">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <span className="font-bold">
              <TranslatedText>Latest News</TranslatedText>
            </span>
            {newsDataIsReal && (
              <span className="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
                LIVE
              </span>
            )}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              fetchNews().catch(console.warn);
            }}
            className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
            disabled={loading}
          >
            {loading ? (
              <TranslatedText>Loading...</TranslatedText>
            ) : (
              <TranslatedText>Refresh</TranslatedText>
            )}
          </button>
        </div>
        {loading ? (
          <div className="text-center py-4 text-gray-500">
            <div className="animate-pulse">
              <TranslatedText>Loading latest news...</TranslatedText>
            </div>
          </div>
        ) : Array.isArray(news) && news.length > 0 ? (
          <div className="space-y-3">
            {news.slice(0, 4).map((article, index) => (
              <div
                key={index}
                className="border-b border-gray-200 dark:border-gray-600 pb-3 last:border-b-0"
              >
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg transition-colors"
                >
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white hover:underline line-clamp-2">
                    {article.title}
                  </h4>
                  {article.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {article.description}
                    </p>
                  )}
                  <div className="flex justify-between items-center mt-1">
                    {article.publishedAt && (
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </span>
                    )}
                    {article.timeAgo && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        {article.timeAgo}
                      </span>
                    )}
                  </div>
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <TranslatedText>No news available</TranslatedText>
            <div className="mt-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  fetchNews().catch(console.warn);
                }}
                className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
              >
                <TranslatedText>Try again</TranslatedText>
              </button>
            </div>
          </div>
        )}
        <div className="mt-4 text-center">
          <a
            href="https://news.google.com/home?hl=en-US&gl=US&ceid=US:en"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            <TranslatedText>See more news</TranslatedText>
          </a>
        </div>
      </div>

      <div className="mt-4 border border-gray-300 dark:border-zinc-600 rounded-3xl p-4 bg-gray-50 dark:bg-[#262335] transition-colors duration-300">
        <div className="flex justify-between items-center mb-4">
          <div className="flex font-bold">
            <span>
              <TranslatedText>Who to follow</TranslatedText>
            </span>
          </div>
          <button
            onClick={refreshSuggestions}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium transition-colors"
          >
            <TranslatedText>Refresh</TranslatedText>
          </button>
        </div>

        {usersLoading ? (
          <div className="text-center py-4">
            <TranslatedText>Loading...</TranslatedText>
          </div>
        ) : suggestedUsers.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            <TranslatedText>No users found</TranslatedText>
          </div>
        ) : (
          suggestedUsers.map((user) => (
            <div key={user._id} className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <img
                  src={generateConsistentAvatar(user.username)}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="ml-3 flex flex-col">
                <span className="font-medium text-gray-900 dark:text-white">
                  @{user.username}
                </span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleFollowToggle(user._id, e)}
                  disabled={processingUsers[user._id]}
                  className={`rounded-full px-4 py-1 text-sm font-bold transition-colors duration-200 ${
                    processingUsers[user._id]
                      ? "bg-gray-400 cursor-not-allowed text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  {processingUsers[user._id] ? (
                    <span className="flex items-center gap-1">
                      <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <TranslatedText>Following...</TranslatedText>
                    </span>
                  ) : (
                    <TranslatedText>Follow</TranslatedText>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer section */}
      <div>
        <div className="text-gray-500 dark:text-neutral-400 text-sm mt-4 flex flex-wrap justify-center gap-2">
          |
          <a
            href="/privacy"
            className="hover:underline"
            onClick={handlePrivacyClick}
          >
            <TranslatedText>Privacy Policy</TranslatedText>
          </a>
          |
          <a href="/more" className="hover:underline">
            <TranslatedText>More</TranslatedText>
          </a>
          <TranslatedText>© 2025 UKI.</TranslatedText>
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={handleSearchModalClose}
        onUserSelect={handleUserSelect}
        onHashtagSelect={handleHashtagSelect}
      />
    </div>
  );
};

export default RightBar;
