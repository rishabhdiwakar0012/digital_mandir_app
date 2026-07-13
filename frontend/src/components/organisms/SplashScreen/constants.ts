/**
 * Splash Screen Configuration Constants
 * Following DRY principle - all configurable values in one place
 */
export const SPLASH_CONFIG = {
    // Logo dimensions (matching screenshot proportions)
    logoWidth: 100,
    logoHeight: 118,

    // Pandit image dimensions
    panditWidth: 280,
    panditHeight: 420,

    // Brand information
    brandName: 'DigitalMandir.in',

    // Animation durations (for future use)
    animationDuration: 2000,
    fadeOutDuration: 500,
} as const;

export type SplashConfig = typeof SPLASH_CONFIG;
