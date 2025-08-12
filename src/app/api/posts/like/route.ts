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

    const userId = decoded.userId;
    const isLiked = post.likedBy.includes(userId);

    if (isLiked) {
      // Unlike the post
      post.likedBy = post.likedBy.filter((id: string) => id !== userId);
      post.likes = post.likedBy.length;
    } else {
      // Like the post
      post.likedBy.push(userId);
      post.likes = post.likedBy.length;

      // Create notification for post owner (if not liking own post)
      if (post.userId !== userId) {
        const notification = new Notification({
          userId: post.userId,
          fromUserId: userId,
          fromUsername: decoded.username,
          postId: postId,
          type: "like",
          message: `${decoded.username} liked your post`,
          isRead: false,
        });
        await notification.save();
      }
    }

    await post.save();

    return NextResponse.json({
      success: true,
      isLiked: !isLiked,
      likes: post.likes,
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
