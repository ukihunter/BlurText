import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import UserFollows from "@/models/UserFollows";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    console.log("Debug: Testing unfollowed users logic");

    // Use testuser1 for debugging
    const testUsername = "testuser1";
    console.log("Debug: Using test username:", testUsername);

    // Step 1: Get current user's followed users from UserFollows table
    const userFollows = await UserFollows.findOne({ username: testUsername });
    const followedUsernames = userFollows?.followedUsers || [];
    
    console.log("Debug: Current user follows these usernames:", followedUsernames);

    // Step 2: Get ALL users from users table
    const allUsers = await User.find({})
      .select("_id username createdAt isAnonymous")
      .sort({ createdAt: -1 });

    console.log("Debug: Total users in database:", allUsers.length);

    // Step 3: Filter out current user and followed users manually
    const unfollowedUsers = allUsers.filter(user => {
      // Always exclude current user
      if (user.username === testUsername) {
        console.log("Debug: Filtering out current user:", user.username);
        return false;
      }
      
      // If followedUsernames array is empty, show all other users
      if (followedUsernames.length === 0) {
        console.log("Debug: No followed users - including all other users:", user.username);
        return true;
      }
      
      // If followedUsernames has users, exclude them
      if (followedUsernames.includes(user.username)) {
        console.log("Debug: Filtering out followed user:", user.username);
        return false;
      }
      
      console.log("Debug: Including unfollowed user:", user.username);
      return true;
    });

    console.log(`Debug: After filtering: ${unfollowedUsers.length} unfollowed users found`);

    // Step 4: Format the response
    const formattedUsers = unfollowedUsers.map((user) => ({
      _id: user._id.toString(),
      username: user.username,
      email: user.username + "@anonymous.user",
      isOnline: Math.random() > 0.3, // 70% chance online for demo
      joinedAt: user.createdAt,
    }));

    console.log("Debug: Returning users:", formattedUsers.map(u => u.username));

    return NextResponse.json(
      {
        users: formattedUsers,
        count: formattedUsers.length,
        currentUser: testUsername,
        totalUsersInDB: allUsers.length,
        followedUsersCount: followedUsernames.length,
        followedUsers: followedUsernames,
        debug: {
          allUsers: allUsers.map(u => u.username),
          unfollowedUsers: unfollowedUsers.map(u => u.username)
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Debug unfollowed users error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
