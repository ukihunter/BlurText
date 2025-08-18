import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import UserFollows from "@/models/UserFollows";
import User from "@/models/User";
import { generateConsistentAvatar } from "@/utils/avatarUtils";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const token = request.cookies.get("token")?.value;
    console.log("DEBUG: Token received:", token ? "Token exists" : "No token");
    
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        username: string;
      };
      console.log("DEBUG: Token verified for user:", decoded.username);
    } catch (jwtError) {
      console.log("DEBUG: JWT verification failed:", jwtError);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "3");

    console.log("Getting unfollowed users for:", decoded.username, "with limit:", limit);

    // Step 1: Get current user's followed users and followers from UserFollows table
    const userFollows = await UserFollows.findOne({ username: decoded.username });
    const followedUsernames = userFollows?.followedUsers || [];
    const followerUsernames = userFollows?.followers || [];
    
    console.log("Current user follows these usernames:", followedUsernames);
    console.log("Current user has these followers:", followerUsernames);

    // Step 2: Get ALL users from users table
    const allUsers = await User.find({})
      .select("_id username createdAt isAnonymous")
      .sort({ createdAt: -1 });

    console.log("Total users in database:", allUsers.length);

    // Step 3: Filter out current user, followed users, and followers (mutual relationships)
    const unfollowedUsers = allUsers.filter(user => {
      // Always exclude current user
      if (user.username === decoded.username) {
        console.log("Filtering out current user:", user.username);
        return false;
      }
      
      // Exclude users that current user follows
      if (followedUsernames.includes(user.username)) {
        console.log("Filtering out followed user:", user.username);
        return false;
      }
      
      // Exclude users that follow current user (mutual relationship handling)
      if (followerUsernames.includes(user.username)) {
        console.log("Filtering out follower user:", user.username);
        return false;
      }
      
      console.log("Including unfollowed user:", user.username);
      return true;
    });

    console.log(`After filtering: ${unfollowedUsers.length} unfollowed users found`);

    // Step 4: Shuffle the users randomly and then limit results
    const shuffledUsers = unfollowedUsers.sort(() => Math.random() - 0.5);
    const limitedUsers = shuffledUsers.slice(0, limit);
    const userList = shuffledUsers.slice(0, limit).map((user) => ({
      _id: user._id.toString(),
      username: user.username,
      avatar: generateConsistentAvatar(user.username),
      joinedAt: user.createdAt,
    }));

    console.log("Returning users:", userList.map(u => u.username));

    return NextResponse.json(
      {
        users: userList,
        count: userList.length,
        currentUser: decoded.username,
        totalUsersInDB: allUsers.length,
        followedUsersCount: followedUsernames.length,
        followersCount: followerUsernames.length,
        followedUsers: followedUsernames, // For debugging
        followers: followerUsernames, // For debugging
        debug: {
          allUsers: allUsers.map(u => u.username),
          unfollowedUsers: unfollowedUsers.map(u => u.username)
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get unfollowed users error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
