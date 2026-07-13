// ==================== User Types ====================

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  favoriteDeity?: string;
  roles: string[];
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  avatar?: string;
  phoneNumber?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  dateOfBirth?: string;
  bio?: string;
  favoriteDeity?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
}
