const NODE_ENV = process.env.NODE_ENV || 'development';
const API_URL = process.env.EXPO_PUBLIC_API_URL;

// ─── Google OAuth Client IDs ────────────────────────────────────
// Get these from Google Cloud Console → APIs & Services → Credentials
// Create OAuth 2.0 Client IDs for Web, iOS, and Android
// ADD YOUR GOOGLE CLIENT IDS HERE
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';

// Fallback URLs by environment
const FALLBACK_URLS: Record<string, string> = {
  production: 'https://api.digitalmandir.in/api',
  staging: 'http://192.168.1.6:3000/api',
  development: 'http://192.168.1.6:3000/api',
};

// Use provided URL or fallback based on environment
const RESOLVED_API_URL = API_URL || FALLBACK_URLS[NODE_ENV] || FALLBACK_URLS.development;

export const config = {
  api: {
    baseUrl: RESOLVED_API_URL,
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  google: {
    // ADD YOUR GOOGLE CLIENT IDS HERE — from Google Cloud Console
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  },
  network: {
    // Enable network debugging in development
    enableNetworkLogging: NODE_ENV === 'development',
    // Allow cleartext traffic for local development
    allowCleartextTraffic: NODE_ENV === 'development',
  },
  storage: {
    tokenKey: 'auth_tokens',
    userKey: 'user_data',
    languageKey: 'app_language',
    themeKey: 'app_theme',
  },
  defaults: {
    language: 'en',
    theme: 'system',
  },
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  environment: NODE_ENV as 'development' | 'staging' | 'production',
} as const;

export type Config = typeof config;
