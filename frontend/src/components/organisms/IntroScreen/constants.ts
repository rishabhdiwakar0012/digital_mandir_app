/**
 * Intro Screen Configuration Constants
 * Following DRY principle - all configurable values in one place
 */
export const INTRO_CONFIG = {
    // Logo dimensions (same as splash screen for consistency)
    logoWidth: 100,
    logoHeight: 118,

    // Pandit image dimensions
    panditWidth: 380,
    panditHeight: 570,

    // Brand information
    brandName: 'DigitalMandir.in',

    // Animation durations (for future use)
    animationDuration: 2000,
    fadeOutDuration: 500,
} as const;

export type IntroConfig = typeof INTRO_CONFIG;
