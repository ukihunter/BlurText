import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();

    const { displayName, anonymitySettings } = await request.json();

    // Get token from cookies
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
      };
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    // Find the user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Prepare update object
    const updateData: {
      updatedAt: Date;
      displayName?: string;
      anonymitySettings?: {
        hideOnlineStatus: boolean;
        enableDisappearingMessages: boolean;
        autoDeleteMessages: boolean;
        blockScreenshots: boolean;
        enableTwoFactor: boolean;
      };
    } = {
      updatedAt: new Date(),
    };

    // Update display name if provided
    if (displayName && displayName.trim()) {
      updateData.displayName = displayName.trim();
    }

    // Update anonymity settings if provided
    if (anonymitySettings) {
      updateData.anonymitySettings = {
        hideOnlineStatus: anonymitySettings.hideOnlineStatus || false,
        enableDisappearingMessages:
          anonymitySettings.enableDisappearingMessages || false,
        autoDeleteMessages: anonymitySettings.autoDeleteMessages || false,
        blockScreenshots: anonymitySettings.blockScreenshots || false,
        enableTwoFactor: anonymitySettings.enableTwoFactor || false,
      };
    }

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      { $set: updateData },
      { new: true, select: "-password" }
    );

    return NextResponse.json(
      {
        message: "Profile updated successfully",
        user: {
          id: updatedUser._id,
          username: updatedUser.username,
          displayName: updatedUser.displayName || updatedUser.username,
          anonymitySettings: updatedUser.anonymitySettings || {},
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
