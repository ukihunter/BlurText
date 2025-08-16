import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Post from "@/models/Post";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ hashtags: [] });
    }

    // Remove # if present and search for hashtags
    const searchTag = query.trim().replace(/^#/, "");

    // Aggregate to find unique hashtags and their post counts
    const hashtags = await Post.aggregate([
      { $unwind: "$tags" },
      {
        $match: {
          tags: { $regex: searchTag, $options: "i" },
        },
      },
      {
        $group: {
          _id: "$tags",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: Math.min(limit, 20) },
      {
        $project: {
          hashtag: "$_id",
          postCount: "$count",
          _id: 0,
        },
      },
    ]);

    return NextResponse.json({ hashtags });
  } catch (error) {
    console.error("Error searching hashtags:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
