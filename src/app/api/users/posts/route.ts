import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Post from "@/models/Post";
import jwt from "jsonwebtoken";

// GET - Fetch user's own posts
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        username: string;
      };
    } catch (error) {
      console.error("JWT verification failed:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // If no userId provided, use the current user's ID
    const targetUserId = userId || decoded.userId;

    const posts = await Post.find({ userId: targetUserId })
      .sort({ createdAt: -1 })
      .lean();

    // Add interaction status for each post
    const postsWithInteractions = posts.map((post) => ({
      ...post,
      _id: post._id.toString(),
      isLikedByUser: post.likedBy?.includes(decoded.userId) || false,
      // Note: We'll need to add bookmarked status via a separate query if needed
      isBookmarkedByUser: false, // TODO: Implement bookmark check
    }));

    return NextResponse.json({ posts: postsWithInteractions });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
