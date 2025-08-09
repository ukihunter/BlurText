import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import UserFollows from "@/models/UserFollows";
import Follow from "@/models/Follow";

export async function DELETE(request: NextRequest) {
  try {
    // Only allow this in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
    }

    await dbConnect();

    // Clear all collections
    console.log("Clearing database collections...");
    
    // Delete all users
    const usersDeleted = await User.deleteMany({});
    console.log(`Deleted ${usersDeleted.deletedCount} users`);

    // Delete all user follows records
    const userFollowsDeleted = await UserFollows.deleteMany({});
    console.log(`Deleted ${userFollowsDeleted.deletedCount} user follows records`);

    // Delete old follow records (if any exist)
    const followsDeleted = await Follow.deleteMany({});
    console.log(`Deleted ${followsDeleted.deletedCount} old follow records`);

    return NextResponse.json(
      {
        message: "Database cleared successfully",
        cleared: {
          users: usersDeleted.deletedCount,
          userFollows: userFollowsDeleted.deletedCount,
          oldFollows: followsDeleted.deletedCount
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Database clear error:", error);
    return NextResponse.json(
      { error: "Failed to clear database" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: "Use DELETE method to clear database",
      warning: "This will delete ALL users and follow data!"
    },
    { status: 200 }
  );
}
