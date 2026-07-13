import { z } from 'zod';

/**
 * Environment configuration schema
 * All environment variables are validated at startup
 */
export const envSchema = z.object({
  // App
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),
  API_PREFIX: z.string().default('api'),

  // Database (MongoDB)
  MONGODB_URI: z.string().default('mongodb://localhost:27017/mantra_jaap'),

  // JWT
  JWT_SECRET: z
    .string()
    .min(32)
    .default('your-super-secret-key-change-in-production'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),

  // Throttling
  THROTTLE_TTL: z.coerce.number().default(60000),
  THROTTLE_LIMIT: z.coerce.number().default(100),

  // CORS
  CORS_ORIGIN: z.string().default('*'),

  // Redis (optional)
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),

  // FCM (Firebase Cloud Messaging) — loaded from firebase-google.json
  FCM_PROJECT_ID: z.string().optional(),
  FCM_CLIENT_EMAIL: z.string().optional(),
  FCM_PRIVATE_KEY: z.string().optional(),

  // SMS Provider
  SMS_PROVIDER: z.enum(['twilio', 'msg91', 'console']).default('console'),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  // Email Provider
  EMAIL_PROVIDER: z.string().default('console'),
  EMAIL_FROM: z.string().default('noreply@digitalmandir.in'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),

  // Admin Settings
  ADMIN_EMAIL: z.string().default('admin@digitalmandir.in'),
  ADMIN_PASSWORD: z.string().default('Admin@123456'),
  ADMIN_PHONE: z.string().default('+919999999999'),

  // Google OAuth (Google Sign-In)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_IOS_CLIENT_ID: z.string().optional(),
  GOOGLE_ANDROID_CLIENT_ID: z.string().optional(),

  // Cloudflare R2 Storage
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().default('dm-1'),
  R2_PUBLIC_URL: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export const validateEnv = (config: Record<string, unknown>): EnvConfig => {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    throw new Error('Invalid environment variables');
  }

  return result.data;
};
