import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface AppState {
  // Theme
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;

  // Language
  language: string;
  setLanguage: (language: string) => void;

  // Network status
  isOnline: boolean;
  setIsOnline: (isOnline: boolean) => void;

  // App state
  isInitialized: boolean;
  setIsInitialized: (initialized: boolean) => void;

  // Notifications
  hasNewNotifications: boolean;
  notificationCount: number;
  setNotificationCount: (count: number) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  theme: 'system' as ThemeMode,
  language: 'en',
  isOnline: true,
  isInitialized: false,
  hasNewNotifications: false,
  notificationCount: 0,
};

/**
 * App-wide state store
 * Manages global application state
 */
export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setTheme: (theme) => set({ theme }),

        setLanguage: (language) => set({ language }),

        setIsOnline: (isOnline) => set({ isOnline }),

        setIsInitialized: (isInitialized) => set({ isInitialized }),

        setNotificationCount: (count) =>
          set({
            notificationCount: count,
            hasNewNotifications: count > 0,
          }),

        reset: () => set(initialState),
      }),
      {
        name: 'app-storage',
        storage: createJSONStorage(() => AsyncStorage),
        partialize: (state) => ({
          theme: state.theme,
          language: state.language,
        }),
      }
    ),
    { name: 'AppStore' }
  )
);

// Selector hooks
export const useTheme = () => useAppStore((state) => state.theme);
export const useLanguage = () => useAppStore((state) => state.language);
export const useIsOnline = () => useAppStore((state) => state.isOnline);
