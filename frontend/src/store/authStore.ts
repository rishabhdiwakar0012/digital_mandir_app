import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthTokens, AuthState } from '../types';

interface AuthStore extends AuthState {
  // Actions
  setAuth: (user: User, tokens: AuthTokens) => void;
  setUser: (user: User) => void;
  setTokens: (tokens: AuthTokens) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
  
  // Hydration
  hydrate: () => Promise<void>;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
};

/**
 * Auth store using Zustand
 * Following Single Responsibility - manages only auth state
 */
export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        _hasHydrated: false,

        setAuth: (user, tokens) =>
          set({
            user,
            tokens,
            isAuthenticated: true,
            isLoading: false,
          }),

        setUser: (user) =>
          set({
            user,
          }),

        setTokens: (tokens) =>
          set({
            tokens,
          }),

        setLoading: (isLoading) =>
          set({
            isLoading,
          }),

        clearAuth: () =>
          set({
            ...initialState,
          }),

        hydrate: async () => {
          // Hydration is handled by persist middleware
          set({ _hasHydrated: true });
        },

        setHasHydrated: (state) => {
          set({ _hasHydrated: state });
        },
      }),
      {
        name: 'auth-storage',
        storage: createJSONStorage(() => AsyncStorage),
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true);
        },
        partialize: (state) => ({
          user: state.user,
          tokens: state.tokens,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);

// Selector hooks for performance optimization
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useUser = () => useAuthStore((state) => state.user);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
