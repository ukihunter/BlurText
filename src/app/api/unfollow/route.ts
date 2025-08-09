import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";
import UserFollows from "@/models/UserFollows";
import User from "@/models/User";

export async function DELETE(request: NextRequest) {
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

    const { userId: userIdToUnfollow } = await request.json();

    if (!userIdToUnfollow) {
      return NextResponse.json({ error: "User ID to unfollow is required" }, { status: 400 });
    }

    // Get the username of the user to unfollow
    const userToUnfollow = await User.findById(userIdToUnfollow);
    if (!userToUnfollow) {
      return NextResponse.json({ error: "User to unfollow not found" }, { status: 404 });
    }

    const currentUsername = decoded.username;
    const targetUsername = userToUnfollow.username;

    // Remove the target username from current user's followedUsers array
    const followerResult = await UserFollows.findOneAndUpdate(
      { username: currentUsername },
      { 
        $pull: { followedUsers: targetUsername } // Remove from array
      },
      { 
        new: true 
      }
    );

    // Remove current user from target user's followers array
    const followeeResult = await UserFollows.findOneAndUpdate(
      { username: targetUsername },
      { 
        $pull: { followers: currentUsername } // Remove from followers array
      },
      { 
        new: true 
      }
    );

    if (!followerResult) {
      return NextResponse.json({ error: "User follow record not found" }, { status: 404 });
    }

    console.log(`Unfollow operation: ${currentUsername} -> ${targetUsername}`);
    console.log(`${currentUsername} now follows:`, followerResult?.followedUsers || []);
    console.log(`${targetUsername} followers:`, followeeResult?.followers || []);

    return NextResponse.json(
      { 
        message: "User unfollowed successfully",
        follower: currentUsername,
        unfollowed: targetUsername
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unfollow error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
