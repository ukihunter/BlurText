import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Post from "@/models/Post";
import jwt from "jsonwebtoken";

// GET - Fetch posts that the user has liked
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

    // Find all posts that the user has liked
    const likedPosts = await Post.find({
      likedBy: { $in: [decoded.userId] },
    })
      .sort({ createdAt: -1 })
      .lean();

    // Add interaction status for each post
    const postsWithInteractions = likedPosts.map((post) => ({
      ...post,
      _id: post._id.toString(),
      isLikedByUser: true, // By definition, these are all liked by the user
      isBookmarkedByUser: false, // TODO: Implement bookmark check if needed
    }));

    return NextResponse.json({ posts: postsWithInteractions });
  } catch (error) {
    console.error("Error fetching liked posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
