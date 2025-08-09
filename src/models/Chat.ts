import mongoose, { Document, Schema } from "mongoose";

export interface IChat extends Document {
  participants: string[]; // Array of usernames
  lastMessage?: string;
  lastMessageTime?: Date;
  lastMessageSender?: string;
  deletedFor?: string[]; // Array of usernames who deleted this chat
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>({
  participants: {
    type: [String],
    required: true,
    validate: {
      validator: function(v: string[]) {
        return v.length === 2; // Only allow 1-on-1 conversations
      },
      message: "Chat must have exactly 2 participants"
    }
  },
  lastMessage: {
    type: String,
    default: null,
  },
  lastMessageTime: {
    type: Date,
    default: null,
  },
  lastMessageSender: {
    type: String,
    default: null,
  },
  deletedFor: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true,
});

// Create compound index for participants
ChatSchema.index({ participants: 1 });

// Ensure participants are always sorted to avoid duplicate chats
ChatSchema.pre('save', function() {
  if (this.participants) {
    this.participants.sort();
  }
});

export default mongoose.models.Chat ||
  mongoose.model<IChat>("Chat", ChatSchema);
