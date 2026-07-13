import { z } from 'zod';

export const RegisterDeviceSchema = z.object({
  deviceId: z.string().min(1).max(255),
  platform: z.enum(['ios', 'android', 'web']),
  osVersion: z.string().max(50).optional().nullable(),
  appVersion: z.string().max(50).optional().nullable(),
  deviceModel: z.string().max(100).optional().nullable(),
  fcmToken: z.string().max(500).optional().nullable(),
  ip: z.string().max(45).optional().nullable(),
});

export type RegisterDeviceDto = z.infer<typeof RegisterDeviceSchema>;

export const UpdateFcmTokenSchema = z.object({
  deviceId: z.string().min(1).max(255),
  fcmToken: z.string().min(1).max(500),
});

export type UpdateFcmTokenDto = z.infer<typeof UpdateFcmTokenSchema>;
