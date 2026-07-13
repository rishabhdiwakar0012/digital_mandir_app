import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * User Schema for MongoDB
 *
 * TODO: MongoDB Integration
 * ========================
 * This schema defines the User model for MongoDB using Mongoose.
 * When setting up MongoDB:
 *
 * 1. Install MongoDB locally or use MongoDB Atlas:
 *    - Local: https://www.mongodb.com/try/download/community
 *    - Atlas: https://www.mongodb.com/cloud/atlas
 *
 * 2. Update DATABASE_URL in .env file:
 *    - Local: mongodb://localhost:27017/digital_mantra
 *    - Atlas: mongodb+srv://username:password@cluster.mongodb.net/digital_mantra
 *
 * 3. The MongooseModule.forRoot() in app.module.ts will connect to the database
 *
 * 4. This schema will automatically create a 'users' collection in MongoDB
 */

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: null })
  firstName?: string;

  @Prop({ default: null })
  lastName?: string;

  @Prop({ default: null })
  avatar?: string;

  @Prop({ default: null })
  phoneNumber?: string;

  @Prop({
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    default: null,
  })
  gender?: string;

  @Prop({ default: null })
  dateOfBirth?: string;

  @Prop({ default: null })
  bio?: string;

  @Prop({ default: null })
  favoriteDeity?: string;

  @Prop({ type: [String], default: ['user'] })
  roles: string[];

  @Prop({ default: false })
  isEmailVerified: boolean;

  // User Preferences
  @Prop({
    type: String,
    enum: ['en', 'hi', 'sa'],
    default: 'en',
    comment: 'User preferred language: en (English), hi (Hindi), sa (Sanskrit)',
  })
  language: string;

  @Prop({
    type: String,
    enum: ['light', 'dark', 'system'],
    default: 'system',
    comment: 'User preferred theme',
  })
  theme: string;

  @Prop({ default: true })
  notificationsEnabled: boolean;

  // Onboarding Status
  @Prop({
    default: false,
    comment: 'Tracks whether user has completed the onboarding flow',
  })
  onboardingCompleted: boolean;

  @Prop({
    default: null,
    comment: 'Current step in onboarding flow (if not completed)',
  })
  onboardingStep?: string;

  // Timestamps (automatically managed by Mongoose with timestamps: true)
  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes for better query performance
// TODO: MongoDB Setup - These indexes will be created automatically when MongoDB is connected
UserSchema.index({ onboardingCompleted: 1 });
