import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import UserFollows from "@/models/UserFollows";
import User from "@/models/User";

export async function POST(request: NextRequest) {
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

    const { userId: userIdToFollow } = await request.json();

    if (!userIdToFollow) {
      return NextResponse.json({ error: "User ID to follow is required" }, { status: 400 });
    }

    // Get the username of the user to follow
    const userToFollow = await User.findById(userIdToFollow);
    if (!userToFollow) {
      return NextResponse.json({ error: "User to follow not found" }, { status: 404 });
    }

    const currentUsername = decoded.username;
    const targetUsername = userToFollow.username;

    // Prevent following yourself
    if (currentUsername === targetUsername) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    // Check if already following BEFORE updating
    const existingFollowRecord = await UserFollows.findOne({ username: currentUsername });
    const wasAlreadyFollowing = existingFollowRecord?.followedUsers?.includes(targetUsername) || false;

    // Update or create UserFollows document for current user (add to their followedUsers)
    const followerResult = await UserFollows.findOneAndUpdate(
      { username: currentUsername },
      { 
        $addToSet: { followedUsers: targetUsername } // $addToSet prevents duplicates
      },
      { 
        upsert: true, // Create if doesn't exist
        new: true 
      }
    );

    // Update or create UserFollows document for target user (add to their followers)
    const followeeResult = await UserFollows.findOneAndUpdate(
      { username: targetUsername },
      { 
        $addToSet: { followers: currentUsername } // Add current user to target's followers
      },
      { 
        upsert: true, // Create if doesn't exist
        new: true 
      }
    );

    console.log(`Follow operation: ${currentUsername} -> ${targetUsername}`);
    console.log(`${currentUsername} now follows:`, followerResult.followedUsers);
    console.log(`${targetUsername} followers:`, followeeResult.followers);

    return NextResponse.json(
      { 
        message: wasAlreadyFollowing ? "Already following this user" : "User followed successfully",
        follower: currentUsername,
        following: targetUsername,
        alreadyFollowing: wasAlreadyFollowing
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error("Follow user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
