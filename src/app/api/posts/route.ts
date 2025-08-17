import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Post from "@/models/Post";
import User from "@/models/User";
import UserPreferences from "@/models/UserPreferences";
import Bookmark from "@/models/Bookmark";
import jwt from "jsonwebtoken";

// GET - Fetch posts with recommendation algorithm
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
      };
    } catch (error) {
      console.error("JWT verification failed:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;

    // Check for hashtag filter
    const { searchParams } = new URL(request.url);
    const hashtagFilter = searchParams.get("hashtag");

    // If hashtag filter is provided, return posts with that hashtag
    if (hashtagFilter) {
      const filteredPosts = await Post.find({
        tags: { $in: [hashtagFilter] },
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      // Add user interaction flags
      const postsWithFlags = await Promise.all(
        filteredPosts.map(async (post) => {
          const isLikedByUser = post.likedBy?.includes(userId) || false;
          const bookmark = await Bookmark.findOne({ userId, postId: post._id });
          const isBookmarkedByUser = !!bookmark;

          return {
            ...post,
            isLikedByUser,
            isBookmarkedByUser,
          };
        })
      );

      return NextResponse.json({ posts: postsWithFlags });
    }

    // Get user preferences for recommendations
    const userPreferences = await UserPreferences.findOne({ userId });
    const userInterests = userPreferences?.interests || [];

    // Enhanced recommendation logic
    let posts;
    if (userInterests.length > 0) {
      // Get posts with matching tags and calculate relevance score
      posts = await Post.aggregate([
        {
          $addFields: {
            relevanceScore: {
              $size: {
                $setIntersection: ["$tags", userInterests],
              },
            },
            // Add weight for recent posts
            recencyScore: {
              $divide: [
                { $subtract: [new Date(), "$createdAt"] },
                1000 * 60 * 60 * 24, // Convert to days
              ],
            },
            // Check if user liked this post
            isLikedByUser: {
              $in: [userId, "$likedBy"],
            },
          },
        },
        {
          $addFields: {
            // Combine relevance and recency (higher relevance + recent = higher score)
            finalScore: {
              $add: [
                { $multiply: ["$relevanceScore", 10] }, // Weight relevance heavily
                {
                  $max: [
                    0,
                    { $subtract: [7, "$recencyScore"] }, // Recent posts get higher score
                  ],
                },
              ],
            },
          },
        },
        {
          $sort: {
            finalScore: -1,
            createdAt: -1,
          },
        },
        {
          $limit: 50,
        },
      ]);
    } else {
      // Default to chronological order for users without preferences
      posts = await Post.aggregate([
        {
          $addFields: {
            isLikedByUser: {
              $in: [userId, "$likedBy"],
            },
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: 50 },
      ]);
    }

    // Get user's bookmarks to add bookmark status
    const bookmarks = await Bookmark.find({ userId });
    const bookmarkedPostIds = bookmarks.map((b) => b.postId);

    // Add bookmark status to posts
    const postsWithInteractionStatus = posts.map((post) => ({
      ...post,
      isBookmarkedByUser: bookmarkedPostIds.includes(post._id.toString()),
    }));

    return NextResponse.json({ posts: postsWithInteractionStatus });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new post
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
      };
    } catch (error) {
      console.error("JWT verification failed:", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = decoded.userId;

    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { content, images, tags } = body;

    console.log("Post creation request:", {
      content,
      images,
      tags,
      userId,
      username: user.username,
    });

    // Validation
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    if (!tags || !Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json(
        { error: "At least one tag is required" },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: "Content must be 1000 characters or less" },
        { status: 400 }
      );
    }

    // Create new post
    const postData = {
      userId,
      username: user.username,
      content: content.trim(),
      images: images || [],
      tags,
      likes: 0,
      likedBy: [],
      comments: 0,
      shares: 0,
    };

    console.log("Creating post with data:", postData);

    const newPost = new Post(postData);

    const savedPost = await newPost.save();

    return NextResponse.json(
      { message: "Post created successfully", post: savedPost },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating post:", error);

    // If it's a mongoose validation error, provide more specific details
    if (error instanceof Error && error.name === "ValidationError") {
      console.error("Validation error details:", error.message);
      return NextResponse.json(
        { error: `Post validation failed: ${error.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
