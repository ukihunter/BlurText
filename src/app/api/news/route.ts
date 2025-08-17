import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "general";

    console.log(
      `Server API: Fetching ${type} news at ${new Date().toISOString()}`
    );

    if (type === "cyber") {
      // Try HackerNews API for real cybersecurity stories
      try {
        const topStoriesResponse = await fetch(
          "https://hacker-news.firebaseio.com/v0/topstories.json"
        );

        if (topStoriesResponse.ok) {
          const storyIds = await topStoriesResponse.json();
          const cyberStoryIds = storyIds.slice(0, 10); // Get first 10 to filter for cyber content

          const storyPromises = cyberStoryIds.map((id: number) =>
            fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
              .then((res) => res.json())
              .catch(() => null)
          );

          const stories = await Promise.all(storyPromises);
          const validStories = stories.filter((story) => story && story.title);

          // Filter for cybersecurity related content
          const cyberStories = validStories
            .filter((story) => {
              const title = story.title.toLowerCase();
              return (
                title.includes("security") ||
                title.includes("hack") ||
                title.includes("breach") ||
                title.includes("vulnerability") ||
                title.includes("malware") ||
                title.includes("ransomware") ||
                title.includes("crypto") ||
                title.includes("cyber")
              );
            })
            .slice(0, 4);

          if (cyberStories.length > 0) {
            const cyberData = cyberStories.map((story: any) => ({
              title: story.title,
              description: story.title, // HN doesn't have descriptions, use title
              severity:
                story.score > 200
                  ? "High"
                  : story.score > 100
                  ? "Medium"
                  : "Low",
              date: new Date(story.time * 1000).toLocaleDateString(),
              url:
                story.url || `https://news.ycombinator.com/item?id=${story.id}`,
              publishedAt: new Date(story.time * 1000).toISOString(),
            }));

            console.log(
              `Serving ${cyberData.length} real cybersecurity stories from HackerNews`
            );
            return NextResponse.json(cyberData);
          }
        }
      } catch (error) {
        console.error("HackerNews cybersecurity feed failed:", error);
      }

      // Try Reddit API for cybersecurity content
      try {
        const redditResponse = await fetch(
          "https://www.reddit.com/r/cybersecurity.json?limit=5"
        );

        if (redditResponse.ok) {
          const redditData = await redditResponse.json();
          if (redditData.data && redditData.data.children) {
            const cyberData = redditData.data.children.map((item: any) => ({
              title: item.data.title,
              description:
                item.data.selftext?.substring(0, 150) + "..." ||
                item.data.title,
              severity: item.data.ups > 100 ? "High" : "Medium",
              date: new Date(item.data.created_utc * 1000).toLocaleDateString(),
              url: item.data.url.startsWith("http")
                ? item.data.url
                : `https://reddit.com${item.data.permalink}`,
              publishedAt: new Date(item.data.created_utc * 1000).toISOString(),
            }));

            console.log(
              `Serving ${cyberData.length} real cybersecurity posts from Reddit`
            );
            return NextResponse.json(cyberData);
          }
        }
      } catch (error) {
        console.error("Reddit cybersecurity feed failed:", error);
      }

      // Fallback
      const fallbackCyber = [
        {
          title: "External Cybersecurity APIs Unavailable",
          description:
            "All real-time cybersecurity data sources are currently inaccessible.",
          severity: "Info",
          date: new Date().toLocaleDateString(),
          url: "https://www.cisa.gov/alerts",
          publishedAt: new Date().toISOString(),
        },
      ];

      console.log("Using fallback - all real cybersecurity APIs failed");
      return NextResponse.json(fallbackCyber);
    } else {
      // Try HackerNews for real tech news
      try {
        const topStoriesResponse = await fetch(
          "https://hacker-news.firebaseio.com/v0/topstories.json"
        );

        if (topStoriesResponse.ok) {
          const storyIds = await topStoriesResponse.json();
          const topStoryIds = storyIds.slice(0, 8); // Get top 8 stories

          const storyPromises = topStoryIds.map((id: number) =>
            fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
              .then((res) => res.json())
              .catch(() => null)
          );

          const stories = await Promise.all(storyPromises);
          const validStories = stories
            .filter((story) => story && story.title)
            .slice(0, 4);

          const newsData = validStories.map((story: any) => ({
            title: story.title,
            description: story.title, // HN doesn't have descriptions
            url:
              story.url || `https://news.ycombinator.com/item?id=${story.id}`,
            publishedAt: new Date(story.time * 1000).toISOString(),
            urlToImage: "https://via.placeholder.com/300x200?text=Tech+News",
          }));

          console.log(
            `Serving ${newsData.length} real news stories from HackerNews`
          );
          return NextResponse.json(newsData);
        }
      } catch (error) {
        console.error("HackerNews news feed failed:", error);
      }

      // Try Reddit for general news
      try {
        const redditResponse = await fetch(
          "https://www.reddit.com/r/news.json?limit=4"
        );

        if (redditResponse.ok) {
          const redditData = await redditResponse.json();
          if (redditData.data && redditData.data.children) {
            const newsData = redditData.data.children.map((item: any) => ({
              title: item.data.title,
              description:
                item.data.selftext?.substring(0, 150) + "..." ||
                item.data.title,
              url: item.data.url.startsWith("http")
                ? item.data.url
                : `https://reddit.com${item.data.permalink}`,
              publishedAt: new Date(item.data.created_utc * 1000).toISOString(),
              urlToImage:
                item.data.thumbnail && item.data.thumbnail.startsWith("http")
                  ? item.data.thumbnail
                  : "https://via.placeholder.com/300x200?text=News",
            }));

            console.log(
              `Serving ${newsData.length} real news posts from Reddit`
            );
            return NextResponse.json(newsData);
          }
        }
      } catch (error) {
        console.error("Reddit news feed failed:", error);
      }

      // Fallback
      const fallbackNews = [
        {
          title: "External News APIs Unavailable",
          description:
            "All real-time news data sources are currently inaccessible.",
          url: "https://news.google.com/",
          publishedAt: new Date().toISOString(),
          urlToImage: "https://via.placeholder.com/300x200?text=News",
        },
      ];

      console.log("Using fallback - all real news APIs failed");
      return NextResponse.json(fallbackNews);
    }
  } catch (error) {
    console.error("Server API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch news data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
