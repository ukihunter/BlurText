import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import Chat from "@/models/Chat";
import Message from "@/models/Message";

export async function DELETE(request: NextRequest) {
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

    // Find the chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Verify user is participant in this chat
    if (!chat.participants.includes(decoded.username)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Soft delete the chat for current user (add user to deletedFor array)
    await Chat.findByIdAndUpdate(
      chatId,
      { $addToSet: { deletedFor: decoded.username } }
    );

    // Soft delete all messages in the chat for current user
    await Message.updateMany(
      { chatId },
      { $addToSet: { deletedFor: decoded.username } }
    );

    // Check if both users have deleted the chat
    const updatedChat = await Chat.findById(chatId);
    if (updatedChat && updatedChat.deletedFor && updatedChat.deletedFor.length === updatedChat.participants.length) {
      // If all participants have deleted the chat, permanently delete it and all messages
      await Message.deleteMany({ chatId });
      await Chat.findByIdAndDelete(chatId);
    }

    return NextResponse.json({ 
      success: true,
      message: "Chat deleted successfully"
    });

  } catch (error) {
    console.error("Delete chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
