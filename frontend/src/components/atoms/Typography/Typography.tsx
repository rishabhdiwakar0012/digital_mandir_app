import React from 'react';
import { View, Text, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { useColors } from '../../../theme';
import { spacing, typography } from '../../../theme/tokens';

type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body1'
  | 'body2'
  | 'caption'
  | 'label';

type TypographyColor =
  | 'primary'
  | 'secondary'
  | 'text'
  | 'textSecondary'
  | 'textTertiary'
  | 'error'
  | 'success';

interface TypographyProps {
  children: React.ReactNode;
  variant?: TypographyVariant;
  color?: TypographyColor;
  align?: 'left' | 'center' | 'right';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
  adjustsFontSizeToFit?: boolean;
}

export function Typography({
  children,
  variant = 'body1',
  color = 'text',
  align = 'left',
  weight,
  style,
  numberOfLines,
  adjustsFontSizeToFit,
}: TypographyProps) {
  const colors = useColors();

  const getColor = (): string => {
    switch (color) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'textSecondary':
        return colors.textSecondary;
      case 'textTertiary':
        return colors.textTertiary;
      case 'error':
        return colors.error;
      case 'success':
        return colors.success;
      default:
        return colors.text;
    }
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'h1':
        return styles.h1;
      case 'h2':
        return styles.h2;
      case 'h3':
        return styles.h3;
      case 'h4':
        return styles.h4;
      case 'body2':
        return styles.body2;
      case 'caption':
        return styles.caption;
      case 'label':
        return styles.label;
      default:
        return styles.body1;
    }
  };

  const getFontWeight = () => {
    if (weight) {
      return typography.fontWeights[weight];
    }
    // Default weights for variants
    switch (variant) {
      case 'h1':
      case 'h2':
        return typography.fontWeights.bold;
      case 'h3':
      case 'h4':
        return typography.fontWeights.semibold;
      case 'label':
        return typography.fontWeights.medium;
      default:
        return typography.fontWeights.regular;
    }
  };

  return (
    <Text
      style={[
        getVariantStyle(),
        {
          color: getColor(),
          textAlign: align,
          fontWeight: getFontWeight() as any,
        },
        style,
      ]}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontSize: typography.fontSizes.display,
    lineHeight: typography.fontSizes.display * typography.lineHeights.tight,
  },
  h2: {
    fontSize: typography.fontSizes.xxxl,
    lineHeight: typography.fontSizes.xxxl * typography.lineHeights.tight,
  },
  h3: {
    fontSize: typography.fontSizes.xxl,
    lineHeight: typography.fontSizes.xxl * typography.lineHeights.normal,
  },
  h4: {
    fontSize: typography.fontSizes.xl,
    lineHeight: typography.fontSizes.xl * typography.lineHeights.normal,
  },
  body1: {
    fontSize: typography.fontSizes.lg,
    lineHeight: typography.fontSizes.lg * typography.lineHeights.normal,
  },
  body2: {
    fontSize: typography.fontSizes.md,
    lineHeight: typography.fontSizes.md * typography.lineHeights.normal,
  },
  caption: {
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.fontSizes.sm * typography.lineHeights.normal,
  },
  label: {
    fontSize: typography.fontSizes.md,
    lineHeight: typography.fontSizes.md * typography.lineHeights.normal,
  },
});
