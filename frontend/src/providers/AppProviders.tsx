import React from 'react';
import { QueryProvider } from './QueryProvider';
import { I18nProvider } from './I18nProvider';
import { ThemeProvider } from '../theme';

interface AppProvidersProps {
  children: React.ReactNode;
}

/**
 * Root providers component
 * Wraps all context providers in proper order
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <I18nProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </I18nProvider>
    </QueryProvider>
  );
}
