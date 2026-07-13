import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api',
  corsOrigin: process.env.CORS_ORIGIN || '*',
}));

export const databaseConfig = registerAs('database', () => ({
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mantra_jaap',
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'your-super-secret-key',
  accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
  refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
}));

export const throttleConfig = registerAs('throttle', () => ({
  ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
  limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
}));

export const redisConfig = registerAs('redis', () => ({
  url: process.env.REDIS_URL,
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
}));

// ─── Firebase Cloud Messaging (Push Notifications) ─────────────────────
// Credentials are loaded from firebase-google.json in the app root
// Fallback: individual env vars (only for local dev without the JSON file)
export const fcmConfig = registerAs('fcm', () => ({
  projectId: process.env.FCM_PROJECT_ID,
  clientEmail: process.env.FCM_CLIENT_EMAIL,
  privateKey: process.env.FCM_PRIVATE_KEY,
}));

export const smsConfig = registerAs('sms', () => ({
  provider: process.env.SMS_PROVIDER || 'console', // 'twilio' | 'msg91' | 'console'
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
}));

export const adminConfig = registerAs('admin', () => ({
  email: process.env.ADMIN_EMAIL || 'admin@digitalmandir.in',
  password: process.env.ADMIN_PASSWORD || 'Admin@123456',
  phone: process.env.ADMIN_PHONE || '+919999999999',
}));

// ─── Google OAuth (Google Sign-In) ──────────────────────────────────────
// Get these from Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs
// You need separate client IDs for Web, iOS, and Android
// ADD YOUR GOOGLE OAUTH CREDENTIALS HERE
export const googleConfig = registerAs('google', () => ({
  clientId: process.env.GOOGLE_CLIENT_ID, // ADD YOUR GOOGLE WEB CLIENT ID HERE
  clientSecret: process.env.GOOGLE_CLIENT_SECRET, // ADD YOUR GOOGLE CLIENT SECRET HERE (optional for mobile flow)
  // For mobile apps, you may have different client IDs for iOS and Android
  iosClientId: process.env.GOOGLE_IOS_CLIENT_ID, // ADD YOUR GOOGLE IOS CLIENT ID HERE
  androidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID, // ADD YOUR GOOGLE ANDROID CLIENT ID HERE
}));

export const emailConfig = registerAs('email', () => ({
  provider: process.env.EMAIL_PROVIDER || 'console', // 'smtp' | 'sendgrid' | 'console'
  from: process.env.EMAIL_FROM || 'noreply@digitalmandir.in',
  // SMTP settings
  smtpHost: process.env.SMTP_HOST,
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  // SendGrid settings
  sendgridApiKey: process.env.SENDGRID_API_KEY,
}));

export const r2Config = registerAs('r2', () => ({
  accountId: process.env.R2_ACCOUNT_ID,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  bucketName: process.env.R2_BUCKET_NAME || 'dm-1',
  publicUrl: process.env.R2_PUBLIC_URL,
}));
