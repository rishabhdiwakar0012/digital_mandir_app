import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import hi from './locales/hi.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
};

export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
];

// Get device language
const getDeviceLanguage = (): string => {
  const deviceLang = Localization.getLocales()[0]?.languageCode || 'en';
  return supportedLanguages.some((lang) => lang.code === deviceLang)
    ? deviceLang
    : 'en';
};

i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  compatibilityJSON: 'v4',

  interpolation: {
    escapeValue: false,
  },

  react: {
    useSuspense: false,
  },
});

export default i18n;

// Helper function to change language
export const changeLanguage = async (languageCode: string): Promise<void> => {
  await i18n.changeLanguage(languageCode);
};

// Helper to get current language
export const getCurrentLanguage = (): string => {
  return i18n.language || 'en';
};
