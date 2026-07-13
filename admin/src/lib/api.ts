import apiClient from './api-client';

// ─── Upload ───
export const uploadApi = {
  upload: (formData: FormData) =>
    apiClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// ─── Auth ───
export const authApi = {
  adminLogin: (data: { email: string; password: string }) =>
    apiClient.post('/auth/admin/login', data),
  sendAdminOtp: (data: { email: string }) =>
    apiClient.post('/auth/admin/send-otp', data),
  verifyAdminOtp: (data: { email: string; otp: string }) =>
    apiClient.post('/auth/admin/verify-otp', data),
  getMe: () => apiClient.get('/auth/me'),
};

// ─── Dashboard / Analytics ───
export const analyticsApi = {
  getDashboard: () => apiClient.get('/admin/analytics/dashboard'),
  getUserGrowth: (params: { period?: string; days?: number }) =>
    apiClient.get('/admin/analytics/users', { params }),
  getJaapActivity: (params: { period?: string; days?: number }) =>
    apiClient.get('/admin/analytics/jaap', { params }),
  getDeviceBreakdown: () => apiClient.get('/admin/analytics/devices'),
  getContentAnalytics: () => apiClient.get('/admin/analytics/content'),
  getGeography: () => apiClient.get('/admin/analytics/geography'),
  getAgeGroups: () => apiClient.get('/admin/analytics/age-groups'),
  getDeityJaapAnalytics: (params?: { limit?: number }) =>
    apiClient.get('/admin/analytics/deity-jaap', { params }),
};

// ─── Users ───
export const usersApi = {
  getAll: (params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => apiClient.get('/admin/users', { params }),
  getById: (id: string) => apiClient.get(`/admin/users/${id}`),
  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/admin/users/${id}`, data),
  deactivate: (id: string) => apiClient.delete(`/admin/users/${id}`),
  getDevices: (id: string) => apiClient.get(`/admin/users/${id}/devices`),
  getSessions: (id: string) => apiClient.get(`/admin/users/${id}/sessions`),
  getJaapHistory: (id: string, params?: { page?: number; limit?: number }) =>
    apiClient.get(`/admin/users/${id}/jaap-history`, { params }),
};

// ─── Content: Mantras ───
export const mantrasApi = {
  getAll: (params: {
    page?: number;
    limit?: number;
    category?: string;
    deityId?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => apiClient.get('/admin/mantras', { params }),
  getById: (id: string) => apiClient.get(`/admin/mantras/${id}`),
  create: (data: Record<string, unknown>) =>
    apiClient.post('/admin/mantras', data),
  update: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/admin/mantras/${id}`, data),
  delete: (id: string) => apiClient.delete(`/admin/mantras/${id}`),
};

// ─── Content: Deities ───
export const deitiesApi = {
  getAll: (params?: { isActive?: boolean; page?: number; limit?: number }) =>
    apiClient.get('/admin/deities', { params }),
  getById: (id: string) => apiClient.get(`/admin/deities/${id}`),
  create: (data: Record<string, unknown>) =>
    apiClient.post('/admin/deities', data),
  update: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/admin/deities/${id}`, data),
  delete: (id: string) => apiClient.delete(`/admin/deities/${id}`),
};

// ─── Content: Sections ───
export const contentApi = {
  getAll: (params: {
    page?: number;
    limit?: number;
    section?: string;
    isActive?: boolean;
    sortBy?: string;
    sortOrder?: string;
  }) => apiClient.get('/admin/content', { params }),
  getById: (id: string) => apiClient.get(`/admin/content/${id}`),
  create: (data: Record<string, unknown>) =>
    apiClient.post('/admin/content', data),
  update: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/admin/content/${id}`, data),
  delete: (id: string) => apiClient.delete(`/admin/content/${id}`),
};

// ─── Jaap / Leaderboard ───
export const jaapApi = {
  getLeaderboard: (params?: { timeFilter?: string; limit?: number; page?: number }) =>
    apiClient.get('/admin/jaap/leaderboard', { params }),
  getAnalytics: () => apiClient.get('/admin/jaap/analytics'),
};

// ─── Notifications ───
export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get('/admin/notifications', { params }),
  getById: (id: string) => apiClient.get(`/admin/notifications/${id}`),
  send: (data: Record<string, unknown>) =>
    apiClient.post('/admin/notifications', data),
};
