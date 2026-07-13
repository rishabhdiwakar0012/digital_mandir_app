import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../services';
import { useAuthStore } from '../../store/authStore';
import { secureStorage } from '../../utils/storage';
import { config } from '../../config';
import { googleSignOut } from '../../hooks/useGoogleSignIn';
import {
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  SendOtpRequest,
  VerifyOtpRequest,
  SendEmailOtpRequest,
  VerifyEmailOtpRequest,
  GoogleAuthRequest,
} from '../../types';

// Query Keys
export const authKeys = {
  all: ['auth'] as const,
  user: () => [...authKeys.all, 'user'] as const,
};

/**
 * Hook to get current user
 */
export function useCurrentUser() {
  const { isAuthenticated } = useAuthStore();

  const storeUser = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: authKeys.user(),
    queryFn: () => authApi.getCurrentUser(),
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000, // 10 minutes — serve from cache longer
    gcTime: 30 * 60 * 1000,    // Keep in cache 30 minutes
    // Serve cached store user instantly while fresh data loads in background
    initialData: storeUser
      ? ({ profile: storeUser } as any)
      : undefined,
    initialDataUpdatedAt: 0,   // Mark as stale so background refetch still runs
  });
}

/**
 * Hook for login
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const { setAuth, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: async (response) => {
      const { user, accessToken, refreshToken, expiresIn, tokenType } = response;

      // Store tokens securely
      await secureStorage.setObject(config.storage.tokenKey, {
        accessToken,
        refreshToken,
        expiresIn,
        tokenType,
      });

      // Store user data
      await secureStorage.setObject(config.storage.userKey, user);

      // Update auth state
      setAuth(user, { accessToken, refreshToken, expiresIn, tokenType });

      // Invalidate user query
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
    onSettled: () => {
      setLoading(false);
    },
  });
}

/**
 * Hook for registration
 */
export function useRegister() {
  const { setLoading } = useAuthStore();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onMutate: () => {
      setLoading(true);
    },
    onSettled: () => {
      setLoading(false);
    },
  });
}

/**
 * Hook for logout
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: async () => {
      // Disconnect Google session so the account picker shows on next login
      await googleSignOut();

      // Clear stored data
      await secureStorage.removeItem(config.storage.tokenKey);
      await secureStorage.removeItem(config.storage.userKey);

      // Clear auth state
      clearAuth();

      // Clear all queries
      queryClient.clear();
    },
    onError: async () => {
      // Disconnect Google session even on error
      await googleSignOut();

      // Even on error, clear local data
      await secureStorage.removeItem(config.storage.tokenKey);
      await secureStorage.removeItem(config.storage.userKey);
      clearAuth();
      queryClient.clear();
    },
  });
}

/**
 * Hook to update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: Partial<any>) => authApi.updateProfile(data),
    onSuccess: async (response) => {
      console.log('[useUpdateProfile] onSuccess response:', JSON.stringify(response));
      // The backend returns { message: 'Profile updated successfully', profile: ... }
      const updatedUser = response?.profile ?? (response as any)?.data?.profile;
      console.log('[useUpdateProfile] updatedUser:', JSON.stringify(updatedUser));

      if (updatedUser) {
        // Update user data in secure storage
        await secureStorage.setObject(config.storage.userKey, updatedUser);

        // Update auth state (doesn't refresh token, just updates user object)
        setUser(updatedUser);

        // Also immediately update the React Query cache so the ProfileScreen re-renders
        queryClient.setQueryData(authKeys.user(), { profile: updatedUser });
          console.log('[useUpdateProfile] storeUser updated: favoriteDeity=', (updatedUser as any).favoriteDeity);
      } else {
        console.warn('[useUpdateProfile] updatedUser is empty - storeUser NOT updated!');
      }

      // Invalidate to trigger a background refetch for full freshness
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
    onError: (error: any) => {
      console.error('[useUpdateProfile] ERROR:', JSON.stringify(error));
    },
  });
}

/**
 * Hook to update email
 */
export function useUpdateEmail() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: { email: string; otp: string }) => authApi.updateEmail(data),
    onSuccess: async (response) => {
      const updatedUser = response?.profile || (response as any)?.data?.profile;
      if (updatedUser) {
        await secureStorage.setObject(config.storage.userKey, updatedUser);
        setUser(updatedUser);
        queryClient.setQueryData(authKeys.user(), { profile: updatedUser });
      }
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
  });
}

/**
 * Hook to delete user account
 */
export function useDeleteAccount() {
  const { mutateAsync: logout } = useLogout();

  return useMutation({
    mutationFn: () => authApi.deleteAccount(),
    onSuccess: async () => {
      // After successfully deleting the account, log the user out directly
      await logout();
    },
  });
}

/**
 * Hook for changing password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => authApi.changePassword(data),
  });
}

/**
 * Hook for forgot password
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) => authApi.forgotPassword(data),
  });
}

/**
 * Hook for reset password
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => authApi.resetPassword(data),
  });
}

/**
 * Hook for sending OTP to phone number
 */
export function useSendOtp() {
  return useMutation({
    mutationFn: (data: SendOtpRequest) => authApi.sendOtp(data),
  });
}

/**
 * Hook for verifying OTP (handles both login and registration)
 * On success: stores tokens securely, updates auth state
 */
export function useVerifyOtp() {
  const queryClient = useQueryClient();
  const { setAuth, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: (data: VerifyOtpRequest) => authApi.verifyOtp(data),
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: async (response) => {
      const { user, accessToken, refreshToken, expiresIn, tokenType } = response;

      // Store tokens securely
      await secureStorage.setObject(config.storage.tokenKey, {
        accessToken,
        refreshToken,
        expiresIn,
        tokenType,
      });

      // Store user data
      await secureStorage.setObject(config.storage.userKey, user);

      // Update auth state (sets isAuthenticated = true)
      setAuth(user, { accessToken, refreshToken, expiresIn, tokenType });

      // Invalidate user query
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
    onSettled: () => {
      setLoading(false);
    },
  });
}

// ─── Email OTP Hooks ─────────────────────────────────────────

/**
 * Hook for sending OTP to email address
 */
export function useSendEmailOtp() {
  return useMutation({
    mutationFn: (data: SendEmailOtpRequest) => authApi.sendEmailOtp(data),
  });
}

/**
 * Hook for verifying email OTP (handles both login and registration)
 * On success: stores tokens securely, updates auth state
 */
export function useVerifyEmailOtp() {
  const queryClient = useQueryClient();
  const { setAuth, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: (data: VerifyEmailOtpRequest) => authApi.verifyEmailOtp(data),
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: async (response) => {
      const { user, accessToken, refreshToken, expiresIn, tokenType } = response;

      // Store tokens securely
      await secureStorage.setObject(config.storage.tokenKey, {
        accessToken,
        refreshToken,
        expiresIn,
        tokenType,
      });

      // Store user data
      await secureStorage.setObject(config.storage.userKey, user);

      // Update auth state (sets isAuthenticated = true)
      setAuth(user, { accessToken, refreshToken, expiresIn, tokenType });

      // Invalidate user query
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
    onSettled: () => {
      setLoading(false);
    },
  });
}

/**
 * Hook for verifying email OTP WITHOUT setting auth state.
 * Used by RegisterScreen so the user can complete profile steps
 * before being redirected to the main app.
 */
export function useVerifyEmailOtpRaw() {
  return useMutation({
    mutationFn: (data: VerifyEmailOtpRequest) => authApi.verifyEmailOtp(data),
  });
}

/**
 * Hook for Google authentication WITHOUT automatically setting auth state.
 * Used by RegisterScreen so new users can complete profile setup steps
 * (name, gender, DOB) before being navigated to the main app.
 * Existing users are handled by the caller after inspecting isNewUser.
 */
export function useGoogleAuthRaw() {
  return useMutation({
    mutationFn: (data: GoogleAuthRequest) => authApi.googleAuth(data),
  });
}

// ─── Google OAuth Hook ───────────────────────────────────────

/**
 * Hook for Google authentication
 * On success: stores tokens securely, updates auth state
 */
export function useGoogleAuth() {
  const queryClient = useQueryClient();
  const { setAuth, setLoading } = useAuthStore();

  return useMutation({
    mutationFn: (data: GoogleAuthRequest) => authApi.googleAuth(data),
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: async (response) => {
      const { user, accessToken, refreshToken, expiresIn, tokenType } = response;

      // Store tokens securely
      await secureStorage.setObject(config.storage.tokenKey, {
        accessToken,
        refreshToken,
        expiresIn,
        tokenType,
      });

      // Store user data
      await secureStorage.setObject(config.storage.userKey, user);

      // Update auth state (sets isAuthenticated = true)
      setAuth(user, { accessToken, refreshToken, expiresIn, tokenType });

      // Invalidate user query
      queryClient.invalidateQueries({ queryKey: authKeys.user() });
    },
    onSettled: () => {
      setLoading(false);
    },
  });
}
