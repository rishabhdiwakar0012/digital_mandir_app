import { apiClient } from '../client';

export interface RegisterDeviceRequest {
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  osVersion?: string | null;
  appVersion?: string | null;
  deviceModel?: string | null;
  fcmToken?: string | null;
}

export interface UpdateFcmTokenRequest {
  deviceId: string;
  fcmToken: string;
}

export interface DeviceResponse {
  _id: string;
  userId: string;
  deviceId: string;
  platform: string;
  fcmToken?: string;
  osVersion?: string;
  appVersion?: string;
  deviceModel?: string;
  lastActiveAt?: string;
}

/**
 * Device registration API service.
 * Used for registering devices and updating FCM push tokens.
 */
export const deviceApi = {
  /**
   * Register or update a device (upsert by userId + deviceId).
   */
  registerDevice: (data: RegisterDeviceRequest): Promise<DeviceResponse> => {
    return apiClient.post<DeviceResponse>('/devices/register', data);
  },

  /**
   * Update the FCM push token for an existing device.
   */
  updateFcmToken: (data: UpdateFcmTokenRequest): Promise<DeviceResponse> => {
    return apiClient.post<DeviceResponse>('/devices/fcm-token', data);
  },

  /**
   * Get all devices for the current user.
   */
  getMyDevices: (): Promise<DeviceResponse[]> => {
    return apiClient.get<DeviceResponse[]>('/devices');
  },
};
