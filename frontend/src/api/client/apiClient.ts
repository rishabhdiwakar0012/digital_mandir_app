import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  InternalAxiosRequestConfig,
} from 'axios';
import { config } from '../../config';
import { secureStorage } from '../../utils/storage';
import { sanitizeObject } from '../../utils/sanitization';
import { AuthTokens, ApiError } from '../../types';

// Extend Axios types for retry functionality
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Module-level callback invoked when token refresh fails (e.g. to clear auth and navigate to login)
let _onAuthFailure: (() => void) | null = null;
export function setAuthFailureHandler(handler: () => void) {
  _onAuthFailure = handler;
}

/**
 * API Client with automatic token management
 * Following Single Responsibility - handles HTTP communication
 */
class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: config.api.baseUrl,
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (axiosConfig: InternalAxiosRequestConfig) => {
        const tokens = await secureStorage.getObject<AuthTokens>(
          config.storage.tokenKey
        );

        if (tokens?.accessToken) {
          axiosConfig.headers.Authorization = `Bearer ${tokens.accessToken}`;
        }

        const isFormData = axiosConfig.data instanceof FormData || (axiosConfig.data && typeof axiosConfig.data.append === 'function');
        // Sanitize request data (skip for FormData or file uploads)
        if (axiosConfig.data && typeof axiosConfig.data === 'object' && !isFormData) {
          axiosConfig.data = sanitizeObject(axiosConfig.data);
        }

        return axiosConfig;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as ExtendedAxiosRequestConfig;

        // If 401 and not already retrying
        if (error.response?.status === 401 && !originalRequest._retry) {
          // Don't attempt token refresh for auth endpoints — they don't require
          // a stored token and a 401 means the credentials themselves are wrong.
          const url = originalRequest.url || '';
          const isAuthEndpoint = /\/auth\/(login|google|register|refresh|admin)/.test(url);
          if (isAuthEndpoint) {
            return Promise.reject(this.formatError(error));
          }

          if (this.isRefreshing) {
            // Queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => this.client(originalRequest))
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newTokens = await this.refreshToken();
            this.processQueue(null);

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError);
            // Clear tokens and notify auth failure handler (e.g. navigate to login)
            await secureStorage.removeItem(config.storage.tokenKey);
            await secureStorage.removeItem(config.storage.userKey);
            _onAuthFailure?.();
            throw refreshError;
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  private processQueue(error: any): void {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve(null);
      }
    });
    this.failedQueue = [];
  }

  private async refreshToken(): Promise<AuthTokens> {
    const tokens = await secureStorage.getObject<AuthTokens>(
      config.storage.tokenKey
    );

    if (!tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post<{ data: AuthTokens }>(
      `${config.api.baseUrl}/auth/refresh`,
      { refreshToken: tokens.refreshToken }
    );

    const newTokens = response.data.data;
    await secureStorage.setObject(config.storage.tokenKey, newTokens);

    return newTokens;
  }

  private formatError(error: AxiosError<ApiError>): ApiError {
    if (error.response?.data) {
      return error.response.data;
    }

    return {
      success: false,
      statusCode: error.response?.status || 500,
      message: error.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      path: error.config?.url || '',
    };
  }

  // HTTP Methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<{ data: T }>(url, config);
    return response.data.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const isFormData = data instanceof FormData || (data && typeof data.append === 'function');

    // For FormData in React Native, explicitly specify 'multipart/form-data' to let network layer add boundary
    if (isFormData) {
      const formDataConfig: AxiosRequestConfig = {
        ...config,
        headers: {
          ...config?.headers,
          'Content-Type': 'multipart/form-data',
        },
      };
      const response = await this.client.post<{ data: T }>(url, data, formDataConfig);
      return response.data.data;
    }

    const response = await this.client.post<{ data: T }>(url, data, config);
    return response.data.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<{ data: T }>(url, data, config);
    return response.data.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<{ data: T }>(url, data, config);
    return response.data.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<{ data: T }>(url, config);
    return response.data.data;
  }
}

export const apiClient = new ApiClient();
