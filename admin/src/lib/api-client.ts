import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000, // 60 second timeout for normal requests
});

let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void, reject: (reason?: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Attach token from cookie/session on client side
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) {
      config.headers.Authorization = 'Bearer ' + token;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    // Unwrap the backend TransformInterceptor envelope { success, data, timestamp, path }
    if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const requestUrl = originalRequest.url || '';
      // Don't clear token on auth endpoints (like login/refresh that naturally fail)
      const isAuthRequest = requestUrl.includes('/auth/');
      const hadToken = !!localStorage.getItem('admin_token');

      if (!isAuthRequest && hadToken && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = 'Bearer ' + token;
              return apiClient(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem('admin_refresh_token');
          if (!refreshToken) throw new Error('No refresh token available');

          const response = await axios.post(API_URL + '/auth/refresh', { refreshToken });
          
          const newAccessToken = response.data?.data?.accessToken ?? response.data?.accessToken;
          const newRefreshToken = response.data?.data?.refreshToken ?? response.data?.refreshToken;
          
          if (!newAccessToken) throw new Error('Refresh failed to provide new access token');
          
          localStorage.setItem('admin_token', newAccessToken);
          if (newRefreshToken) {
             localStorage.setItem('admin_refresh_token', newRefreshToken);
          }

          apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
          originalRequest.headers.Authorization = 'Bearer ' + newAccessToken;

          processQueue(null, newAccessToken);
          isRefreshing = false;

          return apiClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;
          
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_refresh_token');
          localStorage.removeItem('admin_user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else if (!isAuthRequest && hadToken) {
        // If it was already retried or we don't have token
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('admin_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

