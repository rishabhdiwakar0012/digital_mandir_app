export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface User {
  _id: string;
  phone: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  dateOfBirth?: string;
  avatar?: string;
  bio?: string;
  roles: string[];
  preferences: {
    language: string;
    theme: string;
    notifications: boolean;
  };
  totalCoins: number;
  totalJaapSessions: number;
  totalBeads: number;
  totalRounds: number;
  deviceModel?: string;
  lastLoginAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  _id: string;
  userId: string;
  deviceId: string;
  platform: string;
  osVersion?: string;
  appVersion?: string;
  deviceModel?: string;
  fcmToken?: string;
  ip?: string;
  approxLocation?: {
    city?: string;
    region?: string;
    country?: string;
  };
  lastActiveAt?: string;
  createdAt: string;
}

export interface Session {
  _id: string;
  userId: string;
  deviceId?: string;
  ip?: string;
  userAgent?: string;
  expiresAt: string;
  createdAt: string;
}

export interface Deity {
  _id: string;
  slug: string;
  name: { en: string; hi: string; sa?: string };
  description?: { en?: string; hi?: string; sa?: string };
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Mantra {
  _id: string;
  category: 'festival' | 'god' | 'special' | 'custom';
  deityId?: Deity | string;
  festivalId?: string;
  title: { en: string; hi: string; sa?: string };
  text: { en: string; hi: string; sa?: string };
  description?: { en?: string; hi?: string; sa?: string };
  imageUrl?: string;
  audioUrl?: string;
  beadCount: number;
  coinsReward: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Content {
  _id: string;
  section: 'festival' | 'god' | 'special' | 'custom';
  slug?: string;
  title: { en: string; hi: string; sa?: string };
  body?: { en?: string; hi?: string; sa?: string };
  imageUrl?: string;
  iconName?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface JaapSession {
  _id: string;
  userId: string | User;
  mantraId: string | Mantra;
  deityId?: string;
  category: string;
  rounds: number;
  totalBeads: number;
  duration: number;
  coinsEarned: number;
  completedAt: string;
  createdAt: string;
}

export interface Notification {
  _id: string;
  title: { en: string; hi?: string };
  body: { en: string; hi?: string };
  type: 'push' | 'in-app' | 'both';
  targetAudience: 'all' | 'specific_users' | 'role_based';
  targetUserIds?: string[];
  targetRoles?: string[];
  data?: Record<string, string>;
  category?: 'custom' | 'mala_reminder' | 'streak_reminder' | 'festival' | 'daily_prayer';
  sentAt?: string;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  totalRecipients: number;
  deliveredCount: number;
  failedCount: number;
  sentBy?: string;
  createdAt: string;
}

export interface DashboardOverview {
  totalUsers: number;
  activeUsers: { today: number; week: number; month: number };
  newUsersToday: number;
  newUsersWeek: number;
  totalJaapSessions: number;
  jaapSessionsToday: number;
  mantrasCount: number;
  notificationsSent: number;
  popularMantras: { _id: string | null; count: number; totalBeads: number }[];
}

export interface LeaderboardEntry {
  _id: string;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  gender?: string | null;
  avatar?: string | null;
  totalBeads: number;
  totalRounds: number;
  totalJaapSessions: number;
  rank?: number;
}
