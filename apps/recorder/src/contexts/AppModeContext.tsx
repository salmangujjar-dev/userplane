/**
 * App Mode Context
 * Provides awareness of whether the recorder is running in embedded (iframe) or standalone mode
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { detectAppMode, type AppMode } from '@/utils/browser';

interface AppModeContextValue {
  mode: AppMode;
  isEmbedded: boolean;
  isStandalone: boolean;
}

const AppModeContext = createContext<AppModeContextValue | null>(null);

interface AppModeProviderProps {
  children: ReactNode;
}

export function AppModeProvider({ children }: AppModeProviderProps) {
  const value = useMemo<AppModeContextValue>(() => {
    const mode = detectAppMode();
    return {
      mode,
      isEmbedded: mode === 'embedded',
      isStandalone: mode === 'standalone',
    };
  }, []);

  return <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>;
}

/**
 * Hook to access the current app mode
 * Must be used within an AppModeProvider
 */
export function useAppMode(): AppModeContextValue {
  const context = useContext(AppModeContext);
  if (!context) {
    throw new Error('useAppMode must be used within an AppModeProvider');
  }
  return context;
}

/**
 * Hook to check if running in embedded mode
 * Convenience hook that returns just the boolean
 */
export function useIsEmbedded(): boolean {
  return useAppMode().isEmbedded;
}

/**
 * Hook to check if running in standalone mode
 * Convenience hook that returns just the boolean
 */
export function useIsStandalone(): boolean {
  return useAppMode().isStandalone;
}
