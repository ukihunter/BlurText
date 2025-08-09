import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import UserFollows from "@/models/UserFollows";

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();

    console.log("🗑️ Starting database cleanup...");
    
    // Debug endpoint - no authentication required

    // Clear all users
    const usersDeleteResult = await User.deleteMany({});
    console.log(`✅ Deleted ${usersDeleteResult.deletedCount} users`);

    // Clear all user follows
    const followsDeleteResult = await UserFollows.deleteMany({});
    console.log(`✅ Deleted ${followsDeleteResult.deletedCount} user follows records`);

    const totalDeleted = usersDeleteResult.deletedCount + followsDeleteResult.deletedCount;

    return NextResponse.json(
      {
        message: "Database cleared successfully",
        deleted: {
          users: usersDeleteResult.deletedCount,
          userFollows: followsDeleteResult.deletedCount,
          total: totalDeleted
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database clear error:", error);
    return NextResponse.json(
      { 
        error: "Failed to clear database", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
