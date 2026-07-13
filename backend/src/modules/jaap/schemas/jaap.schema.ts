import { z } from 'zod';

export const RecordSessionSchema = z.object({
  category: z.enum(['festival', 'god', 'special', 'custom']),
  rounds: z.number().int().min(1).max(1000),
  totalBeads: z.number().int().min(1).max(108000),
  duration: z.number().int().min(0).max(86400), // max 24 hours in seconds
  coinsEarned: z.number().int().min(0).max(10000).optional(),
  mantraId: z.string().optional(),
  deityId: z.string().optional(),
  deviceId: z.string().optional(),
  completedAt: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    })
    .optional(),
  performance: z.number().min(0).max(100).optional(),
});

export type RecordSessionDto = z.infer<typeof RecordSessionSchema>;
