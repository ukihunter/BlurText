import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import UserPreferences from "@/models/UserPreferences";

// GET - Get personalized post recommendations based on user preferences
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      username: string;
    };

    // Get user preferences
    const preferences = await UserPreferences.findOne({ userId: decoded.userId });

    if (!preferences) {
      // Return default recommendations if no preferences found
      return NextResponse.json({
        recommendations: getDefaultRecommendations(),
        algorithm: 'default'
      }, { status: 200 });
    }

    // Generate recommendations based on preferences
    const recommendations = generateRecommendations(preferences);

    return NextResponse.json({
      recommendations,
      algorithm: 'interest-based', // Simple algorithm based on interests only
      userInterests: preferences.interests
    }, { status: 200 });

  } catch (error) {
    console.error("Get recommendations error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to generate recommendations based on user interests only
function generateRecommendations(preferences: any) {
  const { interests } = preferences;

  // Mock post data with categories matching user interests
  const mockPosts = [
    {
      id: 1,
      author: "TechGuru",
      content: "The future of AI is here! Just tried the new GPT model and it's incredible 🤖",
      category: "technology",
      type: "text",
      engagement: 150,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      trending: true
    },
    {
      id: 2,
      author: "NaturePhotographer",
      content: "Captured this amazing sunset from the mountains",
      category: "photography",
      type: "image",
      engagement: 89,
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      trending: false,
      imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4"
    },
    {
      id: 3,
      author: "FitnessCoach",
      content: "5 simple exercises you can do at home to stay fit 💪",
      category: "fitness",
      type: "video",
      engagement: 230,
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      trending: true
    },
    {
      id: 4,
      author: "BookWorm",
      content: "Just finished reading 'The Midnight Library' - highly recommend! 📚",
      category: "books",
      type: "text",
      engagement: 45,
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      trending: false
    },
    {
      id: 5,
      author: "TravelBlogger",
      content: "Hidden gems in Tokyo that tourists never see ✈️",
      category: "travel",
      type: "link",
      engagement: 112,
      timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000), // 10 hours ago
      trending: false,
      linkUrl: "https://example.com/tokyo-hidden-gems"
    },
    {
      id: 6,
      author: "MusicLover",
      content: "What's your favorite genre of music? Let's discuss! 🎵",
      category: "music",
      type: "poll",
      engagement: 67,
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      trending: false,
      pollOptions: ["Rock", "Pop", "Jazz", "Electronic"]
    },
    {
      id: 7,
      author: "ScienceDaily",
      content: "Breakthrough in quantum computing brings us closer to quantum internet 🔬",
      category: "science",
      type: "text",
      engagement: 189,
      timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000), // 14 hours ago
      trending: true
    },
    {
      id: 8,
      author: "ArtCritic",
      content: "The influence of digital art on traditional painting techniques",
      category: "art",
      type: "image",
      engagement: 73,
      timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000), // 16 hours ago
      trending: false,
      imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262"
    },
    {
      id: 9,
      author: "GameReviewer",
      content: "Top 5 indie games you should play this month 🎮",
      category: "gaming",
      type: "video",
      engagement: 156,
      timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000), // 18 hours ago
      trending: false
    },
    {
      id: 10,
      author: "HealthExpert",
      content: "The importance of mental health in our daily lives 🧠",
      category: "health",
      type: "text",
      engagement: 134,
      timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000), // 20 hours ago
      trending: false
    }
  ];

  let filteredPosts = [...mockPosts];

  // Filter posts based on user interests only
  if (interests && interests.length > 0) {
    // Prioritize posts matching user interests
    const interestPosts = filteredPosts.filter(post => 
      interests.includes(post.category)
    );
    
    // If we have posts matching interests, use them first
    if (interestPosts.length > 0) {
      // Sort interest-matching posts by engagement
      interestPosts.sort((a, b) => b.engagement - a.engagement);
      
      // Add some non-interest posts for variety
      const otherPosts = filteredPosts
        .filter(post => !interests.includes(post.category))
        .sort((a, b) => b.engagement - a.engagement)
        .slice(0, 3); // Limit to 3 other posts
      
      filteredPosts = [...interestPosts, ...otherPosts];
    }
  }

  // Simple mixed algorithm: sort by engagement and recency
  filteredPosts.sort((a, b) => {
    const aScore = (a.timestamp.getTime() / 1000000) + (a.engagement * 0.1);
    const bScore = (b.timestamp.getTime() / 1000000) + (b.engagement * 0.1);
    return bScore - aScore;
  });

  return filteredPosts.slice(0, 10); // Return top 10 recommendations
}

// Default recommendations for users without preferences
function getDefaultRecommendations() {
  return [
    {
      id: 1,
      author: "Welcome",
      content: "Welcome to BlurText! Set your preferences to see personalized content.",
      category: "general",
      type: "text",
      engagement: 0,
      timestamp: new Date(),
      trending: false
    }
  ];
}
