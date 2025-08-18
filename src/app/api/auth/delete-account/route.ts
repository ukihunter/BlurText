import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import Bookmark from "@/models/Bookmark";
import Follow from "@/models/Follow";
import Chat from "@/models/Chat";
import Message from "@/models/Message";
import Notification from "@/models/Notification";

export async function DELETE(request: NextRequest) {
  try {
    // Get the token from cookies
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Parse request body to get password
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: "Password is required for account deletion" }, { status: 400 });
    }

    // Verify JWT token
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      console.error("JWT_SECRET not found in environment variables");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { username: string };
    } catch (error) {
      console.error("JWT verification failed:", error);
      return NextResponse.json({ error: "Invalid authentication token" }, { status: 401 });
    }

    const username = decoded.username;
    console.log(`Deleting account for user: ${username}`);

    // Connect to database
    await connectToDatabase();

    // Find the user and verify password
    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify password using bcrypt (assuming passwords are hashed)
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const userId = user._id;
    console.log(`Password verified. Proceeding with deletion for user ID: ${userId}`);

    // Start deletion process - delete all associated data
    console.log("Starting cascading deletion...");

    // 1. Delete all posts by this user
    const deletedPosts = await Post.deleteMany({ userId: userId.toString() });
    console.log(`Deleted ${deletedPosts.deletedCount} posts`);

    // 2. Delete all comments by this user
    const deletedComments = await Comment.deleteMany({ userId: userId.toString() });
    console.log(`Deleted ${deletedComments.deletedCount} comments`);

    // 3. Delete all bookmarks by this user
    const deletedBookmarks = await Bookmark.deleteMany({ userId: userId.toString() });
    console.log(`Deleted ${deletedBookmarks.deletedCount} bookmarks`);

    // 4. Delete all follow relationships involving this user (both following and followers)
    const deletedFollowsAsFollower = await Follow.deleteMany({ followerId: userId.toString() });
    const deletedFollowsAsFollowed = await Follow.deleteMany({ followedId: userId.toString() });
    console.log(`Deleted ${deletedFollowsAsFollower.deletedCount} follows as follower`);
    console.log(`Deleted ${deletedFollowsAsFollowed.deletedCount} follows as followed`);

    // 5. Delete all notifications involving this user (sent or received)
    const deletedNotifications = await Notification.deleteMany({
      $or: [
        { userId: userId.toString() },
        { fromUserId: userId.toString() }
      ]
    });
    console.log(`Deleted ${deletedNotifications.deletedCount} notifications`);

    // 6. Delete all messages sent by this user
    const deletedMessages = await Message.deleteMany({ senderId: userId.toString() });
    console.log(`Deleted ${deletedMessages.deletedCount} messages`);

    // 7. Delete all chats where this user is a participant
    const deletedChats = await Chat.deleteMany({
      participants: { $in: [userId.toString()] }
    });
    console.log(`Deleted ${deletedChats.deletedCount} chats`);

    // 8. Finally, delete the user account
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return NextResponse.json({ error: "Failed to delete user account" }, { status: 500 });
    }
    console.log("User account deleted successfully");

    // Create response to clear the auth cookie
    const response = NextResponse.json({ 
      message: "Account deleted successfully",
      deletionSummary: {
        posts: deletedPosts.deletedCount,
        comments: deletedComments.deletedCount,
        bookmarks: deletedBookmarks.deletedCount,
        followsAsFollower: deletedFollowsAsFollower.deletedCount,
        followsAsFollowed: deletedFollowsAsFollowed.deletedCount,
        notifications: deletedNotifications.deletedCount,
        messages: deletedMessages.deletedCount,
        chats: deletedChats.deletedCount
      }
    });

    // Clear the auth cookie
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Expire immediately
      path: "/",
    });

    return response;

  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Internal server error while deleting account" },
      { status: 500 }
    );
  }
}
