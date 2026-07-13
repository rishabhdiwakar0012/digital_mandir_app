import { apiClient } from '../client';

// ── Leaderboard Types ──────────────────────────────────────────────────────────

export interface LeaderboardUser {
    id: string;
    _id: string;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    avatar?: string | null;
    gender?: "male" | "female" | "other" | "prefer_not_to_say";
    totalBeads: number;
    totalRounds: number;
    totalJaapSessions: number;
    totalCoins: number;
    rank: number;
}

export interface LeaderboardResponse {
    items: LeaderboardUser[];
    meta: {
        totalItems: number;
        itemCount: number;
        itemsPerPage: number;
        totalPages: number;
        currentPage: number;
    };
}

export interface UserStats {
    totalCoins: number;
    totalJaapSessions: number;
    totalBeads: number;
    totalRounds: number;
    streak: number;
    lastStreakUpdateAt?: string | null;
}

export interface JaapSession {
    _id: string;
    userId: string;
    mantraId?: string; 
    deityId?: string;
    deviceId?: string;
    duration: number;
    totalBeads: number;
    rounds: number;
    completedAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface SessionsResponse {
    items: JaapSession[];
    meta: {
        totalItems: number;
        itemCount: number;
        itemsPerPage: number;
        totalPages: number;
        currentPage: number;
    };
}

// ── Jaap API Service ───────────────────────────────────────────────────────────

export const jaapApi = {
    /**
     * Get global leaderboard sorted by totalBeads
     */
    getLeaderboard: (page = 1, limit = 20): Promise<LeaderboardResponse> => {
        return apiClient.get<LeaderboardResponse>(`/jaap/leaderboard?page=${page}&limit=${limit}`);
    },

    /**
     * Get current authenticated user's jaap stats (totalBeads, streak, etc.)
     */
    getMyStats: (): Promise<UserStats> => {
        return apiClient.get<UserStats>('/jaap/stats');
    },

    /**
     * Get user sessions history
     */
    getSessions: (page = 1, limit = 100): Promise<SessionsResponse> => {
        return apiClient.get<SessionsResponse>(`/jaap/sessions?page=${page}&limit=${limit}`);
    },

    /**
     * Record a completed jaap session
     */
    recordSession: (data: {
        category: string;
        rounds: number;
        totalBeads: number;
        duration: number;
        coinsEarned?: number;
        mantraId?: string;
        deityId?: string;
        completedAt?: string;
    }) => {
        return apiClient.post('/jaap/sessions', data);
    },

    /**
     * Daily login check-in — increments streak and awards coins once per IST day.
     * Idempotent: subsequent calls on the same day return coinsAwarded = 0.
     */
    dailyCheckin: (): Promise<{ streak: number; coinsAwarded: number; alreadyCheckedIn: boolean }> => {
        return apiClient.post('/jaap/daily-checkin', {});
    },
};
