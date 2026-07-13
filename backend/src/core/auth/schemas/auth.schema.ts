import { z } from 'zod';
import {
  EmailSchema,
  PasswordSchema,
  UsernameSchema,
  PhoneSchema,
} from '../../../common/schemas';

// Register Schema
export const RegisterSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  username: UsernameSchema,
  firstName: z.string().min(1).max(50).trim().optional(),
  lastName: z.string().max(50).trim().optional(),
  phone: z.string().optional(),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

// Login Schema
export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginDto = z.infer<typeof LoginSchema>;

// Send OTP Schema
export const SendOtpSchema = z.object({
  phone: PhoneSchema,
});

export type SendOtpDto = z.infer<typeof SendOtpSchema>;

// Verify OTP Schema
export const VerifyOtpSchema = z.object({
  phone: PhoneSchema,
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export type VerifyOtpDto = z.infer<typeof VerifyOtpSchema>;

// Admin Login Schema
export const AdminLoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type AdminLoginDto = z.infer<typeof AdminLoginSchema>;

// Refresh Token Schema
export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;

// Change Password Schema
export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;

// Forgot Password Schema
export const ForgotPasswordSchema = z.object({
  email: EmailSchema,
});

export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;

// Reset Password Schema
export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    password: PasswordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;

// ─── Email OTP Schemas ─────────────────────────────────────────

// Send Email OTP Schema
export const SendEmailOtpSchema = z.object({
  email: EmailSchema,
  purpose: z.enum(['login', 'register', 'update-email']).optional(),
  language: z.enum(['en', 'hi']).optional(),
});

export type SendEmailOtpDto = z.infer<typeof SendEmailOtpSchema>;

// Verify Email OTP Schema
export const VerifyEmailOtpSchema = z.object({
  email: EmailSchema,
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export type VerifyEmailOtpDto = z.infer<typeof VerifyEmailOtpSchema>;

// ─── Admin OTP Schemas ─────────────────────────────────────────

// Send Admin OTP Schema
export const SendAdminOtpSchema = z.object({
  email: EmailSchema,
});

export type SendAdminOtpDto = z.infer<typeof SendAdminOtpSchema>;

// Verify Admin OTP Schema
export const VerifyAdminOtpSchema = z.object({
  email: EmailSchema,
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export type VerifyAdminOtpDto = z.infer<typeof VerifyAdminOtpSchema>;

// ─── Google OAuth Schemas ──────────────────────────────────────

// Google Auth Schema (for mobile - receives idToken from Google Sign-In)
export const GoogleAuthSchema = z.object({
  idToken: z.string().min(1, 'Google ID token is required'),
});

export type GoogleAuthDto = z.infer<typeof GoogleAuthSchema>;
