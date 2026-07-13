import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jaapApi, UserStats, LeaderboardResponse } from '../services/jaapApi';
import { useAppStore } from '../../store/appStore';
import {
  addToQueue,
  RecordSessionPayload,
} from '../../utils/offlineMutationQueue';

export function useUserStats() {
  return useQuery<UserStats>({
    queryKey: ['userStats'],
    queryFn: async () => {
      if (__DEV__) console.log('[useUserStats] Fetching stats from server');
      const stats = await jaapApi.getMyStats();
      if (__DEV__) console.log('[useUserStats] Received stats:', JSON.stringify(stats));
      return stats;
    },
    staleTime: 0, // Always fetch fresh so stats update immediately after completing jaap
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}

export function useLeaderboard(page = 1, limit = 20) {
  return useQuery<LeaderboardResponse>({
    queryKey: ['leaderboard', page, limit],
    queryFn: () => jaapApi.getLeaderboard(page, limit),
    staleTime: 0, // Always consider stale so data is fresh when screen opens
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 2,
    refetchOnMount: true,
  });
}

export function useUserSessions(page = 1, limit = 50) {
  return useQuery({
    queryKey: ['userSessions', page, limit],
    queryFn: () => jaapApi.getSessions(page, limit),
    staleTime: 60 * 1000,
  });
}

export function useRecordSession() {
  const queryClient = useQueryClient();
  const isOnline = useAppStore((s) => s.isOnline);

  return useMutation({
    mutationFn: async (data: RecordSessionPayload) => {
      // Read isOnline fresh from store each time — avoids stale closure where the
      // value captured at hook-render time differs from the true network state when
      // mutate() is finally called (e.g. user went offline between renders).
      const online = useAppStore.getState().isOnline;
      if (__DEV__) console.log('[useRecordSession] mutationFn START, isOnline:', online, 'data:', JSON.stringify(data));
      if (online) {
        const result = await jaapApi.recordSession(data);
        if (__DEV__) console.log('[useRecordSession] API response:', JSON.stringify(result));
        return result;
      }
      // Offline: queue for later sync
      if (__DEV__) console.log('[useRecordSession] Queueing for offline sync');
      return addToQueue(data);
    },
    onMutate: async (data) => {
      if (__DEV__) console.log('[useRecordSession] onMutate START');
      // Cancel outstanding refetches so optimistic update isn't overwritten
      await queryClient.cancelQueries({ queryKey: ['userStats'] });

      const previousStats = queryClient.getQueryData<UserStats>(['userStats']);
      if (__DEV__) console.log('[useRecordSession] previousStats:', JSON.stringify(previousStats));

      // Build new optimistic stats.
      // When previousStats is null/undefined (user opened app while offline so
      // useUserStats never succeeded), we create a safe baseline from scratch
      // instead of skipping — this ensures StreakCalendarScreen always has data.
      const base: UserStats = previousStats ?? {
        totalCoins: 0,
        totalJaapSessions: 0,
        totalBeads: 0,
        totalRounds: 0,
        streak: 0,
        lastStreakUpdateAt: null,
      };

      // Determine if today (in IST, UTC+5:30) is already counted in the streak.
      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
      const nowIST = new Date(Date.now() + IST_OFFSET_MS);
      const todayIST = `${nowIST.getUTCFullYear()}-${String(nowIST.getUTCMonth() + 1).padStart(2, '0')}-${String(nowIST.getUTCDate()).padStart(2, '0')}`;
      let todayHasSession = false;
      if (base.lastStreakUpdateAt) {
        const lastUpdate = new Date(base.lastStreakUpdateAt);
        const lastUpdateIST = new Date(lastUpdate.getTime() + IST_OFFSET_MS);
        const lastUpdateDateIST = `${lastUpdateIST.getUTCFullYear()}-${String(lastUpdateIST.getUTCMonth() + 1).padStart(2, '0')}-${String(lastUpdateIST.getUTCDate()).padStart(2, '0')}`;
        todayHasSession = lastUpdateDateIST === todayIST;
      }

      const newStats: UserStats = {
        ...base,
        totalBeads: base.totalBeads + data.totalBeads,
        totalRounds: base.totalRounds + data.rounds,
        totalJaapSessions: base.totalJaapSessions + 1,
        totalCoins: base.totalCoins + (data.coinsEarned ?? 0),
        streak: todayHasSession ? base.streak : base.streak + 1,
        // Mark today as the last streak update so subsequent jaaps this day don't double-count
        lastStreakUpdateAt: todayHasSession ? base.lastStreakUpdateAt : new Date().toISOString(),
      };
      if (__DEV__) console.log('[useRecordSession] Setting optimistic stats:', JSON.stringify(newStats));
      queryClient.setQueryData<UserStats>(['userStats'], newStats);

      return { previousStats };
    },
    onError: (_err, _data, context) => {
      if (__DEV__) console.log('[useRecordSession] onError:', (_err as any)?.message);
      // Only roll back optimistic update when online — the API call genuinely failed.
      // When offline, mutationFn queues the session successfully (addToQueue never throws
      // under normal conditions), so onError won't fire. But if it somehow does while
      // offline, we must NOT roll back since the session IS in the queue.
      const online = useAppStore.getState().isOnline;
      if (online && context?.previousStats) {
        queryClient.setQueryData(['userStats'], context.previousStats);
      }
    },
    onSettled: async () => {
      const online = useAppStore.getState().isOnline;
      if (__DEV__) console.log('[useRecordSession] onSettled, isOnline:', online);
      // When online, refetch authoritative data from server
      if (online) {
        // Add small delay to ensure database write has persisted
        await new Promise(resolve => setTimeout(resolve, 500));
        if (__DEV__) console.log('[useRecordSession] Invalidating userStats, userSessions and leaderboard queries');
        queryClient.invalidateQueries({ queryKey: ['userStats'] });
        queryClient.invalidateQueries({ queryKey: ['userSessions'] });
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      }
      // Offline: keep the optimistic update — it will be corrected when processQueue
      // syncs on reconnect and useOfflineSync invalidates the queries.
    },
  });
}
