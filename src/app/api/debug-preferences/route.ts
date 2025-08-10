import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import UserPreferences from "@/models/UserPreferences";

// GET - Debug user preferences
export async function GET(request: NextRequest) {
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

    // Get user preferences
    const preferences = await UserPreferences.findOne({ userId: decoded.userId });

    return NextResponse.json({
      found: !!preferences,
      preferences: preferences || null,
      userId: decoded.userId,
      username: decoded.username
    }, { status: 200 });

  } catch (error) {
    console.error("Debug preferences error:", error);
    return NextResponse.json({ error: "Internal server error", details: error }, { status: 500 });
  }
}
