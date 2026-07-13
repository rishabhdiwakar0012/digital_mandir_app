/**
 * Audio file cache utility stub.
 * 
 * TODO: expo-file-system v19 doesn't export the legacy functions cleanly.
 * For now, we skip audio file caching and let expo-audio stream from URLs directly.
 * Once online, mantras are cached by useOfflineSync so users can access them offline.
 * When playing, if cached it will use cache, otherwise streams from URL.
 * 
 * Full offline audio playback (without internet) is a future enhancement.
 */

/** No-op: audio URL is played directly; network is required for first playback. */
export async function getCachedAudioUri(url: string): Promise<string> {
    return url; // Return URL as-is; expo-audio will stream it
}

/** No-op: audio files are cached via useOfflineSync, not here. */
export async function prefetchAudioFiles(urls: string[]): Promise<void> {
    // best-effort no-op
}

/** No-op: check if cached. */
export async function getCachedAudioUriIfExists(url: string): Promise<string | null> {
    return url; // Assume URL is accessible
}
