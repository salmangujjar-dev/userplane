/**
 * App Mode Context
 * Provides awareness of whether the recorder is running in embedded (iframe) or standalone mode
 * Manages the postbridge connection to the parent SDK when in embedded mode
 */

import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { detectAppMode, type AppMode } from '@/utils/browser';
import {
  getRecorderBridge,
  type RecorderBridgeConnection,
  type RecordingState,
  type RecordingSessionInfo,
} from '@/bridge';

interface AppModeContextValue {
  mode: AppMode;
  isEmbedded: boolean;
  isStandalone: boolean;
  /** Bridge connection to parent - null in standalone mode */
  bridge: RecorderBridgeConnection | null;
}

const AppModeContext = createContext<AppModeContextValue | null>(null);

interface AppModeProviderProps {
  children: ReactNode;
}

export function AppModeProvider({ children }: AppModeProviderProps) {
  const bridgeRef = useRef<RecorderBridgeConnection | null>(null);

  const value = useMemo<AppModeContextValue>(() => {
    const mode = detectAppMode();
    const isEmbedded = mode === 'embedded';

    // Only create bridge reference in embedded mode
    if (isEmbedded && !bridgeRef.current) {
      bridgeRef.current = getRecorderBridge();
    }

    return {
      mode,
      isEmbedded,
      isStandalone: mode === 'standalone',
      bridge: isEmbedded ? bridgeRef.current : null,
    };
  }, []);

  // Connect bridge in embedded mode
  useEffect(() => {
    if (!value.isEmbedded || !value.bridge) {
      return;
    }

    console.log('[AppModeContext] Embedded mode detected, connecting bridge');

    value.bridge.connect().catch((error) => {
      console.error('[AppModeContext] Bridge connection failed:', error);
    });

    // Cleanup on unmount
    return () => {
      console.log('[AppModeContext] Disconnecting bridge');
      value.bridge?.disconnect();
    };
  }, [value.isEmbedded, value.bridge]);

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

/**
 * Hook to access the bridge connection
 * Returns null in standalone mode
 */
export function useBridge(): RecorderBridgeConnection | null {
  return useAppMode().bridge;
}

// Re-export types for convenience
export type { RecordingState, RecordingSessionInfo };
