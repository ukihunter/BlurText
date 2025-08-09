import mongoose, { Document, Schema } from "mongoose";

export interface IMessage extends Document {
  chatId: string;
  sender: string;
  content: string;
  messageType: 'text' | 'emoji' | 'image' | 'file';
  status: 'sending' | 'sent' | 'delivered' | 'read';
  isRead: boolean;
  readAt?: Date;
  deletedFor?: string[]; // Array of usernames who deleted this message
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  chatId: {
    type: String,
    required: true,
    ref: 'Chat',
  },
  sender: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 5000, // Limit message length
  },
  messageType: {
    type: String,
    enum: ['text', 'emoji', 'image', 'file'],
    default: 'text',
  },
  status: {
    type: String,
    enum: ['sending', 'sent', 'delivered', 'read'],
    default: 'sent',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
    default: null,
  },
  deletedFor: {
    type: [String],
    default: [],
  },
}, {
  timestamps: true,
});

// Create indexes for efficient querying
MessageSchema.index({ chatId: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });

export default mongoose.models.Message ||
  mongoose.model<IMessage>("Message", MessageSchema);
