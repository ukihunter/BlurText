import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ users: [] });
    }

    // Search users by username (case-insensitive)
    const users = await User.find({
      username: { $regex: query.trim(), $options: "i" },
    })
      .select("username email _id")
      .limit(Math.min(limit, 20)) // Maximum 20 results
      .lean();

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
