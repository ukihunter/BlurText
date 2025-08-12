import mongoose from "mongoose";

export interface IBookmark {
  _id?: string;
  userId: string;
  postId: string;
  createdAt: Date;
}

const BookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    postId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one bookmark per user per post
BookmarkSchema.index({ userId: 1, postId: 1 }, { unique: true });

const Bookmark = mongoose.models.Bookmark || mongoose.model("Bookmark", BookmarkSchema);

export default Bookmark;
