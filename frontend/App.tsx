import React from 'react';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { View, ActivityIndicator, LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as ExpoSplashScreen from 'expo-splash-screen';
import NetInfo from '@react-native-community/netinfo';
import { AppProviders } from './src/providers';
import { RootNavigator } from './src/navigation';
import { useAppStore } from './src/store/appStore';
import { useNotifications } from './src/hooks/useNotifications';
import { configureForegroundNotifications } from './src/services/notificationService';

// Prevent the native splash screen from auto-hiding until fonts are ready
ExpoSplashScreen.preventAutoHideAsync();

// Configure how notifications display when app is in the foreground
// Must be called at module level (outside component) per Expo docs
configureForegroundNotifications();

// Suppress known Expo Go SDK 53 notification errors to prevent red/yellow boxes
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
]);

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Initialize push notifications (requests permission, registers device after auth)
  useNotifications();

  // Wire real network status to the app store
  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      useAppStore.getState().setIsOnline(!!state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // Hide native splash once fonts are loaded
  React.useEffect(() => {
    if (fontsLoaded) {
      ExpoSplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#FF9933" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AppProviders>
        <StatusBar style="auto" />
        <RootNavigator />
      </AppProviders>
    </SafeAreaProvider>
  );
}
