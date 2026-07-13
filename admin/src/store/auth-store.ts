import { create } from 'zustand';
import { authApi } from '@/lib/api';

interface AdminUser {
  _id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
}

interface AuthState {
  token: string | null;
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  fetchUser: () => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  hydrate: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_token');
      const userStr = localStorage.getItem('admin_user');
      // Clean up invalid tokens stored from previous bugs
      if (!token || token === 'undefined' || token === 'null') {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('admin_user');
        set({ token: null, user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      let user: AdminUser | null = null;
      try {
        if (userStr && userStr !== 'undefined') {
          user = JSON.parse(userStr);
        }
      } catch { /* ignore */ }
      set({ token, user, isAuthenticated: true, isLoading: false });
    }
  },

  sendOtp: async (email: string) => {
    await authApi.sendAdminOtp({ email });
  },

  verifyOtp: async (email: string, otp: string) => {
    const { data } = await authApi.verifyAdminOtp({ email, otp });
    const token = data?.data?.accessToken ?? data?.accessToken;
    const refreshToken = data?.data?.refreshToken ?? data?.refreshToken;

    if (!token) throw new Error('No access token in response');
    const user = data?.data?.user ?? data?.user ?? null;
    
    localStorage.setItem('admin_token', token);
    if (refreshToken) {
      localStorage.setItem('admin_refresh_token', refreshToken);
    }
    
    if (user) localStorage.setItem('admin_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true, isLoading: false });
  },

  fetchUser: async () => {
    try {
      const { data } = await authApi.getMe();
      const user = data?.user ?? data?.data?.user ?? data;
      if (user) {
        localStorage.setItem('admin_user', JSON.stringify(user));
        set({ user });
      }
    } catch { /* ignore - will redirect on 401 */ }
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
    set({ token: null, user: null, isAuthenticated: false });
    window.location.href = '/login';
  },
}));
