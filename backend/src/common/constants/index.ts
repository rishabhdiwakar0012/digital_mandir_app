// API Constants
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Token Constants
export const TOKEN_TYPE = {
  ACCESS: 'access',
  REFRESH: 'refresh',
} as const;

// Rate Limiting
export const RATE_LIMIT = {
  DEFAULT_TTL: 60000, // 1 minute
  DEFAULT_LIMIT: 100,
  AUTH_TTL: 60000,
  AUTH_LIMIT: 5,
} as const;

// Supported Languages
export const SUPPORTED_LANGUAGES = ['en', 'hi', 'sa'] as const;
export const DEFAULT_LANGUAGE = 'en';

// Cache TTL (in seconds)
export const CACHE_TTL = {
  SHORT: 60,
  MEDIUM: 300,
  LONG: 3600,
} as const;
