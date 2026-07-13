import React from 'react';
import { View, Image, Text, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const SplashScreen = () => {
    return (
        <View style={styles.container}>
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: width * 0.35,
        height: width * 0.35,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '400',
        letterSpacing: 0.5,
    },
    digitalText: {
        color: '#2C3E50',
        fontWeight: '300',
    },
    mandirText: {
        color: '#E67E22',
        fontWeight: '500',
    },
});

export default SplashScreen;
