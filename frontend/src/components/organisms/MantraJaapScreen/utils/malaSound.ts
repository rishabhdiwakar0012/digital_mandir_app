import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { getCachedAudioUri } from '../../../../utils/audioCache';

// ---------------------------------------------------------------------------
// Module-level singleton for the mantra recitation audio player.
// Plays the audioUrl uploaded via admin. If no URL → nothing plays.
// The COMPONENT controls play/pause — this module only manages the player.
// ---------------------------------------------------------------------------

let malaPlayer: AudioPlayer | null = null;
let loadedUri: string = '';
let loadToken: number = 0;

const VOLUME = 0.8;

function tearDown(): void {
    loadToken++;          // cancel any in-flight preloadMalaSound call
    loadedUri = '';
    if (malaPlayer) {
        // Set volume to 0 first, then pause, then release — belt-and-suspenders stop
        try { malaPlayer.volume = 0; } catch { /* ignore */ }
        try { malaPlayer.pause(); } catch { /* ignore */ }
        try { malaPlayer.remove(); } catch { /* ignore */ }
        malaPlayer = null;
    }
}

/**
 * Preload the mantra audio from the given URL — does NOT auto-play.
 * Call playMalaSound() explicitly when you want sound to start.
 * If audioUrl is empty/null the existing player is cleaned up.
 */
export async function preloadMalaSound(audioUrl?: string | null): Promise<void> {
    const targetUri = audioUrl?.trim() ?? '';

    if (!targetUri) {
        tearDown();
        return;
    }

    // Same source already loaded — nothing to do.
    if (malaPlayer && loadedUri === targetUri) {
        return;
    }

    tearDown();

    const myToken = ++loadToken;
    loadedUri = targetUri;

    try {
        await setAudioModeAsync({ playsInSilentMode: true });
        if (myToken !== loadToken) return;

        // Prefer local cache (works offline), fall back to URL
        let resolvedUri = targetUri;
        try { resolvedUri = await getCachedAudioUri(targetUri); } catch { /* use URL */ }
        if (myToken !== loadToken) return;

        const player = createAudioPlayer({ uri: resolvedUri });
        player.volume = VOLUME;
        player.loop = true;

        if (myToken !== loadToken) {
            try { player.pause(); player.remove(); } catch { /* ignore */ }
            return;
        }

        malaPlayer = player;
        // Immediately pause to ensure player doesn't auto-start.
        // Component calls playMalaSound() explicitly on first bead tap.
        try { player.pause(); } catch { /* ignore */ }
    } catch (error) {
        console.error('❌ Failed to load mantra audio:', error);
        if (myToken === loadToken) tearDown();
    }
}

/** Start / resume playback. Call on first mala tap or when user unmutes. */
export function playMalaSound(): void {
    if (!malaPlayer) return;
    try {
        malaPlayer.volume = VOLUME;
        malaPlayer.play();
    } catch (error) {
        console.error('❌ playMalaSound error:', error);
    }
}

/** Pause playback. Volume set to 0 first for instant native silence. */
export function pauseMalaSound(): void {
    if (!malaPlayer) return;
    try {
        malaPlayer.volume = 0;
        malaPlayer.pause();
    } catch (error) {
        console.error('❌ pauseMalaSound error:', error);
    }
}

/** Fully release the player — call from screen unmount cleanup. */
export function unloadMalaSound(): void {
    tearDown();
}
