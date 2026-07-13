import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = 'device_unique_id';

/**
 * True when running inside Expo Go (SDK 53+ removed remote notification support).
 * All push notification features are skipped in this environment.
 */
const IS_EXPO_GO = Constants.appOwnership === 'expo';

/**
 * Configure how notifications are presented when the app is in the foreground.
 * This must be called early in the app lifecycle (e.g., App.tsx).
 * No-op in Expo Go where notification support was removed in SDK 53.
 */
export function configureForegroundNotifications() {
  if (IS_EXPO_GO) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Request notification permissions from the user.
 * On Android, also sets up a default notification channel.
 * @returns granted — whether the user granted permission
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  // Expo Go (SDK 53+): push notifications are not supported
  if (IS_EXPO_GO) {
    console.log('[Notifications] Skipping push notifications — not supported in Expo Go');
    return false;
  }

  // Physical device check
  if (!Device.isDevice) {
    console.warn('[Notifications] Push notifications require a physical device');
    return false;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Notifications] Permission not granted');
    return false;
  }

  // Set up Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF9933',
      enableLights: true,
    });
  }

  return true;
}

/**
 * Get the push token for this device.
 * - Tries Expo push token first (works with Expo Go and EAS builds).
 * - Falls back to raw device push token (native FCM on Android, APNs on iOS)
 *   for local Gradle/Xcode builds that are not registered with EAS.
 * The backend handles both formats automatically.
 */
export async function getPushToken(): Promise<string | null> {
  if (IS_EXPO_GO) return null;

  // Try Expo push token (preferred — routes through Expo's push service)
  try {
    // projectId can come from app.json extra.eas.projectId OR from the EAS
    // build manifest (Constants.easConfig). Pass it explicitly so the call
    // never silently falls through to an empty-options path that would throw.
    const projectId =
      (Constants.easConfig as any)?.projectId ??
      Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      // Silently fall back to FCM if no Expo projectId is set.
      throw new Error('ERR_NOTIFICATIONS_NO_EXPERIENCE_ID');
    }

    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (expoError) {
    // Silently continue to FCM fallback
  }

  // Fallback: raw device push token (native FCM on Android)
  try {
    const token = await Notifications.getDevicePushTokenAsync();
    return typeof token.data === 'string' ? token.data : null;
  } catch (error) {
    // If Firebase isn't initialized, don't throw a loud error, just return null.
    // console.log('[Notifications] Push token unavailable (requires EAS or Firebase config)');
    return null;
  }
}

/**
 * Get or generate a persistent unique device ID.
 * Stored in AsyncStorage so it survives app restarts but not reinstalls.
 */
export async function getDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    // Generate a simple UUID-like identifier
    deviceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Get basic device information for registration.
 */
export function getDeviceInfo() {
  return {
    platform: Platform.OS as 'ios' | 'android' | 'web',
    osVersion: Platform.Version?.toString() || null,
    deviceModel: Device.modelName || null,
    appVersion: Constants.expoConfig?.version || null,
  };
}

/**
 * Add a listener for notifications received while app is in the foreground.
 * @returns Subscription object (call .remove() to unsubscribe)
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void,
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add a listener for when the user taps on a notification.
 * @returns Subscription object (call .remove() to unsubscribe)
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Get the notification that was used to open the app (if any).
 * Useful for handling cold-start deep links from notifications.
 */
export async function getLastNotificationResponse() {
  return Notifications.getLastNotificationResponseAsync();
}
