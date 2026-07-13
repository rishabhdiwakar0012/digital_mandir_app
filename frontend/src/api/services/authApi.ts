import { apiClient } from '../client';
import { config } from '../../config';
import { secureStorage } from '../../utils/storage';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
  SendEmailOtpRequest,
  SendEmailOtpResponse,
  VerifyEmailOtpRequest,
  VerifyEmailOtpResponse,
  GoogleAuthRequest,
  GoogleAuthResponse,
  User,
  AuthTokens,
} from '../../types';

const maskEmail = (email?: string): string => {
  if (!email || !email.includes('@')) return 'invalid-email';
  const [name, domain] = email.split('@');
  if (!name || !domain) return 'invalid-email';
  if (name.length <= 2) return `${name[0] || '*'}***@${domain}`;
  return `${name.slice(0, 2)}***@${domain}`;
};

/**
 * Authentication API service
 * Following Interface Segregation - focused on auth operations
 */
export const authApi = {
  /**
   * Login with email and password
   */
  login: (data: LoginRequest): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>('/auth/login', data);
  },

  /**
   * Register a new user
   */
  register: (data: RegisterRequest): Promise<RegisterResponse> => {
    return apiClient.post<RegisterResponse>('/auth/register', data);
  },

  /**
   * Refresh access token
   */
  refreshToken: (data: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
    return apiClient.post<RefreshTokenResponse>('/auth/refresh', data);
  },

  /**
   * Logout current user
   */
  logout: (): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/auth/logout');
  },

  /**
   * Get current user info (Profile)
   */
  getCurrentUser: (): Promise<{ message?: string; profile?: User; user?: User }> => {
    // Note: backend GET /user/profile returns { profile: ... }, but login might use auth/me.
    // Handling both for safe compatibility.
    return apiClient.get('/user/profile');
  },

  /**
   * Update user profile
   */
  updateProfile: (data: Partial<User>): Promise<{ message: string; profile: User }> => {
    return apiClient.patch<{ message: string; profile: User }>('/user/profile', data);
  },

  /**
   * Update user email with OTP
   */
  updateEmail: (data: { email: string; otp: string }): Promise<{ message: string; profile: User }> => {
    return apiClient.patch<{ message: string; profile: User }>('/user/email', data);
  },

  /**
   * Delete user account
   */
  deleteAccount: (): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>('/user/account');
  },

  /**
   * Change password
   */
  changePassword: (data: ChangePasswordRequest): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/auth/change-password', data);
  },

  /**
   * Request password reset
   */
  forgotPassword: (data: ForgotPasswordRequest): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/auth/forgot-password', data);
  },

  /**
   * Reset password with token
   */
  resetPassword: (data: ResetPasswordRequest): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/auth/reset-password', data);
  },

  /**
   * Send OTP to phone number
   */
  sendOtp: (data: SendOtpRequest): Promise<SendOtpResponse> => {
    return apiClient.post<SendOtpResponse>('/auth/send-otp', data);
  },

  /**
   * Verify OTP and login/register
   */
  verifyOtp: (data: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
    return apiClient.post<VerifyOtpResponse>('/auth/verify-otp', data);
  },

  // ─── Email OTP Endpoints ─────────────────────────────────────

  /**
   * Send OTP to email address
   */
  sendEmailOtp: (data: SendEmailOtpRequest): Promise<SendEmailOtpResponse> => {
    const maskedEmail = maskEmail(data.email?.toLowerCase().trim());
    console.log('[authApi] sendEmailOtp:start', { email: maskedEmail, purpose: data.purpose || 'register' });
    return apiClient
      .post<SendEmailOtpResponse>('/auth/send-email-otp', data)
      .then((response) => {
        console.log('[authApi] sendEmailOtp:success', { email: maskedEmail });
        return response;
      })
      .catch((error: any) => {
        // Handle different error types
        const errorMessage = error?.message || JSON.stringify(error) || 'Unknown error';
        const errorStatusCode = error?.statusCode || error?.response?.status || 'unknown';
        const errorPath = error?.path || error?.config?.url || 'unknown';
        
        console.error('[authApi] sendEmailOtp:error', {
          email: maskedEmail,
          message: errorMessage,
          statusCode: errorStatusCode,
          path: errorPath,
          fullError: error,
        });
        throw error;
      });
  },

  /**
   * Verify email OTP and login/register
   */
  verifyEmailOtp: (data: VerifyEmailOtpRequest): Promise<VerifyEmailOtpResponse> => {
    const maskedEmail = maskEmail(data.email?.toLowerCase().trim());
    console.log('[authApi] verifyEmailOtp:start', {
      email: maskedEmail,
      otpLength: data.otp?.length || 0,
    });
    return apiClient
      .post<VerifyEmailOtpResponse>('/auth/verify-email-otp', data)
      .then((response: any) => {
        console.log('[authApi] verifyEmailOtp:success', {
          email: maskedEmail,
          isNewUser: !!response?.isNewUser,
        });
        return response;
      })
      .catch((error: any) => {
        // Handle different error types
        const errorMessage = error?.message || JSON.stringify(error) || 'Unknown error';
        const errorStatusCode = error?.statusCode || error?.response?.status || 'unknown';
        const errorPath = error?.path || error?.config?.url || 'unknown';
        
        console.error('[authApi] verifyEmailOtp:error', {
          email: maskedEmail,
          message: errorMessage,
          statusCode: errorStatusCode,
          path: errorPath,
          fullError: error,
        });
        throw error;
      });
  },

  // ─── Google OAuth Endpoint ───────────────────────────────────

  /**
   * Authenticate with Google
   */
  googleAuth: (data: GoogleAuthRequest): Promise<GoogleAuthResponse> => {
    return apiClient.post<GoogleAuthResponse>('/auth/google', data);
  },

  /**
   * Upload File
   */
  uploadFile: async (data: FormData): Promise<{ filename: string; originalName: string; size: number; mimetype: string; url: string }> => {
    // In React Native, native fetch handles FormData boundaries correctly
    const tokens = await secureStorage.getObject<AuthTokens>(config.storage.tokenKey);

    console.log('[authApi] uploadFile: token check', {
      hasTokens: !!tokens,
      hasAccessToken: !!tokens?.accessToken,
      accessTokenPrefix: tokens?.accessToken?.substring(0, 20),
    });

    const doUpload = async (accessToken: string) => {
      return fetch(`${config.api.baseUrl}/upload`, {
        method: 'POST',
        body: data,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          // Intentionally NOT setting Content-Type so fetch calculates the multipart boundary
        },
      });
    };

    if (!tokens?.accessToken) {
      throw { message: 'Not authenticated. Please log in again.', statusCode: 401, path: '/upload', success: false };
    }

    let response = await doUpload(tokens.accessToken);

    // If 401, try refreshing the token once and retry
    if (response.status === 401 && tokens.refreshToken) {
      console.log('[authApi] uploadFile: 401 received, attempting token refresh...');
      try {
        const refreshResponse = await fetch(`${config.api.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });
        if (refreshResponse.ok) {
          const refreshResult = await refreshResponse.json();
          const newTokens: AuthTokens = refreshResult.data || refreshResult;
          if (newTokens?.accessToken) {
            await secureStorage.setObject(config.storage.tokenKey, newTokens);
            console.log('[authApi] uploadFile: token refreshed, retrying upload...');
            response = await doUpload(newTokens.accessToken);
          }
        }
      } catch (refreshError) {
        console.error('[authApi] uploadFile: token refresh failed', refreshError);
      }
    }

    if (!response.ok) {
      let errorBody: any = {};
      try { errorBody = await response.json(); } catch {}
      console.error('[authApi] uploadFile: upload failed', { status: response.status, body: errorBody });
      throw {
        message: errorBody?.message || 'Upload request failed',
        statusCode: response.status,
        path: '/upload',
        success: false,
      };
    }

    const result = await response.json();
    // TransformInterceptor wraps response in { data: T, success: true }
    return result.data;
  },
};
