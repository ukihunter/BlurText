import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import Message from "@/models/Message";
import Chat from "@/models/Chat";

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

    const { chatId } = await request.json();

    if (!chatId) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    // Verify user is participant in this chat
    const chat = await Chat.findById(chatId);
    if (!chat || !chat.participants.includes(decoded.username)) {
      return NextResponse.json({ error: "Chat not found or access denied" }, { status: 404 });
    }

    // Mark all unread messages from other users as read
    const result = await Message.updateMany(
      {
        chatId,
        sender: { $ne: decoded.username },
        isRead: false
      },
      {
        isRead: true,
        status: 'read',
        readAt: new Date()
      }
    );

    return NextResponse.json({
      success: true,
      updatedCount: result.modifiedCount
    });

  } catch (error) {
    console.error("Mark messages read error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
