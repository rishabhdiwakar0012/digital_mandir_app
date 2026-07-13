import { z } from 'zod';

// Common reusable schemas
export const UuidSchema = z.string().uuid();

export const EmailSchema = z.string().email().toLowerCase().trim();

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase, lowercase, number and special character',
  );

export const UsernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must not exceed 30 characters')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username can only contain letters, numbers and underscores',
  )
  .toLowerCase()
  .trim();

export const PhoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

// Language Schema - Supported languages for i18n
export const LanguageSchema = z.enum(['en', 'hi', 'sa']);

export type Language = z.infer<typeof LanguageSchema>;

// Theme Schema - UI theme preferences
export const ThemeSchema = z.enum(['light', 'dark', 'system']);

export type Theme = z.infer<typeof ThemeSchema>;

// Pagination Schema
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationDto = z.infer<typeof PaginationSchema>;

// Generic ID params schema
export const IdParamSchema = z.object({
  id: UuidSchema,
});

export type IdParamDto = z.infer<typeof IdParamSchema>;

// Search schema
export const SearchSchema = z.object({
  query: z.string().min(1).max(255).trim(),
});

export type SearchDto = z.infer<typeof SearchSchema>;
