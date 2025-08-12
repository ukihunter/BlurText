import mongoose from "mongoose";

export interface INotification {
  _id?: string;
  userId: string; // The user who will receive the notification
  fromUserId: string; // The user who triggered the notification
  fromUsername: string;
  postId?: string; // For post-related notifications
  type: "like" | "comment" | "share" | "follow";
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    fromUserId: {
      type: String,
      required: true,
    },
    fromUsername: {
      type: String,
      required: true,
    },
    postId: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      enum: ["like", "comment", "share", "follow"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });

const Notification = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

export default Notification;
