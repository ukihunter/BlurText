import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import UserFollows from "@/models/UserFollows";
import { authValidation, sanitizeInput } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    // Validate input using Joi schema
    const { error, value } = authValidation.register.validate(body);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }

    const { username, password } = value;

    // Sanitize username
    const sanitizedUsername = sanitizeInput.username(username);

    // Check if user already exists
    const existingUser = await User.findOne({ username: sanitizedUsername });
    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }

    // Hash password with higher salt rounds for security
    const hashedPassword = await bcryptjs.hash(password, 14);

    // Create new user
    const newUser = new User({
      username: sanitizedUsername,
      password: hashedPassword,
      createdAt: new Date(),
      isAnonymous: false,
    });

    await newUser.save();

    // Create UserFollows entry for the new user
    const userFollows = new UserFollows({
      username: sanitizedUsername,
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
    console.error(
      "Registration error:",
      process.env.NODE_ENV === "development" ? error : "Registration failed"
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
