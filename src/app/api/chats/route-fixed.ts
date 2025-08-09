import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import Chat from "@/models/Chat";
import Message from "@/models/Message";
import User from "@/models/User";

// GET - Fetch all chats for the authenticated user
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

    const username = decoded.username;

    // Find all chats where user is a participant
    const chats = await Chat.find({
      participants: username
    }).sort({ updatedAt: -1 });

    // Format chats with additional user info
    const formattedChats = await Promise.all(
      chats.map(async (chat) => {
        // Find the other participant
        const otherParticipant = chat.participants.find((p: string) => p !== username);
        
        // Get other participant's details
        const otherUser = await User.findOne({ username: otherParticipant });
        
        // Get unread message count for this chat
        const unreadCount = await Message.countDocuments({
          chatId: chat._id.toString(),
          sender: { $ne: username },
          isRead: false
        });

        // Generate consistent avatar based on username hash
        const colors = ['007bff', '28a745', 'dc3545', 'ffc107', '17a2b8', '6610f2', 'e83e8c', '20c997'];
        const colorIndex = (otherParticipant?.charCodeAt(0) ?? 0) % colors.length;
        const bgColor = colors[colorIndex];

        return {
          id: chat._id.toString(),
          participants: chat.participants,
          otherUser: {
            username: otherParticipant,
            displayName: otherParticipant,
            avatar: `https://ui-avatars.com/api/?name=${otherParticipant}&background=${bgColor}&color=fff&size=128`,
            isOnline: Math.random() > 0.5, // Random online status for demo
          },
          lastMessage: chat.lastMessage,
          lastMessageTime: chat.lastMessageTime,
          lastMessageSender: chat.lastMessageSender,
          unreadCount,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt,
        };
      })
    );

    return NextResponse.json({
      chats: formattedChats,
      count: formattedChats.length
    });

  } catch (error) {
    console.error("Get chats error:", error);
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
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      username: string;
    };

    const { otherUsername } = await request.json();
    
    if (!otherUsername) {
      return NextResponse.json({ error: "Other username is required" }, { status: 400 });
    }

    const currentUsername = decoded.username;
    
    if (currentUsername === otherUsername) {
      return NextResponse.json({ error: "Cannot chat with yourself" }, { status: 400 });
    }

    // Check if other user exists
    const otherUser = await User.findOne({ username: otherUsername });
    if (!otherUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create sorted participants array to avoid duplicates
    const participants = [currentUsername, otherUsername].sort();

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: participants, $size: 2 }
    });

    // If chat doesn't exist, create it
    if (!chat) {
      chat = new Chat({
        participants
      });
      await chat.save();
    }

    // Generate consistent avatar based on username hash
    const colors = ['007bff', '28a745', 'dc3545', 'ffc107', '17a2b8', '6610f2', 'e83e8c', '20c997'];
    const colorIndex = otherUsername.charCodeAt(0) % colors.length;
    const bgColor = colors[colorIndex];

    return NextResponse.json({
      chatId: chat._id.toString(),
      participants: chat.participants,
      otherUser: {
        username: otherUsername,
        displayName: otherUsername,
        avatar: `https://ui-avatars.com/api/?name=${otherUsername}&background=${bgColor}&color=fff&size=128`,
        isOnline: Math.random() > 0.5,
      }
    });

  } catch (error) {
    console.error("Create chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
