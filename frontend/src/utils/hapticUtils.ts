/**
 * Haptic utility — simple drop-in wrapper around expo-haptics.
 * Always fires. No global preference management here.
 *
 * Per-screen vibration toggles (e.g. MantraJaapScreen) should manage
 * their own local state and guard calls themselves with an `if (enabled)` check.
 *
 * Usage:
 *   import * as hapticUtils from '../utils/hapticUtils';
 *   hapticUtils.impactAsync(hapticUtils.ImpactFeedbackStyle.Light);
 */
import * as Haptics from 'expo-haptics';

export const impactAsync = (style: Haptics.ImpactFeedbackStyle): void => {
    Haptics.impactAsync(style);
};

export const notificationAsync = (type: Haptics.NotificationFeedbackType): void => {
    Haptics.notificationAsync(type);
};

export const selectionAsync = (): void => {
    Haptics.selectionAsync();
};

// Re-export enums so callers can use hapticUtils.ImpactFeedbackStyle etc.
export { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics';
