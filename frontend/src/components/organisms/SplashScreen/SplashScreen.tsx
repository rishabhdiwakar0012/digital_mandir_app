import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Image } from 'react-native';
import { SPLASH_CONFIG } from './constants';
import { Assets } from '../../../theme';

/**
 * SplashScreen Component
 * 
 * Displays the app's splash screen with the DigitalMandir.in logo.
 * Follows SOLID principles:
 * - Single Responsibility: Only handles splash screen display
 * - Open/Closed: Configuration via constants, easily extendable
 * - Dependency Inversion: Logo asset injected via separate module
 */
export const SplashScreen: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = height < 700;
  const isExtraSmallScreen = height < 680;

  return (
    <View style={[styles.container, { width, height, paddingTop: isExtraSmallScreen ? height * 0.03 : isSmallScreen ? height * 0.05 : height * 0.1 }]}>
      <View style={styles.content}>
        {/* Logo Image */}
        <View style={styles.logoContainer}>
          <Image
            source={Assets.splashLogo}
            style={{
              width: isExtraSmallScreen ? 65 : SPLASH_CONFIG.logoWidth,
              height: isExtraSmallScreen ? 76 : SPLASH_CONFIG.logoHeight,
            }}
            resizeMode="contain"
          />
        </View>

        {/* Brand Name */}
        <Text style={[styles.brandName, isExtraSmallScreen && { fontSize: 18 }]}>{SPLASH_CONFIG.brandName}</Text>
      </View>

      {/* Bottom Content - Empty for Splash, Pandit moves to Intro */}
      <View style={styles.bottomContent} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // Center the logo in the upper space
  },
  logoContainer: {
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1E2A47', // Dark navy blue to match the screenshot
    letterSpacing: 0.3,
    marginTop: 8,
  },
  bottomContent: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  // End of styles
});
