import React, { useEffect, useState } from "react";
import Link from "next/link";
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
  onMenuClick?: (content: React.ReactNode, pageName?: string) => void;
  onUserSelect?: (user: User) => void;
  onHashtagSelect?: (hashtag: string) => void;
}) => {
  const { translate } = useTranslation();
  const [searchPlaceholder, setSearchPlaceholder] = useState("search");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Fetch news articles from the API
  const [news, setNews] = useState<{ title: string; url: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Cryptocurrency state
  const [crypto, setCrypto] = useState<CryptoData[]>([]);
  const [cryptoLoading, setCryptoLoading] = useState(true);

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
    console.log("🔄 Follow button clicked for user:", userId);

    // Prevent any default behavior and event bubbling
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Prevent multiple clicks while processing
    if (processingUsers[userId]) {
      console.log("⏳ Already processing for user:", userId);
      return;
    }

    try {
      // Set processing state
      setProcessingUsers((prev) => ({ ...prev, [userId]: true }));

      const isCurrentlyFollowing = followingStates[userId];
      console.log("📊 Current following state:", isCurrentlyFollowing);

      const endpoint = isCurrentlyFollowing ? "/api/unfollow" : "/api/follow";
      const method = isCurrentlyFollowing ? "DELETE" : "POST";

      console.log("🌐 Making API call to:", endpoint, "with method:", method);

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: userId }),
      });

      console.log("✅ API response status:", response.status);

      if (response.ok) {
        console.log(
          "🎉 Follow/unfollow successful, triggering full page refresh..."
        );

        // Trigger full page refresh
        window.location.reload();

        console.log("✅ Page refresh triggered");
      } else {
        const errorData = await response.json();
        console.error("❌ Follow/unfollow failed:", errorData.error);
      }
    } catch (error) {
      console.error("💥 Error in handleFollowToggle:", error);
    } finally {
      // Clear processing state
      setProcessingUsers((prev) => ({ ...prev, [userId]: false }));
      console.log("🏁 handleFollowToggle completed");
    }
  };

  // Fetch news with comprehensive error handling
  const fetchNews = async () => {
    setLoading(true);

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
      console.log("Attempting to fetch news data...");
      const response = await safeFetch(
        "https://newsapi.org/v2/top-headlines?country=us&apiKey=9d72a6cdbdf243bf904090d76ec5f3f2"
      );

      if (response.ok) {
        const data = await response.json();
        if (data.articles && Array.isArray(data.articles)) {
          console.log("Successfully fetched news data");
          setNews(data.articles.slice(0, 5));
          return; // Success, exit early
        }
      }

      throw new Error(`News API failed with status: ${response.status}`);
    } catch (error) {
      console.warn("News API failed, using fallback data:", error);

      // Set fallback news to prevent empty state
      setNews([
        {
          title: "Technology News - Stay Updated",
          url: "https://news.google.com/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB",
        },
        {
          title: "Market Analysis & Trends",
          url: "https://news.google.com/topics/CAAqKggKIiRDQkFTRlFvSUwyMHZNREY2WVdaU0VRb01hMjF2Y21WaEVRSUJBaWdKTkE",
        },
        {
          title: "Latest Tech Developments",
          url: "https://news.google.com/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();

    // Refresh news every 30 minutes
    const interval = setInterval(fetchNews, 30 * 60 * 1000);

    return () => clearInterval(interval);
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
      {/* Search box*/}
      <div className="mt-4 border border-gray-300 dark:border-zinc-600 rounded-3xl p-4 bg-gray-50 dark:bg-[#262335] mb-4 transition-colors duration-300">
        <div className="mt-2 mb-1 ml-3">
          <div className="font-bold text-[19px] mb-1">
            <TranslatedText>Unlock Premium Features</TranslatedText>
          </div>
          <span className="text-gray-700 dark:text-white text-[14px] font-extralight">
            <TranslatedText>
              Get access to advanced anonymous posting, enhanced privacy
              controls, and exclusive tools by upgrading to Premium.
            </TranslatedText>
          </span>

          <Link
            href="/subscribe"
            className="mt-3 flex justify-center flex-direction-row bg-[#1a8cd8] w-40 rounded-full py-2 text-center text-white font-bold"
          >
            <TranslatedText>Upgrade Now</TranslatedText>
          </Link>
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
          <span className="font-bold">
            <TranslatedText>Related NEWS</TranslatedText>
          </span>
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
              <TranslatedText>Loading...</TranslatedText>
            </div>
          </div>
        ) : Array.isArray(news) && news.length > 0 ? (
          <ul className="list-disc gap-2 pl-4">
            {news.slice(0, 3).map((article, index) => (
              <li key={index} className="mb-3">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-neutral-400 hover:underline font-extralight text-[14px] justify-center flex"
                >
                  {article.title}
                </a>
              </li>
            ))}
          </ul>
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
        <div style={{ color: "#1d9bf0" }}>
          <a
            href="https://news.google.com/home?hl=en-US&gl=US&ceid=US:en"
            target="_blank"
            rel="noopener noreferrer"
          >
            <TranslatedText>see more</TranslatedText>
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
