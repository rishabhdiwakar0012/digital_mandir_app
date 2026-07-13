import { User } from './user.types';

// ==================== Auth Types ====================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse extends AuthTokens {
  message: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse extends AuthTokens {
  message: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

// ==================== Phone Auth Types ====================

export interface SendOtpRequest {
  phone: string;
}

export interface SendOtpResponse {
  message: string;
}

export interface VerifyOtpRequest {
  phone: string;
  otp: string;
}

export interface VerifyOtpResponse extends AuthTokens {
  message: string;
  user: User;
  isNewUser: boolean;
}

// ==================== Phone Register Types ====================

export interface PhoneRegisterRequest {
  phone: string;
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
}

// ==================== Email OTP Auth Types ====================

export interface SendEmailOtpRequest {
  email: string;
  purpose?: 'login' | 'register' | 'update-email';
  language?: string;
}

export interface SendEmailOtpResponse {
  message: string;
}

export interface VerifyEmailOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyEmailOtpResponse extends AuthTokens {
  message: string;
  user: User;
  isNewUser: boolean;
}

// ==================== Google Auth Types ====================

export interface GoogleAuthRequest {
  idToken: string;
}

export interface GoogleAuthResponse extends AuthTokens {
  message: string;
  user: User;
  isNewUser: boolean;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
