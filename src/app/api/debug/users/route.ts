import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    console.log("Debug: Getting all users from database");

    // Get ALL users from database
    const allUsers = await User.find({})
      .select("_id username createdAt isAnonymous")
      .sort({ createdAt: -1 });

    console.log("Debug: Total users found:", allUsers.length);
    console.log("Debug: User list:", allUsers.map(u => u.username));

    const formattedUsers = allUsers.map((user) => ({
      _id: user._id.toString(),
      username: user.username,
      email: user.username + "@anonymous.user",
      isOnline: Math.random() > 0.3,
      joinedAt: user.createdAt,
    }));

    return NextResponse.json(
      {
        users: formattedUsers,
        count: formattedUsers.length,
        message: "Debug endpoint - showing all users"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
