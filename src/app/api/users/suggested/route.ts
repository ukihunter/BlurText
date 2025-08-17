import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import UserFollows from "@/models/UserFollows";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  console.log("=== SUGGESTED USERS API CALLED ===");
  try {
    await dbConnect();

    const token = request.cookies.get("token")?.value;
    console.log("Token received:", token ? "present" : "missing");
    console.log("JWT_SECRET present:", !!process.env.JWT_SECRET);

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        username: string;
      };
      console.log("Token decoded successfully:", decoded.username);
    } catch (jwtError: unknown) {
      const errorMessage =
        jwtError instanceof Error
          ? jwtError.message
          : "JWT verification failed";
      console.log("JWT verification failed:", errorMessage);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Get users that the current user is already following from UserFollows table
    const userFollows = await UserFollows.findOne({
      username: decoded.username,
    });
    const followedUsernames = userFollows?.followedUsers || [];
    const followerUsernames = userFollows?.followers || [];

    console.log("User follows:", followedUsernames);
    console.log("User followers:", followerUsernames);

    // Get all users from database
    const allUsers = await User.find({})
      .select("_id username createdAt isAnonymous")
      .sort({ createdAt: -1 });

    console.log("Total users in database:", allUsers.length);

    // Filter out current user, followed users, and users who follow the current user
    const unfollowedUsers = allUsers.filter((user) => {
      // Always exclude current user
      if (user.username === decoded.username) {
        console.log("Filtering out current user:", user.username);
        return false;
      }

      // Exclude users that current user is following
      if (followedUsernames.includes(user.username)) {
        console.log("Filtering out followed user:", user.username);
        return false;
      }

      // Exclude users who are following the current user (they shouldn't appear in suggestions)
      if (followerUsernames.includes(user.username)) {
        console.log(
          "Filtering out user who follows current user:",
          user.username
        );
        return false;
      }

      console.log("Including user in suggestions:", user.username);
      return true;
    });

    console.log(
      `After filtering: ${unfollowedUsers.length} unfollowed users found`
    );

    // Randomize the selection to show different users each time
    const shuffledUsers = unfollowedUsers.sort(() => Math.random() - 0.5);

    // Get the limit from query parameters (default to 3 for "Who to follow", 5 for sidebar)
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "3");

    // Map to UI format
    const suggestedUsers = shuffledUsers.slice(0, limit).map((user) => ({
      _id: user._id.toString(), // Use _id to match the interface
      username: user.username,
      email: user.username + "@anonymous.user", // Generate email for anonymous users
      isOnline: Math.random() > 0.3, // 70% chance of being online for demo
      joinedAt: user.createdAt,
    }));

    return NextResponse.json(
      {
        users: suggestedUsers,
        count: suggestedUsers.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get suggested users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
