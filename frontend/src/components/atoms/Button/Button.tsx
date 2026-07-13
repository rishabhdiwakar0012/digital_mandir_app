import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { useColors } from '../../../theme';
import { spacing, borderRadius, typography } from '../../../theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  textColor?: string;
  borderColor?: string;
  backgroundColor?: string;
  textStyle?: TextStyle;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  textColor,
  borderColor,
  backgroundColor,
  textStyle,
  ...props
}: ButtonProps) {
  const colors = useColors();

  const getBackgroundColor = (): string => {
    if (disabled) return colors.border;

    switch (variant) {
      case 'primary':
        return '#FF9C26'; // Vibrant orange
      case 'secondary':
        return colors.secondary;
      case 'outline':
        return '#FFFFFF';
      case 'ghost':
        return 'transparent';
      case 'danger':
        return colors.error;
      default:
        return colors.primary;
    }
  };

  const getTextColor = (): string => {
    if (disabled) return colors.textTertiary;

    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        return '#FFFFFF'; // Pure white for better contrast
      case 'outline':
        return colors.primary;
      case 'ghost':
        return colors.text;
      default:
        return colors.textInverse;
    }
  };

  const getBorderColor = (): string => {
    if (variant === 'outline') {
      return disabled ? colors.border : colors.primary;
    }
    return 'transparent';
  };

  const getPadding = (): { paddingVertical: number; paddingHorizontal: number } => {
    switch (size) {
      case 'sm':
        return { paddingVertical: spacing.xs, paddingHorizontal: spacing.md };
      case 'lg':
        return { paddingVertical: spacing.md, paddingHorizontal: spacing.xl };
      default:
        return { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg };
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'sm':
        return typography.fontSizes.sm;
      case 'lg':
        return typography.fontSizes.xl;
      default:
        return typography.fontSizes.lg;
    }
  };

  const containerStyle: ViewStyle = {
    ...styles.container,
    backgroundColor: backgroundColor || getBackgroundColor(),
    borderColor: borderColor || getBorderColor(),
    borderWidth: variant === 'outline' ? 2 : 0, // Slightly thicker border for outline
    borderBottomWidth: (variant === 'primary' || variant === 'outline' || variant === 'danger') && !disabled ? 5 : 0,
    borderBottomColor: !disabled ? (
      variant === 'primary' ? '#E67E00' : 
      variant === 'outline' ? '#FF8A00' : // Darker orange for outline 3D effect
      variant === 'danger' ? '#B71C1C' : 'transparent'
    ) : 'transparent',
    ...getPadding(),
    ...(fullWidth && styles.fullWidth),
    ...(style as ViewStyle),
  };

  const combinedTextStyle: TextStyle = {
    ...styles.text,
    color: textColor || getTextColor(),
    fontSize: getFontSize(),
    textTransform: (variant === 'primary' || variant === 'outline' || variant === 'danger') ? 'uppercase' : 'none',
    letterSpacing: (variant === 'primary' || variant === 'outline' || variant === 'danger') ? 0.5 : 0,
    ...textStyle,
  };

  return (
    <TouchableOpacity
      style={containerStyle}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {leftIcon}
          <Text 
            style={combinedTextStyle} 
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {title}
          </Text>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14, // Slightly more rounded as per screenshot
    gap: spacing.sm,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '800', // Extra bold for premium feel
  },
});
