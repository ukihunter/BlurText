import mongoose, { Document, Schema } from "mongoose";

export interface IUserPreferences extends Document {
  userId: mongoose.Types.ObjectId;
  username: string;
  
  // Essential fields for recommendation algorithm
  interests: string[]; // Array of interest categories - main data for recommendations
  
  // Onboarding tracking
  hasCompletedOnboarding: boolean;
  onboardingCompletedAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const UserPreferencesSchema = new Schema<IUserPreferences>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  
  // Essential fields for recommendation algorithm
  interests: [{
    type: String,
    enum: [
      'technology', 'art', 'music', 'sports', 'travel', 
      'food', 'gaming', 'movies', 'fitness', 'lifestyle'
    ]
  }],
  
  // Onboarding tracking
  hasCompletedOnboarding: {
    type: Boolean,
    default: false
  },
  onboardingCompletedAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true // This automatically adds createdAt and updatedAt
});

// Create indexes for better performance
UserPreferencesSchema.index({ userId: 1 });
UserPreferencesSchema.index({ username: 1 });
UserPreferencesSchema.index({ hasCompletedOnboarding: 1 });

export default mongoose.models.UserPreferences ||
  mongoose.model<IUserPreferences>("UserPreferences", UserPreferencesSchema);
