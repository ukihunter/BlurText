import mongoose from "mongoose";

const UserFollowsSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    followedUsers: {
      type: [String], // Array of usernames that this user is following
      default: [],
    },
    followers: {
      type: [String], // Array of usernames that are following this user
      default: [],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Create indexes manually (avoid duplicate index warnings)
UserFollowsSchema.index({ username: 1 });
UserFollowsSchema.index({ followedUsers: 1 });

const UserFollows = mongoose.models.UserFollows || mongoose.model("UserFollows", UserFollowsSchema);

export default UserFollows;
