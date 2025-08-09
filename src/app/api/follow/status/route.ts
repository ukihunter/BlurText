import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import Follow from "@/models/Follow";

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

    const url = new URL(request.url);
    const targetUserId = url.searchParams.get("targetUserId");

    if (!targetUserId) {
      return NextResponse.json({ error: "Target user ID is required" }, { status: 400 });
    }

    // Check if current user is following the target user
    const isFollowing = await Follow.findOne({
      follower: decoded.userId,
      following: targetUserId,
    });

    return NextResponse.json(
      {
        isFollowing: !!isFollowing,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Check follow status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
