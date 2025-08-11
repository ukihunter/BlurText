import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Follow from "@/models/Follow";

export async function GET() {
  try {
    await dbConnect();

    // Get all users and their data format
    const users = await User.find({}).select("username createdAt updatedAt isAnonymous").limit(10);
    
    // Get follow relationships
    const follows = await Follow.find({}).limit(10);

    // Check if there are any old users with missing fields
    const usersWithIssues = users.filter(user => 
      !user.createdAt || !user.updatedAt || user.isAnonymous === undefined
    );

    return NextResponse.json({
      totalUsers: users.length,
      users: users.map(user => ({
        username: user.username,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        isAnonymous: user.isAnonymous,
        hasIssues: !user.createdAt || !user.updatedAt || user.isAnonymous === undefined
      })),
      totalFollows: follows.length,
      follows: follows.map(follow => ({
        follower: follow.follower,
        following: follow.following,
        createdAt: follow.createdAt
      })),
      usersWithIssues: usersWithIssues.length,
      summary: {
        oldUsersDetected: usersWithIssues.length > 0,
        followSystemWorking: follows.length > 0
      }
    });

  } catch (error) {
    console.error("Debug users error:", error);
    return NextResponse.json(
      { error: "Failed to debug users", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
