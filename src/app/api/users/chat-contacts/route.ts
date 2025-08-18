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

    console.log("Getting chat contacts for user:", decoded.username);

    // Get current user's follows data
    const userFollows = await UserFollows.findOne({ username: decoded.username });
    
    // Get both followers and following users
    const followerUsernames = userFollows?.followers || [];
    const followingUsernames = userFollows?.followedUsers || [];

    console.log("Followers:", followerUsernames);
    console.log("Following:", followingUsernames);

    // Combine and deduplicate usernames
    const allContactUsernames = [...new Set([...followerUsernames, ...followingUsernames])];

    console.log("All chat contacts:", allContactUsernames);

    if (allContactUsernames.length === 0) {
      return NextResponse.json(
        {
          contacts: [],
          count: 0,
          message: "No chat contacts found"
        },
        { status: 200 }
      );
    }

    // Get user details for all contacts
    const contactUsers = await User.find({
      username: { $in: allContactUsernames }
    })
    .select("_id username createdAt isAnonymous")
    .sort({ createdAt: -1 });

    console.log("Found contact users:", contactUsers.map(u => u.username));

    // Format the response with additional metadata
    const formattedContacts = contactUsers.map((user) => {
      return {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName || user.username,
        avatar: generateConsistentAvatar(user.username),
        isFollower: followerUsernames.includes(user.username),
        isFollowing: followingUsernames.includes(user.username),
        isMutual: followerUsernames.includes(user.username) && followingUsernames.includes(user.username)
      };
    });

    return NextResponse.json(
      {
        contacts: formattedContacts,
        count: formattedContacts.length,
        stats: {
          totalFollowers: followerUsernames.length,
          totalFollowing: followingUsernames.length,
          mutualConnections: formattedContacts.filter(c => c.isMutual).length
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Chat contacts API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
