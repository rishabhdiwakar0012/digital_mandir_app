/**
 * Navigation route names
 * Centralized navigation constants
 */
export const ROUTES = {
  // Auth Stack
  AUTH: {
    LOGIN: 'Login',
    REGISTER: 'Register',
    FORGOT_PASSWORD: 'ForgotPassword',
    RESET_PASSWORD: 'ResetPassword',
  },

  // Main Stack
  MAIN: {
    HOME: 'Home',
    PROFILE: 'Profile',
    SETTINGS: 'Settings',
    MANTRA_JAAP: 'MantraJaap',
  },

  // Tab Navigator
  TABS: {
    HOME_TAB: 'HomeTab',
    PROFILE_TAB: 'ProfileTab',
    SETTINGS_TAB: 'SettingsTab',
  },
} as const;

export type AuthRoutes = (typeof ROUTES.AUTH)[keyof typeof ROUTES.AUTH];
export type MainRoutes = (typeof ROUTES.MAIN)[keyof typeof ROUTES.MAIN];
export type TabRoutes = (typeof ROUTES.TABS)[keyof typeof ROUTES.TABS];
