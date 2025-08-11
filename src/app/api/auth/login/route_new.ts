import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { authValidation, sanitizeInput } from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();

    // Validate input using Joi schema
    const { error, value } = authValidation.login.validate(body);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }

    const { username, password } = value;

    // Sanitize username
    const sanitizedUsername = sanitizeInput.username(username);

    // Find user
    const user = await User.findOne({ username: sanitizedUsername });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Create JWT token with shorter expiration
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" } // Reduced from 7 days to 1 hour for security
    );

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user._id,
          username: user.username,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );

    // Set HTTP-only cookie with secure settings
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour in milliseconds
      path: "/",
    });

    return response;
  } catch (error) {
    console.error(
      "Login error:",
      process.env.NODE_ENV === "development" ? error : "Login failed"
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
