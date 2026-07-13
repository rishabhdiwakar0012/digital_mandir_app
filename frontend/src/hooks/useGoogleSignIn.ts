import { useState } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { config } from '../config';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let GoogleSignin: any = null;
let statusCodes: any = null;

if (!isExpoGo) {
  try {
    const GoogleSignInModule = require('@react-native-google-signin/google-signin');
    GoogleSignin = GoogleSignInModule.GoogleSignin;
    statusCodes = GoogleSignInModule.statusCodes;

    // Configure Google Sign-In once (safe to call multiple times)
    if (GoogleSignin) {
      const webClientId = config.google.webClientId || undefined;
      const iosClientId = config.google.iosClientId || undefined;
      if (!webClientId) {
        console.warn('[useGoogleSignIn] webClientId is not configured — set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env');
      }
      GoogleSignin.configure({
        webClientId,
        iosClientId,
        scopes: ['profile', 'email'],
      });
    }
  } catch (e) {
    console.warn('Failed to load @react-native-google-signin/google-signin', e);
  }
}

/**
 * Hook for Google Sign-In using the native @react-native-google-signin/google-signin module.
 *
 * Returns:
 * - `signIn`     — async function; resolves with idToken string or null on cancel
 * - `isLoading`  — true while sign-in is in progress
 * - `isReady`    — true when native module loaded
 * - `isExpoGo`   — true when running inside Expo Go
 *
 * Usage:
 *   const { signIn, isLoading } = useGoogleSignIn();
 *   const idToken = await signIn();
 *   if (idToken) { /* send to backend *\/ }
 *
 * ⚠️  DEVELOPER_ERROR on Android means the SHA-1 fingerprint of the signing
 *     certificate is not registered in Google Cloud Console for this project.
 *     Go to: https://console.cloud.google.com → APIs & Services → Credentials
 *     → Android OAuth Client → add SHA-1 for your keystore.
 */
export function useGoogleSignIn() {
  const [isLoading, setIsLoading] = useState(false);
  const hasNativeSupport = !isExpoGo && GoogleSignin;

  const signInNative = async (): Promise<string | null> => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // v13+: signIn() resolves with { type: 'success', data: User } | { type: 'cancelled', data: null }
      // It no longer throws on cancellation — it returns { type: 'cancelled' }
      const result = await GoogleSignin.signIn();

      if (result.type === 'cancelled') {
        console.log('[useGoogleSignIn] Sign-in cancelled by user');
        return null;
      }

      if (result.type === 'success') {
        const idToken = result.data?.idToken ?? null;
        if (!idToken) {
          console.warn('[useGoogleSignIn] signIn succeeded but idToken is null — ensure webClientId is set correctly in configure()');
          throw new Error('Google Sign-In succeeded but no ID token was returned. Please ensure the Web Client ID is configured correctly in Google Cloud Console.');
        }
        return idToken;
      }

      return null;
    } catch (error: any) {
      // Legacy cancellation handling (kept for older library builds)
      if (statusCodes && error?.code === statusCodes.SIGN_IN_CANCELLED) {
        return null;
      }
      // Provide a developer-friendly message for the most common error
      if (error?.code === '10' || error?.code === 10 || error?.message?.includes('DEVELOPER_ERROR')) {
        const msg =
          'DEVELOPER_ERROR: The SHA-1 fingerprint of this build is not registered in Google Cloud Console.\n' +
          'Register at: https://console.cloud.google.com → APIs & Services → Credentials → Android OAuth client';
        console.error('[useGoogleSignIn]', msg);
        throw new Error('Google Sign-In is not configured for this build. Please contact support.');
      }
      throw error;
    }
  };

  const signIn = async (): Promise<string | null> => {
    if (isLoading) return null;

    // Guard: webClientId is required for idToken to be returned
    if (!config.google.webClientId) {
      throw new Error(
        'Google Sign-In is not configured. Please set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env file and rebuild the app.',
      );
    }

    setIsLoading(true);

    try {
      if (hasNativeSupport) {
        console.log('[useGoogleSignIn] Using native Google Sign-In');
        return await signInNative();
      }

      // No native support (Expo Go or missing module)
      throw new Error(
        'Google Sign-In requires a development or production build. It is not available in Expo Go.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
    /** Async function — uses native picker or WebBrowser auth (both in-app) */
    signIn,
    /** True while sign-in is in progress */
    isLoading,
    /** True if native Google Sign-In is available (development build) */
    isReady: hasNativeSupport,
    /** True when running inside Expo Go */
    isExpoGo,
  };
}

/**
 * Disconnect the cached Google session so the account picker is shown
 * on the next sign-in attempt. Safe to call even if no session exists.
 *
 * Call this during logout to ensure users can pick a different account
 * when they sign in again.
 */
export async function googleSignOut(): Promise<void> {
  if (!GoogleSignin) return;
  try {
    await GoogleSignin.signOut();
    console.log('[googleSignOut] Google session disconnected');
  } catch (error: any) {
    // Not critical — the user is logging out anyway
    console.warn('[googleSignOut] Failed to disconnect Google session:', error?.message);
  }
}
