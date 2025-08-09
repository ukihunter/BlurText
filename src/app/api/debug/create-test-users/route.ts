import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import UserFollows from "@/models/UserFollows";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    console.log("🧪 Creating test users...");

    const testUsers = [
      { username: "alice", password: "123" },
      { username: "bob", password: "123" },
      { username: "charlie", password: "123" },
      { username: "diana", password: "123" },
      { username: "eve", password: "123" }
    ];

    const createdUsers = [];

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await User.findOne({ username: userData.username });
      if (existingUser) {
        console.log(`⚠️ User ${userData.username} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcryptjs.hash(userData.password, 10);

      // Create user
      const newUser = new User({
        username: userData.username,
        password: hashedPassword,
        isAnonymous: true,
        createdAt: new Date(),
      });

      await newUser.save();
      console.log(`✅ Created user: ${userData.username}`);

      // Create UserFollows record
      const userFollows = new UserFollows({
        username: userData.username,
        followedUsers: [],
        followers: [],
      });

      await userFollows.save();
      console.log(`✅ Created follow record for: ${userData.username}`);

      createdUsers.push({
        id: newUser._id,
        username: newUser.username,
        createdAt: newUser.createdAt,
      });
    }

    return NextResponse.json(
      {
        message: `Successfully created ${createdUsers.length} test users`,
        users: createdUsers,
        credentials: {
          password: "123",
          note: "All users have password '123'"
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create test users error:", error);
    return NextResponse.json(
      { 
        error: "Failed to create test users", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
