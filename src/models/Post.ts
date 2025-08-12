import mongoose from "mongoose";

export interface IPost {
  _id?: string;
  userId: string;
  username: string;
  content: string;
  images?: string[];
  tags: string[];
  likes: number;
  likedBy: string[];
  comments: number;
  shares: number;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxLength: 1000,
    },
    images: [
      {
        type: String,
      },
    ],
    tags: [
      {
        type: String,
        required: true,
      },
    ],
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: String,
      },
    ],
    comments: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
PostSchema.index({ createdAt: -1 });
PostSchema.index({ tags: 1 });
PostSchema.index({ userId: 1, createdAt: -1 });

const Post = mongoose.models.Post || mongoose.model("Post", PostSchema);

export default Post;
