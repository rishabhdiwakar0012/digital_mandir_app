import { Language, Theme } from '../../../common/schemas';

/**
 * User Module Interfaces
 * Following Interface Segregation Principle - focused interfaces for specific operations
 */

// User Profile data structure
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  phoneNumber?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  bio?: string | null;
  favoriteDeity?: string | null;
  roles: string[];
  isEmailVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// User Preferences data structure
export interface UserPreferences {
  language: Language;
  theme: Theme;
  notificationsEnabled: boolean;
}

// Onboarding Status data structure
export interface OnboardingStatus {
  onboardingCompleted: boolean;
  onboardingStep?: string | null;
}

/**
 * User Service Interface
 * Following Dependency Inversion Principle - depend on abstraction, not concretion
 */
export interface IUserService {
  getUserProfile(userId: string): Promise<UserProfile>;
  updateProfile(
    userId: string,
    data: Partial<UserProfile>,
  ): Promise<UserProfile>;
  updateEmail(
    userId: string,
    newEmail: string,
    otp: string,
  ): Promise<UserProfile>;
  getPreferences(userId: string): Promise<UserPreferences>;
  updatePreferences(
    userId: string,
    data: Partial<UserPreferences>,
  ): Promise<UserPreferences>;
  getOnboardingStatus(userId: string): Promise<OnboardingStatus>;
  updateOnboardingStatus(
    userId: string,
    data: Partial<OnboardingStatus>,
  ): Promise<OnboardingStatus>;
  deleteAccount(userId: string): Promise<{ message: string }>;
}
