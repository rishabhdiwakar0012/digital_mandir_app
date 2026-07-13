import React from 'react';
import { View, Text, Image, StyleSheet, Platform, Dimensions } from 'react-native';
import { Assets } from '../../../theme';
import { spacing } from '../../../theme/tokens';

const { height } = Dimensions.get('window');
const isExtraSmallScreen = height < 680;

export const HeaderLogo = () => {
    return (
        <View style={styles.headerLogoContainer}>
            <Image source={Assets.splashLogo} style={styles.logo as any} resizeMode="contain" />
            <Text style={styles.headerText}>DigitalMandir.in</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    headerLogoContainer: {
        flexDirection: 'column', // Stack Image and Text
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 56,
        height: 56,
        marginBottom: spacing.xs,
    },
    headerText: {
        fontSize: isExtraSmallScreen ? 18 : 22,
        fontWeight: 'bold',
        color: '#5D4037',
        alignSelf: 'center',
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        letterSpacing: 0.5,
    },
});
