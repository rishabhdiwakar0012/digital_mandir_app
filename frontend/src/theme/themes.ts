import { colors } from './tokens';

export const lightTheme = {
  dark: false,
  colors: {
    primary: colors.primary[500],
    primaryLight: colors.primary[100],
    primaryDark: colors.primary[700],

    secondary: colors.secondary[500],
    secondaryLight: colors.secondary[100],
    secondaryDark: colors.secondary[700],

    background: colors.neutral[0],
    backgroundSecondary: colors.neutral[50],

    surface: colors.neutral[0],
    surfaceVariant: colors.neutral[100],

    text: colors.neutral[900],
    textSecondary: colors.neutral[600],
    textTertiary: colors.neutral[500],
    textInverse: colors.neutral[0],

    border: colors.neutral[200],
    borderFocused: colors.primary[500],

    success: colors.success.main,
    warning: colors.warning.main,
    error: colors.error.main,
    info: colors.info.main,

    card: colors.neutral[0],
    notification: colors.error.main,
  },
};

export const darkTheme = {
  dark: true,
  colors: {
    primary: colors.primary[400],
    primaryLight: colors.primary[700],
    primaryDark: colors.primary[200],

    secondary: colors.secondary[400],
    secondaryLight: colors.secondary[700],
    secondaryDark: colors.secondary[200],

    background: colors.neutral[900],
    backgroundSecondary: colors.neutral[800],

    surface: colors.neutral[800],
    surfaceVariant: colors.neutral[700],

    text: colors.neutral[50],
    textSecondary: colors.neutral[300],
    textTertiary: colors.neutral[400],
    textInverse: colors.neutral[900],

    border: colors.neutral[700],
    borderFocused: colors.primary[400],

    success: colors.success.light,
    warning: colors.warning.light,
    error: colors.error.light,
    info: colors.info.light,

    card: colors.neutral[800],
    notification: colors.error.light,
  },
};

export type Theme = typeof lightTheme;
export type ThemeColors = typeof lightTheme.colors;
