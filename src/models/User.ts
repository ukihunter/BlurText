import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  username: string;
  password: string;
  displayName?: string;
  createdAt: Date;
  updatedAt?: Date;
  isAnonymous: boolean;
  anonymitySettings?: {
    hideOnlineStatus: boolean;
    enableDisappearingMessages: boolean;
    autoDeleteMessages: boolean;
    blockScreenshots: boolean;
    enableTwoFactor: boolean;
  };
}

const UserSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
  isAnonymous: {
    type: Boolean,
    default: true,
  },
  anonymitySettings: {
    hideOnlineStatus: {
      type: Boolean,
      default: false,
    },
    enableDisappearingMessages: {
      type: Boolean,
      default: false,
    },
    autoDeleteMessages: {
      type: Boolean,
      default: false,
    },
    blockScreenshots: {
      type: Boolean,
      default: false,
    },
    enableTwoFactor: {
      type: Boolean,
      default: false,
    },
  },
});

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
