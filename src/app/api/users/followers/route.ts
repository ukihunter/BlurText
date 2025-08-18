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
    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      username: string;
    };

    console.log("Getting followers for user:", decoded.username);

    // Get current user's followers list
    const userFollows = await UserFollows.findOne({ username: decoded.username });
    const followerUsernames = userFollows?.followers || [];

    console.log("Follower usernames:", followerUsernames);

    if (followerUsernames.length === 0) {
      return NextResponse.json(
        {
          followers: [],
          count: 0,
          message: "No followers yet"
        },
        { status: 200 }
      );
    }

    // Get user details for followers
    const followerUsers = await User.find({
      username: { $in: followerUsernames }
    })
    .select("_id username createdAt isAnonymous")
    .sort({ createdAt: -1 });

    console.log("Found follower users:", followerUsers.map(u => u.username));

    // Format the response
    const formattedUsers = followerUsers.map((user) => ({
      id: user._id.toString(),
      username: user.username,
      displayName: user.displayName || user.username,
      avatar: generateConsistentAvatar(user.username),
      joinedAt: user.createdAt,
    }));

    return NextResponse.json(
      {
        followers: formattedUsers,
        count: formattedUsers.length,
        currentUser: decoded.username
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get followers error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
