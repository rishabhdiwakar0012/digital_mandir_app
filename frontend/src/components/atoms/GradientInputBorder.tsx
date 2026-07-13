import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GradientInputBorderProps {
    filled: boolean;           // true → show gradient orange border
    children: React.ReactNode;
    style?: ViewStyle;
    borderRadius?: number;
    borderWidth?: number;
}

// Orange gradient colours matching the app theme
const GRADIENT_COLORS: [string, string] = ['#FF9933', '#E65100'];
const EMPTY_COLORS: [string, string] = ['#E0E0E0', '#E0E0E0'];

/**
 * Wraps any input container with a gradient border when filled.
 * Uses the LinearGradient-as-border technique:
 *   - LinearGradient is the outer layer (acts as border)
 *   - A white inner View sits on top with padding subtracted
 */
export const GradientInputBorder: React.FC<GradientInputBorderProps> = ({
    filled,
    children,
    style,
    borderRadius = 12,
    borderWidth = 2,
}) => {
    const colors = filled ? GRADIENT_COLORS : EMPTY_COLORS;

    return (
        <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[{ borderRadius, padding: borderWidth }, style]}
        >
            <View style={[styles.inner, { borderRadius: borderRadius - borderWidth }]}>
                {children}
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    inner: {
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
    },
});
