import mongoose from "mongoose";

export interface IComment {
  _id?: string;
  postId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: Date;
}

const CommentSchema = new mongoose.Schema(
  {
    postId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxLength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
CommentSchema.index({ postId: 1, createdAt: -1 });

const Comment =
  mongoose.models.Comment || mongoose.model("Comment", CommentSchema);

export default Comment;
