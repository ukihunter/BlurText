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

    // Get current user's followed users list
    const userFollows = await UserFollows.findOne({ username: decoded.username });
    const followedUsernames = userFollows?.followedUsers || [];

    if (followedUsernames.length === 0) {
      return NextResponse.json(
        {
          following: [],
          count: 0,
        },
        { status: 200 }
      );
    }

    // Get user details for followed users
    const followedUsers = await User.find({
      username: { $in: followedUsernames }
    })
    .select("_id username createdAt isAnonymous")
    .sort({ createdAt: -1 });

    // Format the response
    const formattedUsers = followedUsers.map((user) => ({
      id: user._id.toString(),
      username: user.username,
      displayName: user.username,
      avatar: generateConsistentAvatar(user.username),
      isOnline: Math.random() > 0.5, // Random online status for demo
      followedAt: user.createdAt,
    }));

    return NextResponse.json(
      {
        following: formattedUsers,
        count: formattedUsers.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get followed users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
