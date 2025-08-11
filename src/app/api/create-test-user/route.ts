import { NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function POST() {
  try {
    await dbConnect();

    // Create a simple test user
    const testUsername = "testuser";
    const testPassword = "TestPass123!";

    // Check if user already exists
    const existingUser = await User.findOne({ username: testUsername });
    if (existingUser) {
      return NextResponse.json(
        { message: "Test user already exists", username: testUsername },
        { status: 200 }
      );
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(testPassword, 14);

    // Create user
    const user = new User({
      username: testUsername,
      password: hashedPassword,
      isAnonymous: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await user.save();

    return NextResponse.json({
      message: "Test user created successfully",
      username: testUsername,
      password: testPassword,
      note: "Use these credentials to test login",
    });
  } catch (error) {
    console.error("Create test user error:", error);
    return NextResponse.json(
      {
        error: "Failed to create test user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
