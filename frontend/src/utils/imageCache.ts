import * as FileSystem from 'expo-file-system';

const IMAGE_CACHE_DIR = `${FileSystem.cacheDirectory}deity_images/`;

/** Ensure the cache directory exists */
async function ensureCacheDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(IMAGE_CACHE_DIR, { intermediates: true });
  }
}

/**
 * Convert a URL to a stable filename for disk storage.
 * Uses a simple hash of the URL to keep names short and safe.
 */
function urlToFilename(url: string): string {
  // Simple djb2-style hash → hex string
  let hash = 5381;
  for (let i = 0; i < url.length; i++) {
    hash = (hash * 33) ^ url.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  // Preserve extension if present
  const ext = url.split('?')[0].match(/\.[a-zA-Z0-9]+$/)?.[0] ?? '.jpg';
  return `${hash.toString(16)}${ext}`;
}

/**
 * Get the cached local URI for an image URL.
 * - If already cached on disk, returns the local `file://` URI immediately.
 * - If not cached, downloads it, stores it, then returns the local URI.
 * - On any error, returns the original remote URL as a fallback.
 */
export async function getCachedImageUri(url: string): Promise<string> {
  if (!url) return url;

  try {
    await ensureCacheDir();
    const filename = urlToFilename(url);
    const localPath = `${IMAGE_CACHE_DIR}${filename}`;

    const info = await FileSystem.getInfoAsync(localPath);
    if (info.exists) {
      return localPath; // ✅ Serve from disk cache
    }

    // Download and cache
    const result = await FileSystem.downloadAsync(url, localPath);
    if (result.status === 200) {
      return result.uri; // ✅ Freshly cached
    }

    return url; // fallback: serve from network
  } catch {
    return url; // fallback: serve from network
  }
}

/**
 * Prefetch a list of image URLs to disk in parallel (best-effort).
 * Called during background sync so images are ready before the user opens the screen.
 */
export async function prefetchImages(urls: string[]): Promise<void> {
  try {
    await ensureCacheDir();
    const unique = [...new Set(urls.filter(Boolean))];
    await Promise.allSettled(unique.map((url) => getCachedImageUri(url)));
  } catch {
    // best-effort — never block the sync
  }
}

/**
 * Clear all cached deity images (useful for force-refresh on content update).
 */
export async function clearImageCache(): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR);
    if (info.exists) {
      await FileSystem.deleteAsync(IMAGE_CACHE_DIR, { idempotent: true });
    }
  } catch {
    // ignore
  }
}
