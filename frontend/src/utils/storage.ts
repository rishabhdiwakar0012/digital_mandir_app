import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Secure storage service for sensitive data
 * Uses expo-secure-store for native and localStorage for web (development)
 */
class SecureStorageService {
  private isWeb = Platform.OS === 'web';

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isWeb) {
        localStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
      throw error;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (this.isWeb) {
        return localStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (this.isWeb) {
        localStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw error;
    }
  }

  async setObject<T>(key: string, value: T): Promise<void> {
    const jsonValue = JSON.stringify(value);
    await this.setItem(key, jsonValue);
  }

  async getObject<T>(key: string): Promise<T | null> {
    const jsonValue = await this.getItem(key);
    if (!jsonValue) return null;
    
    try {
      return JSON.parse(jsonValue) as T;
    } catch {
      return null;
    }
  }

  async clear(): Promise<void> {
    // Note: SecureStore doesn't have a clear all method
    // You need to track keys and delete them individually
    if (this.isWeb) {
      localStorage.clear();
    }
  }
}

export const secureStorage = new SecureStorageService();
