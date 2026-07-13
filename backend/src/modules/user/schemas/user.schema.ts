import { z } from 'zod';
import { LanguageSchema, ThemeSchema } from '../../../common/schemas';

/**
 * User Module Schemas
 * Following Single Responsibility Principle - each schema validates specific user operations
 */

// Update Profile Schema
export const UpdateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).trim().optional(),
  lastName: z.string().max(50).trim().optional(),
  avatar: z.string().min(1, 'Avatar path is required').optional(),
  phoneNumber: z.string().min(10).max(15).optional().nullable(),
  gender: z
    .enum(['male', 'female', 'other', 'prefer_not_to_say'])
    .optional()
    .nullable(),
  dateOfBirth: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    })
    .optional()
    .nullable(),
  bio: z.string().max(500).optional().nullable(),
  favoriteDeity: z.string().max(100).optional().nullable(),
  email: z.string().email('Email must be valid').optional(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;

// Update Preferences Schema
export const UpdatePreferencesSchema = z.object({
  language: LanguageSchema.optional(),
  theme: ThemeSchema.optional(),
  notificationsEnabled: z.boolean().optional(),
});

export type UpdatePreferencesDto = z.infer<typeof UpdatePreferencesSchema>;

// Update Onboarding Status Schema
export const UpdateOnboardingStatusSchema = z.object({
  onboardingCompleted: z.boolean().optional(),
  onboardingStep: z.string().max(50).optional().nullable(),
});

export type UpdateOnboardingStatusDto = z.infer<
  typeof UpdateOnboardingStatusSchema
>;

// Update Email Schema
export const UpdateEmailSchema = z.object({
  email: z.string().email('Email must be valid'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export type UpdateEmailDto = z.infer<typeof UpdateEmailSchema>;
