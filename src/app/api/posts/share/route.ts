import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Post from "@/models/Post";
import Notification from "@/models/Notification";
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
        username: string;
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

    // Increment share count
    await Post.findByIdAndUpdate(postId, { $inc: { shares: 1 } });

    // Create notification for post owner (if not sharing own post)
    if (post.userId !== decoded.userId) {
      const notification = new Notification({
        userId: post.userId,
        fromUserId: decoded.userId,
        fromUsername: decoded.username,
        postId: postId,
        type: "share",
        message: `${decoded.username} shared your post`,
        isRead: false,
      });
      await notification.save();
    }

    return NextResponse.json({
      success: true,
      shares: post.shares + 1,
      message: "Post shared successfully",
    });
  } catch (error) {
    console.error("Error sharing post:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
