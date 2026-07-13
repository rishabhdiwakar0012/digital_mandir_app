import { useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { contentApi } from '../api/services/contentApi';
import { jaapApi } from '../api/services/jaapApi';
import { apiClient } from '../api/client';
import { processQueue } from '../utils/offlineMutationQueue';
import { useAppStore } from '../store/appStore';
import { prefetchAudioFiles } from '../utils/audioCache';
import { prefetchImages, clearImageCache } from '../utils/imageCache';
import { config } from '../config';

const SYNC_TIMESTAMPS_KEY = '@content_sync_timestamps';

interface SyncTimestamps {
  mantras?: string;
  deities?: string;
  content?: string;
}

async function getSavedTimestamps(): Promise<SyncTimestamps> {
  const raw = await AsyncStorage.getItem(SYNC_TIMESTAMPS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function saveTimestamps(timestamps: SyncTimestamps): Promise<void> {
  await AsyncStorage.setItem(SYNC_TIMESTAMPS_KEY, JSON.stringify(timestamps));
}

/**
 * Hook that runs background sync on app start and when coming back online.
 * - Checks sync-check endpoint for content updates
 * - Prefetches only changed content
 * - Processes offline mutation queue
 * - Non-blocking: user is never waiting
 */
export function useOfflineSync() {
  const queryClient = useQueryClient();
  const isOnline = useAppStore((s) => s.isOnline);

  const runSync = useCallback(async () => {
    try {
      // 1. Process any queued offline mutations first
      const { flushed } = await processQueue();

      // If we successfully synced any queued sessions, refresh stats immediately
      if (flushed > 0) {
        await new Promise(resolve => setTimeout(resolve, 400)); // let DB writes settle
        queryClient.invalidateQueries({ queryKey: ['userStats'] });
        queryClient.invalidateQueries({ queryKey: ['userSessions'] });
      }

      // 2. Check for content updates via sync-check endpoint
      let serverTimestamps: SyncTimestamps;
      try {
        serverTimestamps = await apiClient.get<SyncTimestamps>('/content/sync-check');
      } catch {
        // Offline or server unreachable — skip content sync
        return;
      }

      const savedTimestamps = await getSavedTimestamps();

      // 3. Only refetch entity types that have changed
      const prefetchPromises: Promise<void>[] = [];

      if (serverTimestamps.deities !== savedTimestamps.deities) {
        // Invalidate cache so active queries re-render with fresh data immediately
        await queryClient.invalidateQueries({ queryKey: ['deities'] });
        prefetchPromises.push(
          queryClient.prefetchQuery({
            queryKey: ['deities'],
            queryFn: contentApi.getDeities,
            staleTime: 0, // force refetch — server timestamp changed
          })
        );
        // Clear stale image disk cache when deity content has changed
        prefetchPromises.push(clearImageCache());
      }

      // Always prefetch deity images to disk so GodSpecificScreen renders instantly
      prefetchPromises.push(
        (async () => {
          try {
            const serverRoot = config.api.baseUrl.replace(/\/api$/, '');
            const deities = await contentApi.getDeities();
            const imageUrls = deities
              .map((d) => {
                if (!d.imageUrl) return null;
                if (d.imageUrl.startsWith('http://') || d.imageUrl.startsWith('https://')) return d.imageUrl;
                return `${serverRoot}${d.imageUrl}`;
              })
              .filter((url): url is string => typeof url === 'string' && url.length > 0);
            await prefetchImages(imageUrls);
          } catch {
            // best-effort — never block the sync
          }
        })()
      );

      if (serverTimestamps.mantras !== savedTimestamps.mantras) {
        // Invalidate ALL mantra caches so any active MantraSelectionScreen re-renders with
        // fresh data
        await queryClient.invalidateQueries({ queryKey: ['mantras'] });
        // Proactively warm the cache for each category
        for (const category of ['god', 'festival', 'special']) {
          prefetchPromises.push(
            queryClient.prefetchQuery({
              queryKey: ['mantras', category, undefined, undefined],
              queryFn: () => contentApi.getMantras({ category }),
              staleTime: 0, // force refetch — server timestamp changed
            })
          );
        }

        // After mantras are synced, cache their audio files for offline playback
        prefetchPromises.push(
          (async () => {
            try {
              const allMantras = await contentApi.getMantras();
              const audioUrls = allMantras
                .map((m) => m.audioUrl)
                .filter((url): url is string => typeof url === 'string' && url.length > 0);
              await prefetchAudioFiles(audioUrls);
            } catch {
              // best-effort — never block the sync
            }
          })()
        );
      }

      if (serverTimestamps.content !== savedTimestamps.content) {
        await queryClient.invalidateQueries({ queryKey: ['festivals'] });
        prefetchPromises.push(
          queryClient.prefetchQuery({
            queryKey: ['festivals'],
            queryFn: contentApi.getFestivals,
            staleTime: 0, // force refetch — server timestamp changed
          })
        );
      }

      // Always refresh user stats and leaderboard
      prefetchPromises.push(
        queryClient.prefetchQuery({
          queryKey: ['userStats'],
          queryFn: jaapApi.getMyStats,
        })
      );
      prefetchPromises.push(
        queryClient.prefetchQuery({
          queryKey: ['leaderboard', 1, 20],
          queryFn: () => jaapApi.getLeaderboard(1, 20),
        })
      );

      await Promise.allSettled(prefetchPromises);

      // 4. Save new timestamps
      await saveTimestamps(serverTimestamps);
    } catch {
      // Sync is best-effort — never crash the app
    }
  }, [queryClient]);

  // Run sync on mount (app start)
  useEffect(() => {
    runSync();
  }, [runSync]);

  // Run sync when coming back online
  useEffect(() => {
    if (isOnline) {
      runSync();
    }
  }, [isOnline, runSync]);

  return { runSync };
}
