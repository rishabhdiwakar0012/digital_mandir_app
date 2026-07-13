import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';

// Sound pool for instant, overlap-capable playback
const POOL_SIZE = 4;
let soundPool: AudioPlayer[] = [];
let currentPoolIndex = 0;
let isLoaded = false;

/**
 * Generate a tiny WAV click/tick sound as a base64 string.
 */
function generateClickWavBase64(): string {
    const sampleRate = 44100;
    const durationMs = 15;
    const numSamples = Math.floor(sampleRate * (durationMs / 1000));
    const bytesPerSample = 2;
    const dataSize = numSamples * bytesPerSample;
    const headerSize = 44;
    const fileSize = headerSize + dataSize;

    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);

    const writeStr = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    };

    writeStr(0, 'RIFF');
    view.setUint32(4, fileSize - 8, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * bytesPerSample, true);
    view.setUint16(32, bytesPerSample, true);
    view.setUint16(34, 16, true);
    writeStr(36, 'data');
    view.setUint32(40, dataSize, true);

    for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const envelope = Math.exp(-t * 400);
        const frequency = 800 + (2000 * Math.exp(-t * 200));
        const sample = Math.sin(2 * Math.PI * frequency * t) * envelope;
        const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767 * 0.7)));
        view.setInt16(headerSize + i * bytesPerSample, intSample, true);
    }

    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return typeof btoa === 'function'
        ? btoa(binary)
        : Buffer.from(binary, 'binary').toString('base64');
}

/**
 * Preload a pool of click sounds for instant zero-latency playback.
 */
export async function preloadClickSound(): Promise<void> {
    if (isLoaded) return;

    try {
        await setAudioModeAsync({
            playsInSilentMode: true,
        });

        const base64Wav = generateClickWavBase64();
        const dataUri = `data:audio/wav;base64,${base64Wav}`;

        // Create a pool of pre-loaded AudioPlayer instances
        for (let i = 0; i < POOL_SIZE; i++) {
            const player = createAudioPlayer({ uri: dataUri });
            player.volume = 0.6;
            player.loop = false; // explicitly disable looping
            soundPool.push(player);
        }

        isLoaded = true;
    } catch (error) {
        console.warn('Failed to preload click sound:', error);
    }
}

/**
 * Play click sound instantly using round-robin pool.
 * Fire-and-forget — no awaiting needed in the caller.
 */
export function playClickSound(): void {
    if (soundPool.length === 0) return;

    // Grab next player from the pool (round-robin)
    const player = soundPool[currentPoolIndex];
    currentPoolIndex = (currentPoolIndex + 1) % POOL_SIZE;

    // Seek to start and play — equivalent to the old replayAsync()
    player.seekTo(0);
    player.play();
}

/**
 * Stop all currently playing click sounds.
 */
export function stopClickSound(): void {
    for (const player of soundPool) {
        try {
            player.pause();
            player.seekTo(0);
        } catch { }
    }
}

/**
 * Cleanup on unmount.
 */
export async function unloadClickSound(): Promise<void> {
    for (const player of soundPool) {
        try {
            player.remove();
        } catch { }
    }
    soundPool = [];
    isLoaded = false;
}
