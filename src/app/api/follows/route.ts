import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import Follow from "@/models/Follow";
import { generateConsistentAvatar } from "@/utils/avatarUtils";

interface UserDocument {
  _id: string;
  username: string;
  createdAt: Date;
  isAnonymous: boolean;
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      username: string;
    };

    const url = new URL(request.url);
    const type = url.searchParams.get("type"); // "following" or "followers"
    const userId = url.searchParams.get("userId") || decoded.userId;

    if (!type || !["following", "followers"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type parameter" },
        { status: 400 }
      );
    }

    let query;
    let populateField;

    if (type === "following") {
      // Get users that this user is following
      query = { follower: userId };
      populateField = "following";
    } else {
      // Get users that are following this user
      query = { following: userId };
      populateField = "follower";
    }

    const follows = await Follow.find(query)
      .populate({
        path: populateField,
        select: "username createdAt isAnonymous",
      })
      .sort({ createdAt: -1 });

    const users = follows.map((follow) => {
      const user = follow[populateField] as UserDocument;
      return {
        id: user._id,
        username: user.username,
        displayName: user.username, // Using username as displayName for anonymous users
        avatar: generateConsistentAvatar(user.username),
        followedAt: follow.createdAt,
      };
    });

    return NextResponse.json(
      {
        [type]: users,
        count: users.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get follows error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
