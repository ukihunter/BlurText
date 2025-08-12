import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Comment from "@/models/Comment";
import Post from "@/models/Post";
import Notification from "@/models/Notification";
import jwt from "jsonwebtoken";

// POST - Add a comment
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

    const { postId, content } = await request.json();

    if (!postId || !content?.trim()) {
      return NextResponse.json(
        { error: "Post ID and content are required" },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: "Comment must be 500 characters or less" },
        { status: 400 }
      );
    }

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Create comment
    const comment = new Comment({
      postId,
      userId: decoded.userId,
      username: decoded.username,
      content: content.trim(),
    });

    await comment.save();

    // Update post comment count
    await Post.findByIdAndUpdate(postId, { $inc: { comments: 1 } });

    // Create notification for post owner (if not commenting on own post)
    if (post.userId !== decoded.userId) {
      const notification = new Notification({
        userId: post.userId,
        fromUserId: decoded.userId,
        fromUsername: decoded.username,
        postId: postId,
        type: "comment",
        message: `${decoded.username} commented on your post`,
        isRead: false,
      });
      await notification.save();
    }

    return NextResponse.json({
      success: true,
      comment,
      message: "Comment added successfully",
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Fetch comments for a post
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const comments = await Comment.find({ postId }).sort({ createdAt: -1 });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
