import mongoose, { Document, Schema } from "mongoose";

export interface IFollow extends Document {
  follower: mongoose.Types.ObjectId; // User who is following
  following: mongoose.Types.ObjectId; // User being followed
  createdAt: Date;
}

const FollowSchema = new Schema<IFollow>({
  follower: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  following: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create compound index to prevent duplicate follows and improve query performance
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });
FollowSchema.index({ follower: 1 });
FollowSchema.index({ following: 1 });

export default mongoose.models.Follow ||
  mongoose.model<IFollow>("Follow", FollowSchema);
