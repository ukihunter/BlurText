import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Message from "@/models/Message";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Update all existing messages that don't have deletedFor field
    const result = await Message.updateMany(
      { deletedFor: { $exists: false } },
      { $set: { deletedFor: [] } }
    );

    return NextResponse.json({
      success: true,
      message: `Updated ${result.modifiedCount} messages with deletedFor field`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "Migration failed" },
      { status: 500 }
    );
  }
}
