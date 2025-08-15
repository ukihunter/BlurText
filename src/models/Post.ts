import mongoose from "mongoose";

export interface IPost {
  _id?: string;
  userId: string;
  username: string;
  content: string;
  images?: {
    data: string; // encrypted base64
    iv: string; // initialization vector
    key: string; // encryption key
    filename: string;
    mimetype: string;
    size: number;
  }[];
  tags: string[];
  likes: number;
  likedBy: string[];
  comments: number;
  shares: number;
  createdAt: Date;
  updatedAt: Date;
}

const ImageSchema = new mongoose.Schema({
  data: {
    type: String,
    required: true,
  }, // encrypted base64 image data
  iv: {
    type: String,
    required: true,
  }, // initialization vector for decryption
  key: {
    type: String,
    required: true,
  }, // encryption key
  filename: {
    type: String,
    required: true,
  },
  mimetype: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
});

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
    images: [ImageSchema], // Updated to store encrypted image objects
    tags: [
      {
        type: String,
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
