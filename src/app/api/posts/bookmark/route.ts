import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Bookmark from "@/models/Bookmark";
import Post from "@/models/Post";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
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
      };
    } catch (error) {
      console.error("JWT verification failed:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { postId } = await request.json();

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const userId = decoded.userId;

    // Check if bookmark already exists
    const existingBookmark = await Bookmark.findOne({ userId, postId });

    if (existingBookmark) {
      // Remove bookmark
      await Bookmark.deleteOne({ userId, postId });
      return NextResponse.json({
        success: true,
        isBookmarked: false,
        message: "Bookmark removed",
      });
    } else {
      // Add bookmark
      const bookmark = new Bookmark({
        userId,
        postId,
      });
      await bookmark.save();

      return NextResponse.json({
        success: true,
        isBookmarked: true,
        message: "Post bookmarked",
      });
    }
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Fetch user's bookmarked posts
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
      };
    } catch (error) {
      console.error("JWT verification failed:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;

    // Get all bookmarks for the user
    const bookmarks = await Bookmark.find({ userId }).sort({ createdAt: -1 });
    
    // Get the actual posts
    const postIds = bookmarks.map(bookmark => bookmark.postId);
    const posts = await Post.find({ _id: { $in: postIds } }).sort({ createdAt: -1 });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
