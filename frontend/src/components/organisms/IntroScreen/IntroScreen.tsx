import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Image, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { INTRO_CONFIG } from './constants';
import { Assets } from '../../../theme';

/**
 * IntroScreen Component
 * 
 * Displays the app's intro screen with the DigitalMandir.in logo at top
 * and pandit character at bottom.
 * 
 * Follows SOLID principles:
 * - Single Responsibility: Only handles intro screen display
 * - Open/Closed: Configuration via constants, easily extendable
 * - Liskov Substitution: Can be replaced with any compatible screen component
 * - Interface Segregation: Minimal props interface
 * - Dependency Inversion: Logo and pandit assets injected via separate module
 */
export const IntroScreen: React.FC = () => {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const isSmallScreen = height < 700;
    const isExtraSmallScreen = height < 680;

    const panditWidth = isExtraSmallScreen ? 200 : isSmallScreen ? 250 : INTRO_CONFIG.panditWidth;
    const panditHeight = isExtraSmallScreen ? 300 : isSmallScreen ? 375 : INTRO_CONFIG.panditHeight;
    const logoWidth = isExtraSmallScreen ? 65 : isSmallScreen ? 80 : INTRO_CONFIG.logoWidth;
    const logoHeight = isExtraSmallScreen ? 76 : isSmallScreen ? 94 : INTRO_CONFIG.logoHeight;

    return (
        <View style={[styles.container, {
            width,
            height,
            paddingTop: insets.top + (isExtraSmallScreen ? height * 0.03 : isSmallScreen ? height * 0.05 : height * 0.1),
            paddingBottom: Math.max(insets.bottom, isExtraSmallScreen ? 10 : isSmallScreen ? 15 : 30),
        }]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFF8F0" />
            {/* Top section with logo and brand name */}
            <View style={styles.topContent}>
                {/* Logo Image */}
                <View style={styles.logoContainer}>
                    <Image
                        source={Assets.splashLogo}
                        style={{
                            width: logoWidth,
                            height: logoHeight,
                        }}
                        resizeMode="contain"
                    />
                </View>

                {/* Brand Name */}
                <Text style={[styles.brandName, isExtraSmallScreen && { fontSize: 16 }, !isExtraSmallScreen && isSmallScreen && { fontSize: 18 }]}>{INTRO_CONFIG.brandName}</Text>
            </View>

            {/* Bottom section with pandit character */}
            <View style={styles.bottomContent}>
                <Image
                    source={require('../../../../assets/baba-introscreen-optimized.gif')}
                    style={{
                        width: isExtraSmallScreen ? 260 : 350,
                        height: isExtraSmallScreen ? 260 : 350,
                    }}
                    resizeMode="contain"
                />
            </View>
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
    topContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 20,
    },
    logoContainer: {
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brandName: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1E2A47', // Dark navy blue to match the splash screen
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        letterSpacing: 0.5,
        marginTop: 8,
    },
    bottomContent: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 0, // No bottom space
    },
});
