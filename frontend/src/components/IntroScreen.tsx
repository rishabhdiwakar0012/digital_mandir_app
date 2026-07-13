import React from 'react';
import { View, Image, Text, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const IntroScreen = () => {
    return (
        <View style={styles.container}>
            {/* Center Content: Logo + Title */}
            <View style={styles.content}>
                <Image
                    source={require('../../assets/splash-logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.title}>
                    <Text style={styles.digitalText}>Digital</Text>
                    <Text style={styles.mandirText}>Mandir.in</Text>
                </Text>
            </View>

            {/* Pandit SVG/Image at the bottom */}
            <View style={styles.panditContainer}>
                <Image
                    source={require('../../assets/pandit.png')}
                    style={styles.panditImage}
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
    },
    content: {
        position: 'absolute',
        top: 0,
        width: '100%',
        paddingTop: height * 0.15, // Increased top padding
        alignItems: 'center',
        zIndex: 1, // Ensure content is above image
    },
    logo: {
        width: 140,
        height: 140,
        marginBottom: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: '400',
        letterSpacing: 0.5,
        marginBottom: 0,
    },
    digitalText: {
        color: '#2C3E50',
        fontWeight: '600',
    },
    mandirText: {
        color: '#2C3E50',
        fontWeight: '600',
    },

    panditContainer: {
        position: 'absolute',
        bottom: -20, // Negative margin to reduce bottom padding visually
        width: '100%',
        alignItems: 'center',
        zIndex: 0,
    },
    panditImage: {
        width: width,
        height: height * 0.65, // Adjusted height
    },
});

export default IntroScreen;
