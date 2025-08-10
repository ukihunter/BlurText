import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import UserPreferences from "@/models/UserPreferences";
import User from "@/models/User";

// GET - Get user preferences
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
    let preferences = await UserPreferences.findOne({ userId: decoded.userId });

    // If no preferences exist, create default ones
    if (!preferences) {
      preferences = new UserPreferences({
        userId: decoded.userId,
        username: decoded.username,
        hasCompletedOnboarding: false
      });
      await preferences.save();
    }

    return NextResponse.json({
      preferences: {
        id: preferences._id,
        interests: preferences.interests || [],
        hasCompletedOnboarding: preferences.hasCompletedOnboarding || false,
        createdAt: preferences.createdAt,
        updatedAt: preferences.updatedAt
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Get preferences error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Update user preferences
export async function POST(request: NextRequest) {
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

    const requestData = await request.json();
    const {
      interests,
      contentTypes,
      languages,
      postRecommendationAlgorithm,
      showTrendingContent,
      enablePersonalizedRecommendations,
      showOnlineStatus,
      allowDirectMessages,
      showActivityStatus,
      emailNotifications,
      pushNotifications,
      messageNotifications,
      followNotifications,
      preferredTheme,
      language,
      timeFormat,
      completeOnboarding
    } = requestData;

    // Find or create user preferences
    let preferences = await UserPreferences.findOne({ userId: decoded.userId });

    if (!preferences) {
      preferences = new UserPreferences({
        userId: decoded.userId,
        username: decoded.username,
        // Only store minimal essential fields for recommendation algorithm
        interests: [],
        hasCompletedOnboarding: false
      });
    }

    // Only update interests and onboarding status - nothing else
    if (interests !== undefined) preferences.interests = interests;

    // Complete onboarding if requested
    if (completeOnboarding) {
      preferences.hasCompletedOnboarding = true;
      preferences.onboardingCompletedAt = new Date();
    }

    await preferences.save();

    return NextResponse.json({
      message: "Preferences updated successfully",
      preferences: {
        id: preferences._id,
        hasCompletedOnboarding: preferences.hasCompletedOnboarding
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Update preferences error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
