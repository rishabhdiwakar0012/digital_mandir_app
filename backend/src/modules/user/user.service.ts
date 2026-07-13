import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../common/database/schemas';
import { Otp, OtpDocument } from '../../common/database/schemas';
import {
  IUserService,
  UserProfile,
  UserPreferences,
  OnboardingStatus,
} from './interfaces';

/**
 * User Service
 *
 * Single Responsibility: Manages user profile, preferences, and onboarding status
 * Dependency Inversion: Implements IUserService interface
 *
 * TODO: MongoDB Integration
 * =========================
 * This service uses Mongoose to interact with MongoDB.
 *
 * Once MongoDB is set up:
 * - All methods will work automatically
 * - User data will persist across server restarts
 * - Queries will use MongoDB's native query language
 *
 * Until MongoDB is set up:
 * - The @InjectModel decorator will fail to inject the User model
 * - You'll need to have MongoDB running and DATABASE_URL configured
 */

@Injectable()
export class UserService implements IUserService {
  constructor(
    // TODO: MongoDB Setup - This injects the Mongoose User model
    // Once MongoDB is connected, this will work automatically
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
  ) {}

  /**
   * Update user email with OTP verification
   */
  async updateEmail(
    userId: string,
    newEmail: string,
    otp: string,
  ): Promise<UserProfile> {
    const normalizedEmail = newEmail.toLowerCase().trim();

    // Verify OTP
    const otpDoc = await this.otpModel.findOne({
      email: normalizedEmail,
      type: 'email',
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc) {
      throw new BadRequestException('OTP expired or not found');
    }

    if (otpDoc.otp !== otp) {
      otpDoc.attempts += 1;
      await otpDoc.save();

      if (otpDoc.attempts >= 5) {
        await otpDoc.deleteOne();
        throw new BadRequestException('Too many attempts. Request a new OTP.');
      }

      throw new BadRequestException('Invalid OTP');
    }

    // OTP Valid - delete it
    await otpDoc.deleteOne();

    // Check if email already taken
    const existingUser = await this.userModel.findOne({
      email: normalizedEmail,
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Update User
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $set: {
            email: normalizedEmail,
            isEmailVerified: true,
          },
        },
        { returnDocument: 'after' },
      )
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapToUserProfile(user);
  }

  /**
   * Get user profile by user ID
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    // TODO: MongoDB Query - Find user by ID
    const user = await this.userModel
      .findById(userId)
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapToUserProfile(user);
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: Partial<UserProfile>,
  ): Promise<UserProfile> {
    const updated = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: data },
      { returnDocument: 'after' },
    );

    if (!updated) {
      throw new NotFoundException('User not found');
    }

    return this.mapToUserProfile(updated);
  }

  /**
   * Get user preferences
   */
  async getPreferences(userId: string): Promise<UserPreferences> {
    const user = await this.userModel
      .findById(userId)
      .select('preferences')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      language: (user.preferences?.language ?? 'en') as any,
      theme: (user.preferences?.theme ?? 'system') as any,
      notificationsEnabled: user.preferences?.notifications?.push ?? true,
    };
  }

  /**
   * Update user preferences (language, theme, notifications)
   */
  async updatePreferences(
    userId: string,
    data: Partial<UserPreferences>,
  ): Promise<UserPreferences> {
    // Build dot-notation update to patch nested preferences fields
    const setFields: Record<string, any> = {};
    if (data.language !== undefined) setFields['preferences.language'] = data.language;
    if (data.theme !== undefined) setFields['preferences.theme'] = data.theme;
    if (data.notificationsEnabled !== undefined) {
      setFields['preferences.notifications.push'] = data.notificationsEnabled;
    }

    const updated = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: setFields },
      { returnDocument: 'after' },
    );
    if (!updated) {
      throw new NotFoundException('User not found');
    }

    return {
      language: (updated.preferences?.language ?? 'en') as any,
      theme: (updated.preferences?.theme ?? 'system') as any,
      notificationsEnabled: updated.preferences?.notifications?.push ?? true,
    };
  }

  /**
   * Get onboarding status
   */
  async getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
    const user = await this.userModel
      .findById(userId)
      .select('onboardingCompleted onboardingStep')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      onboardingCompleted: user.onboardingCompleted ?? false,
      onboardingStep: user.onboardingStep ?? null,
    };
  }

  /**
   * Update onboarding status
   */
  async updateOnboardingStatus(
    userId: string,
    data: Partial<OnboardingStatus>,
  ): Promise<OnboardingStatus> {
    const updated = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: data },
      { returnDocument: 'after' },
    );
    if (!updated) {
      throw new NotFoundException('User not found');
    }

    return {
      onboardingCompleted: updated.onboardingCompleted ?? false,
      onboardingStep: updated.onboardingStep ?? null,
    };
  }

  /**
   * Delete user account (soft delete)
   */
  async deleteAccount(userId: string): Promise<{ message: string }> {
    // TODO: MongoDB Update - Soft delete user document
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Soft delete: deactivate the account instead of permanent deletion
    await this.userModel.findByIdAndUpdate(userId, {
      $set: { isActive: false },
    });

    return { message: 'Account deleted successfully' };
  }

  /**
   * Helper method to map database user to UserProfile
   * Following DRY principle - reuse mapping logic
   */
  private mapToUserProfile(user: UserDocument): UserProfile {
    return {
      id: user._id.toString(),
      email: user.email!,
      username: user.username!,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      phoneNumber: (user as any).phone ?? (user as any).phoneNumber ?? null,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth?.toString() as any,
      bio: user.bio,
      favoriteDeity: user.favoriteDeity,
      roles: user.roles,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
