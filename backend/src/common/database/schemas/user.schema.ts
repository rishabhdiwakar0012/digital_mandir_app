import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ type: String, lowercase: true, trim: true })
  email?: string;

  @Prop({ type: String, lowercase: true, trim: true })
  username?: string;

  @Prop({ type: String, trim: true })
  phone?: string;

  @Prop({ type: Boolean, default: false })
  phoneVerified: boolean;

  @Prop({ type: String, default: null })
  password?: string;

  @Prop({ type: String, trim: true, default: null })
  firstName?: string;

  @Prop({ type: String, trim: true, default: null })
  lastName?: string;

  @Prop({ type: String, enum: ['male', 'female', 'other'], default: null })
  gender?: string;

  @Prop({ type: Date, default: null })
  dateOfBirth?: Date;

  @Prop({ type: String, default: null })
  avatar?: string;

  @Prop({ type: String, default: null })
  bio?: string;

  @Prop({ type: String, default: null })
  favoriteDeity?: string;

  @Prop({ type: [String], default: ['user'] })
  roles: string[];

  @Prop({ type: Boolean, default: false })
  isEmailVerified: boolean;

  // OAuth provider IDs
  @Prop({ type: String })
  googleId?: string;

  @Prop({
    type: {
      language: { type: String, default: 'en' },
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        sms: { type: Boolean, default: true },
      },
    },
    default: {},
  })
  preferences: {
    language: string;
    theme: 'light' | 'dark' | 'system';
    notifications: { email: boolean; push: boolean; sms: boolean };
  };

  @Prop({ type: Number, default: 0 })
  totalCoins: number;

  @Prop({ type: Number, default: 0 })
  totalJaapSessions: number;

  @Prop({ type: Number, default: 0 })
  totalBeads: number;

  @Prop({ type: Number, default: 0 })
  totalRounds: number;

  @Prop({ type: Date, default: null })
  lastLoginAt?: Date;

  @Prop({ type: Number, default: 0 })
  currentStreak: number;

  @Prop({ type: Date, default: null })
  lastStreakUpdateAt?: Date;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Boolean, default: false })
  onboardingCompleted: boolean;

  @Prop({ type: String, default: null })
  onboardingStep?: string;

  // Virtuals / timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Indexes
UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });
UserSchema.index({ username: 1 }, { unique: true, sparse: true });
UserSchema.index({ googleId: 1 }, { unique: true, sparse: true });
UserSchema.index({ roles: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ totalBeads: -1 }); // For leaderboard queries
UserSchema.index({ lastLoginAt: -1 }); // For leaderboard time filtering
