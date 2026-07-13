import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { deviceApi } from '../api/services/deviceApi';
import {
  configureForegroundNotifications,
  requestNotificationPermissions,
  getPushToken,
  getDeviceId,
  getDeviceInfo,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  getLastNotificationResponse,
} from '../services/notificationService';

/**
 * Hook that manages the full push notification lifecycle:
 * 1. Requests permission when user is authenticated
 * 2. Gets push token and registers device with the backend
 * 3. Listens for foreground and tapped notifications
 * 4. Updates the notification count in the app store
 *
 * Should be called once at the app root level (e.g., in RootNavigator or App.tsx)
 */
export function useNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setNotificationCount = useAppStore((s) => s.setNotificationCount);
  const hasRegistered = useRef(false);

  const registerDevice = useCallback(async () => {
    if (hasRegistered.current) return;

    try {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        console.log('[useNotifications] Permission not granted, skipping registration');
        return;
      }

      const pushToken = await getPushToken();
      const deviceId = await getDeviceId();
      const deviceInfo = getDeviceInfo();

      await deviceApi.registerDevice({
        deviceId,
        platform: deviceInfo.platform,
        osVersion: deviceInfo.osVersion,
        appVersion: deviceInfo.appVersion,
        deviceModel: deviceInfo.deviceModel,
        fcmToken: pushToken,
      });

      // Only mark as registered if we actually have a valid push token.
      // If token is null (Firebase not ready yet), leave hasRegistered=false
      // so we retry on next app foreground/login.
      if (pushToken) {
        hasRegistered.current = true;
        console.log('[useNotifications] Device registered with token:', pushToken.substring(0, 40) + '...');
      } else {
        // console.log('[useNotifications] Registered device but push token was null — will retry');
      }
    } catch (error) {
      console.error('[useNotifications] Failed to register device:', error);
    }
  }, []);

  // Register device when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      registerDevice();
    } else {
      // Reset on logout so we re-register on next login
      hasRegistered.current = false;
    }
  }, [isAuthenticated, registerDevice]);

  // Retry registration when app comes to foreground (handles case where
  // Firebase initializes slightly after the first registration attempt)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active' && !hasRegistered.current) {
        registerDevice();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isAuthenticated, registerDevice]);

  // Set up notification listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    // Listener: notification received while app is in the foreground.
    // Use getState() to read current count to avoid stale closure and
    // prevent this effect from re-running every time notificationCount changes.
    const receivedSubscription = addNotificationReceivedListener((notification) => {
      console.log('[useNotifications] Notification received in foreground:', notification.request.content.title);
      const currentCount = useAppStore.getState().notificationCount;
      setNotificationCount(currentCount + 1);
    });

    // Listener: user tapped on a notification
    const responseSubscription = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      console.log('[useNotifications] Notification tapped, data:', data);

      // Handle notification tap based on data.type
      // e.g., navigate to a specific screen based on notification category
      if (data?.type === 'mala_reminder') {
        // Could navigate to jaap screen — handled by navigation layer
        console.log('[useNotifications] Mala reminder notification tapped');
      } else if (data?.type === 'streak_reminder') {
        console.log('[useNotifications] Streak reminder notification tapped');
      }
    });

    // Check if the app was opened by a notification (cold start)
    getLastNotificationResponse().then((response) => {
      if (response) {
        console.log('[useNotifications] App opened from notification:', response.notification.request.content.data);
      }
    });

    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, [isAuthenticated, setNotificationCount]);
}
