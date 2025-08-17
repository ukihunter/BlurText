import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import Chat from "@/models/Chat";
import Message from "@/models/Message";
import { contentValidation, sanitizeInput } from "@/lib/security";

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

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100); // Limit max to 100
    const skip = (page - 1) * limit;

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    // Validate and sanitize chatId
    try {
      sanitizeInput.mongodbId(chatId);
    } catch {
      return NextResponse.json({ error: "Invalid chat ID" }, { status: 400 });
    }

    // Verify user is participant in this chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(decoded.username)) {
      return NextResponse.json(
        { error: "Chat not found or access denied" },
        { status: 404 }
      );
    }

    // Get messages that are not deleted for this user
    const messages = await Message.find({
      chatId,
      $or: [
        { deletedFor: { $exists: false } },
        { deletedFor: { $ne: decoded.username } },
      ],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const sortedMessages = messages.reverse();

    // Mark unread messages as read
    await Message.updateMany(
      {
        chatId,
        sender: { $ne: decoded.username },
        isRead: false,
        $or: [
          { deletedFor: { $exists: false } },
          { deletedFor: { $ne: decoded.username } },
        ],
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    const formattedMessages = sortedMessages.map((message) => ({
      id: message._id.toString(),
      content: sanitizeInput.html(message.content), // Sanitize content before sending
      sender: message.sender,
      messageType: message.messageType,
      status: message.status || "sent",
      isRead: message.isRead,
      readAt: message.readAt,
      createdAt: message.createdAt,
      isSent: message.sender === decoded.username,
    }));

    return NextResponse.json({
      messages: formattedMessages,
      chatId,
      page,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error(
      "Get messages error:",
      process.env.NODE_ENV === "development"
        ? error
        : "Failed to fetch messages"
    );
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

    const body = await request.json();

    // Validate input using Joi schema
    const { error, value } = contentValidation.message.validate(body);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }

    const { chatId, content, messageType } = value;

    // Validate and sanitize chatId
    try {
      sanitizeInput.mongodbId(chatId);
    } catch {
      return NextResponse.json({ error: "Invalid chat ID" }, { status: 400 });
    }

    // Sanitize content
    const sanitizedContent = sanitizeInput.text(content);

    // Verify user is participant in this chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(decoded.username)) {
      return NextResponse.json(
        { error: "Chat not found or access denied" },
        { status: 404 }
      );
    }

    // Create new message
    const message = new Message({
      chatId,
      sender: decoded.username,
      content: sanitizedContent,
      messageType,
      status: "sent",
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await message.save();

    // Update chat with last message info
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: sanitizedContent,
      lastMessageTime: message.createdAt,
      lastMessageSender: decoded.username,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: {
        id: message._id.toString(),
        content: sanitizedContent,
        sender: decoded.username,
        messageType,
        status: "sent",
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Send message error:",
      process.env.NODE_ENV === "development" ? error : "Failed to send message"
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
