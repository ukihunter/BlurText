import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import Chat from "@/models/Chat";
import Message from "@/models/Message";
import User from "@/models/User";
import { generateConsistentAvatar } from "@/utils/avatarUtils";
import { sanitizeInput } from "@/lib/security";

// GET - Fetch all chats for the authenticated user
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

    const username = decoded.username;

    // Get all chats where current user is a participant and hasn't deleted the chat
    const chats = await Chat.find({
      participants: username,
      deletedFor: { $ne: username },
    }).sort({ lastMessageTime: -1 });

    // Format chats with additional user info
    const formattedChats = await Promise.all(
      chats.map(async (chat) => {
        // Find the other participant
        const otherParticipant = chat.participants.find(
          (p: string) => p !== username
        );

        // Get unread message count for this chat (excluding messages deleted by current user)
        const unreadCount = await Message.countDocuments({
          chatId: chat._id.toString(),
          sender: { $ne: username },
          isRead: false,
          deletedFor: { $ne: username },
        });

        // Get the last message that current user hasn't deleted
        const lastMessage = await Message.findOne({
          chatId: chat._id.toString(),
          deletedFor: { $ne: username },
        }).sort({ createdAt: -1 });

        return {
          id: chat._id.toString(),
          participants: chat.participants,
          otherUser: {
            username: otherParticipant,
            displayName: otherParticipant,
            avatar: generateConsistentAvatar(otherParticipant || "user"),
          },
          lastMessage: lastMessage?.content || chat.lastMessage,
          lastMessageTime: lastMessage?.createdAt || chat.lastMessageTime,
          lastMessageSender: lastMessage?.sender || chat.lastMessageSender,
          unreadCount,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
        };
      })
    );

    return NextResponse.json({
      chats: formattedChats,
      count: formattedChats.length,
    });
  } catch (error) {
    console.error(
      "Get chats error:",
      process.env.NODE_ENV === "development" ? error : "Failed to fetch chats"
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new chat or get existing chat
export async function POST(request: NextRequest) {
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

    const { otherUsername } = await request.json();

    if (!otherUsername || typeof otherUsername !== "string") {
      return NextResponse.json(
        { error: "Other username is required" },
        { status: 400 }
      );
    }

    // Sanitize the username input
    const sanitizedOtherUsername = sanitizeInput.username(otherUsername.trim());

    if (!sanitizedOtherUsername) {
      return NextResponse.json(
        { error: "Invalid username format" },
        { status: 400 }
      );
    }

    const currentUsername = decoded.username;

    if (currentUsername === sanitizedOtherUsername) {
      return NextResponse.json(
        { error: "Cannot chat with yourself" },
        { status: 400 }
      );
    }

    // Check if other user exists
    const otherUser = await User.findOne({ username: sanitizedOtherUsername });
    if (!otherUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create sorted participants array to avoid duplicates
    const participants = [currentUsername, sanitizedOtherUsername].sort();

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: participants, $size: 2 },
    });

    // If chat doesn't exist, create it
    if (!chat) {
      chat = new Chat({
        participants,
      });
      await chat.save();
    } else {
      // If chat exists but current user had deleted it, remove them from deletedFor array
      if (chat.deletedFor && chat.deletedFor.includes(currentUsername)) {
        await Chat.findByIdAndUpdate(chat._id, {
          $pull: { deletedFor: currentUsername },
        });

        // Refresh the chat object
        chat = await Chat.findById(chat._id);
      }
    }

    return NextResponse.json({
      chatId: chat._id.toString(),
      participants: chat.participants,
      otherUser: {
        username: sanitizedOtherUsername,
        displayName: sanitizedOtherUsername,
        avatar: generateConsistentAvatar(sanitizedOtherUsername),
      },
    });
  } catch (error) {
    console.error(
      "Create chat error:",
      process.env.NODE_ENV === "development" ? error : "Failed to create chat"
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
