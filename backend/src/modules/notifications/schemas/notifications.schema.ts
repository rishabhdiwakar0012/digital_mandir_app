import { z } from 'zod';

const I18nTextSchema = z.object({
  en: z.string().min(1, 'English text is required'),
  hi: z.string().optional().default(''),
  sa: z.string().optional().default(''),
});

export const CreateNotificationSchema = z.object({
  title: I18nTextSchema,
  body: I18nTextSchema,
  type: z.enum(['push', 'in-app', 'both']).default('push'),
  targetAudience: z
    .enum(['all', 'specific_users', 'role_based'])
    .default('all'),
  targetUserIds: z.array(z.string()).optional().default([]),
  targetRoles: z.array(z.string()).optional().default([]),
  category: z.enum(['custom', 'mala_reminder', 'streak_reminder', 'festival', 'daily_prayer', 'streak_broken', 'streak_milestone']).optional().default('custom'),
  data: z.record(z.string(), z.unknown()).optional().default({}),
});

export type CreateNotificationDto = z.infer<typeof CreateNotificationSchema>;
