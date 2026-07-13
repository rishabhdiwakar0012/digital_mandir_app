import React from 'react';
import { View, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { useColors } from '../../../theme';

interface LoadingProps {
  size?: 'small' | 'large';
  color?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

export const Loading: React.FC<LoadingProps> = ({
  size = 'large',
  color,
  fullScreen = false,
  style,
}) => {
  const colors = useColors();
  const indicatorColor = color || colors.primary;

  if (fullScreen) {
    return (
      <View
        style={[
          styles.fullScreen,
          { backgroundColor: colors.background },
          style,
        ]}
      >
        <ActivityIndicator size={size} color={indicatorColor} />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={indicatorColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
