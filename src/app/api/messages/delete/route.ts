import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import Message from "@/models/Message";
import Chat from "@/models/Chat";

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

    const { messageIds, deleteType } = await request.json();

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json({ error: "Message IDs are required" }, { status: 400 });
    }

    // Find the messages
    const messages = await Message.find({ _id: { $in: messageIds } });
    if (messages.length === 0) {
      return NextResponse.json({ error: "Messages not found" }, { status: 404 });
    }

    // Verify user can delete these messages
    for (const message of messages) {
      const chat = await Chat.findById(message.chatId);
      if (!chat || !chat.participants.includes(decoded.username)) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }

      // For delete-for-everyone, verify user is sender
      if (deleteType === 'delete-for-everyone' && message.sender !== decoded.username) {
        return NextResponse.json({ error: "Can only delete own messages for everyone" }, { status: 403 });
      }
    }

    // Handle different delete types
    switch (deleteType) {
      case 'delete-for-me':
        // Soft delete - add current user to deletedFor array
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $addToSet: { deletedFor: decoded.username } }
        );
        break;
        
      case 'delete-for-everyone':
        // Hard delete - permanently remove from database
        await Message.deleteMany({ _id: { $in: messageIds } });
        
        // Update affected chats' last message info
        const chatIds = [...new Set(messages.map(msg => msg.chatId))];
        for (const chatId of chatIds) {
          const latestMessage = await Message.findOne({ chatId })
            .sort({ createdAt: -1 });
            
          if (latestMessage) {
            await Chat.findByIdAndUpdate(chatId, {
              lastMessage: latestMessage.content,
              lastMessageTime: latestMessage.createdAt,
              lastMessageSender: latestMessage.sender,
              updatedAt: new Date()
            });
          } else {
            // No messages left, clear last message info
            await Chat.findByIdAndUpdate(chatId, {
              lastMessage: undefined,
              lastMessageTime: undefined,
              lastMessageSender: undefined,
              updatedAt: new Date()
            });
          }
        }
        break;
        
      default:
        return NextResponse.json({ error: "Invalid delete type" }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      message: `Successfully deleted ${messageIds.length} messages`,
      deleteType,
      deletedCount: messageIds.length
    });

  } catch (error) {
    console.error("Delete messages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
