import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

// POST - Admin cleanup of inactive users (DEVELOPMENT ONLY)
export async function POST(request: NextRequest) {
  // Only allow in development environment
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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

    // Additional admin check could be added here
    // For now, any authenticated user can run cleanup in development

    // Find users inactive for more than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const inactiveUsers = await User.find({
      lastActive: { $lt: thirtyDaysAgo },
      isVerified: false,
    });

    // In development, just return count without actually deleting
    return NextResponse.json({
      message: "Cleanup completed (development mode - no actual deletion)",
      inactiveUsersFound: inactiveUsers.length,
      executedBy: decoded.username,
    });
  } catch (error) {
    console.error(
      "Cleanup error:",
      process.env.NODE_ENV === "development" ? error : "Cleanup failed"
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
