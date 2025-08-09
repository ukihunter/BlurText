import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import Chat from "@/models/Chat";
import Message from "@/models/Message";

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

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    if (!chatId) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    // Verify user is participant in this chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(decoded.username)) {
      return NextResponse.json({ error: "Chat not found or access denied" }, { status: 404 });
    }

    // Get messages for this chat (exclude messages deleted by current user)
    console.log("Fetching messages for user:", decoded.username, "chatId:", chatId);
    
    const messages = await Message.find({ 
      chatId,
      deletedFor: { $ne: decoded.username }
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
    
    console.log("Found messages count:", messages.length);
    console.log("Messages deletedFor field check:", messages.map(msg => ({
      id: msg._id,
      content: msg.content.substring(0, 20),
      deletedFor: msg.deletedFor || 'empty array'
    })));

    // Reverse to get chronological order (oldest first)
    const sortedMessages = messages.reverse();

    // Mark messages from other users as read (excluding messages deleted by current user)
    await Message.updateMany(
      {
        chatId,
        sender: { $ne: decoded.username },
        isRead: false,
        $or: [
          { deletedFor: { $exists: false } },
          { deletedFor: { $ne: decoded.username } }
        ]
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    const formattedMessages = sortedMessages.map(message => ({
      id: message._id.toString(),
      content: message.content,
      sender: message.sender,
      messageType: message.messageType,
      status: message.status || 'sent', // Default to 'sent' for backward compatibility
      isRead: message.isRead,
      readAt: message.readAt,
      createdAt: message.createdAt,
      isSent: message.sender === decoded.username
    }));

    return NextResponse.json({
      messages: formattedMessages,
      chatId,
      page,
      hasMore: messages.length === limit
    });

  } catch (error) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const { chatId, content, messageType = 'text' } = await request.json();

    if (!chatId || !content?.trim()) {
      return NextResponse.json({ error: "Chat ID and content are required" }, { status: 400 });
    }

    // Verify user is participant in this chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(decoded.username)) {
      return NextResponse.json({ error: "Chat not found or access denied" }, { status: 404 });
    }

    // Create new message
    const message = new Message({
      chatId,
      sender: decoded.username,
      content: content.trim(),
      messageType,
      status: 'sent', // Message is sent immediately in our simple implementation
    });

    await message.save();

    // When a message is sent, restore the chat for both participants if they had deleted it
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: content.trim(),
      lastMessageTime: new Date(),
      lastMessageSender: decoded.username,
      updatedAt: new Date(),
      $pullAll: { deletedFor: chat.participants } // Remove all participants from deletedFor array
    });

    return NextResponse.json({
      id: message._id.toString(),
      content: message.content,
      sender: message.sender,
      messageType: message.messageType,
      status: message.status,
      createdAt: message.createdAt,
      isSent: true
    });

  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
