import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import UserPreferences from "@/models/UserPreferences";

// GET - Debug user preferences (DEVELOPMENT ONLY)
export async function GET(request: NextRequest) {
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

    // Get user preferences
    const preferences = await UserPreferences.findOne({
      userId: decoded.userId,
    });

    // Return minimal debug info without exposing sensitive data
    return NextResponse.json(
      {
        found: !!preferences,
        hasInterests: preferences?.interests?.length > 0,
        hasCompletedOnboarding: preferences?.hasCompletedOnboarding || false,
        userId: decoded.userId,
        username: decoded.username,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Debug preferences error:",
      process.env.NODE_ENV === "development" ? error : "Debug failed"
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
