import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import UserFollows from "@/models/UserFollows";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 12);

    // Create new user
    const newUser = new User({
      username,
      password: hashedPassword,
      createdAt: new Date(),
      isAnonymous: false,
    });

    await newUser.save();

    // Create UserFollows entry for the new user
    const userFollows = new UserFollows({
      username: username,
      followedUsers: [], // Start with empty array
    });

    await userFollows.save();

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: newUser._id,
          username: newUser.username,
          createdAt: newUser.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
