import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Chat from "@/models/Chat";

export async function POST() {
  try {
    await dbConnect();

    // Update all existing chats to have deletedFor field if it doesn't exist
    const result = await Chat.updateMany(
      { deletedFor: { $exists: false } },
      { $set: { deletedFor: [] } }
    );

    console.log(`Chat migration: Updated ${result.modifiedCount} chats with deletedFor field`);

    return NextResponse.json({
      success: true,
      message: `Updated ${result.modifiedCount} chats with deletedFor field`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error("Chat migration error:", error);
    return NextResponse.json(
      { error: "Migration failed" },
      { status: 500 }
    );
  }
}
