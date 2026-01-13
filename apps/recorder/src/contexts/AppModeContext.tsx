/**
 * App Mode Context
 * Provides awareness of whether the recorder is running in embedded (iframe) or standalone mode
 * Manages the postbridge connection to the parent SDK when in embedded mode
 * Coordinates recorder lock across tabs using SharedWorker
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { detectAppMode, type AppMode } from '@/utils/browser';
import {
  getRecorderBridge,
  getVerificationBridge,
  getCrossTabCoordinator,
  CrossTabCoordinator,
  type RecorderBridgeConnection,
  type VerificationBridgeConnection,
  type RecordingState,
  type RecordingSessionInfo,
  type AcquireLockResult,
} from '@/bridge';

/**
 * Cross-tab lock status
 */
type CrossTabLockStatus =
  | 'pending' // Not yet attempted
  | 'connecting' // Connecting to SharedWorker
  | 'acquired' // Lock acquired, this recorder can proceed
  | 'blocked' // Another recorder is active
  | 'error'; // Failed to connect or acquire

interface AppModeContextValue {
  mode: AppMode;
  isEmbedded: boolean;
  isStandalone: boolean;
  /** Recorder bridge connection to parent - null in standalone mode */
  bridge: RecorderBridgeConnection | null;
  /** Verification bridge connection to parent - null in standalone mode */
  verificationBridge: VerificationBridgeConnection | null;
  /** Cross-tab coordinator for lock management and scatter-gather - null in standalone mode */
  crossTab: CrossTabCoordinator | null;
  /** Status of cross-tab lock acquisition */
  crossTabLockStatus: CrossTabLockStatus;
  /** Error message if blocked or failed */
  crossTabError: string | null;
  /** Tab ID that currently holds the lock (if blocked) */
  blockingTabId: string | null;
}

const AppModeContext = createContext<AppModeContextValue | null>(null);

/**
 * Action type for the app - determines which bridges to connect
 */
type AppActionType = 'recording' | 'verification';

interface AppModeProviderProps {
  children: ReactNode;
  /**
   * The action type determines which bridges to connect:
   * - 'recording': Connects recorder bridge with cross-tab coordination
   * - 'verification': Connects only verification bridge (lightweight)
   */
  actionType: AppActionType;
  /**
   * URL to the SharedWorker script for cross-tab coordination (optional)
   * If not provided, postbridge uses bundler's native worker import.
   * Vite/Astro handle this automatically - no URL needed.
   * Only used when actionType is 'recording'.
   */
  crossTabWorkerURL?: string;
}

export function AppModeProvider({ children, actionType, crossTabWorkerURL }: AppModeProviderProps) {
  const bridgeRef = useRef<RecorderBridgeConnection | null>(null);
  const verificationBridgeRef = useRef<VerificationBridgeConnection | null>(null);
  const crossTabRef = useRef<CrossTabCoordinator | null>(null);

  // Track cross-tab lock status
  const [lockStatus, setLockStatus] = useState<CrossTabLockStatus>('pending');
  const [lockError, setLockError] = useState<string | null>(null);
  const [blockingTabId, setBlockingTabId] = useState<string | null>(null);

  // Detect mode once (stable reference)
  const mode = useMemo(() => detectAppMode(), []);
  const isEmbedded = mode === 'embedded';
  const isRecording = actionType === 'recording';
  const isVerification = actionType === 'verification';

  // Create instances only in embedded mode, based on action type
  useMemo(() => {
    // Recording mode: create recorder bridge and cross-tab coordinator
    if (isEmbedded && isRecording && !bridgeRef.current) {
      bridgeRef.current = getRecorderBridge();
    }
    // Cross-tab coordinator for lock management and scatter-gather (single userplane channel)
    if (isEmbedded && isRecording && !crossTabRef.current) {
      crossTabRef.current = getCrossTabCoordinator({
        workerURL: crossTabWorkerURL,
        callbacks: {
          onRecorderAcquiredByOtherTab: (tabId) => {
            console.log('[AppModeContext] Another tab acquired recorder:', tabId);
          },
          onRecorderReleasedByOtherTab: (previousTabId) => {
            console.log('[AppModeContext] Another tab released recorder:', previousTabId);
          },
          onRecorderStateChanged: (tabId, state) => {
            console.log('[AppModeContext] Recorder state changed:', { tabId, state });
          },
          onMetadataResponse: (response) => {
            console.log(
              '[AppModeContext] Got metadata response from capture tab:',
              response.responderTabId
            );
          },
        },
      });
    }
    // Verification mode: create only verification bridge
    if (isEmbedded && isVerification && !verificationBridgeRef.current) {
      verificationBridgeRef.current = getVerificationBridge();
    }
  }, [isEmbedded, isRecording, isVerification, crossTabWorkerURL]);

  const value = useMemo<AppModeContextValue>(
    () => ({
      mode,
      isEmbedded,
      isStandalone: mode === 'standalone',
      bridge: isEmbedded ? bridgeRef.current : null,
      verificationBridge: isEmbedded ? verificationBridgeRef.current : null,
      crossTab: isEmbedded ? crossTabRef.current : null,
      crossTabLockStatus: lockStatus,
      crossTabError: lockError,
      blockingTabId,
    }),
    [mode, isEmbedded, lockStatus, lockError, blockingTabId]
  );

  // Connect verification bridge (simple connection, no cross-tab coordination needed)
  // Only runs in verification mode
  useEffect(() => {
    if (!isEmbedded || !isVerification || !verificationBridgeRef.current) {
      return;
    }

    const verificationBridge = verificationBridgeRef.current;
    let mounted = true;

    async function connectVerificationBridge() {
      try {
        console.log('[AppModeContext] Connecting verification bridge');
        await verificationBridge.connect();
        if (!mounted) return;
        console.log('[AppModeContext] Verification bridge connected');
        // For verification, we don't need cross-tab coordination
        // Set lock status to acquired so UI doesn't show waiting state
        setLockStatus('acquired');
      } catch (error) {
        if (!mounted) return;
        console.error('[AppModeContext] Verification bridge connection failed:', error);
        setLockStatus('error');
        setLockError('Failed to connect to parent');
      }
    }

    connectVerificationBridge();

    return () => {
      mounted = false;
      verificationBridge.disconnect();
    };
  }, [isEmbedded, isVerification]);

  // Connect recorder bridge (with cross-tab coordination)
  // Only runs in recording mode
  useEffect(() => {
    if (!isEmbedded || !isRecording || !bridgeRef.current || !crossTabRef.current) {
      return;
    }

    const bridge = bridgeRef.current;
    const crossTab = crossTabRef.current;
    let mounted = true;

    async function connectAll() {
      setLockStatus('connecting');
      setLockError(null);
      setBlockingTabId(null);

      try {
        // Step 1: Connect bridge to parent SDK to get tabRef
        console.log('[AppModeContext] Connecting bridge to get tabRef from parent');
        await bridge.connect();
        if (!mounted) return;

        const tabRef = bridge.getTabRef();
        console.log('[AppModeContext] Got tabRef from parent:', tabRef);

        // Step 2: Connect cross-tab coordinator using parent's tabRef
        console.log('[AppModeContext] Connecting to cross-tab coordinator with tabRef');
        // Use rec_ prefix to identify as recorder on the userplane channel
        const recorderTabId = tabRef ? `rec_${tabRef}` : undefined;
        console.log('[AppModeContext] Connecting to cross-tab with ID:', recorderTabId);
        await crossTab.connect(recorderTabId);
        if (!mounted) return;

        // Step 3: Check if another recorder is already mounted AND alive
        const isMounted = await crossTab.isRecorderMounted();
        if (isMounted) {
          const holderTabId = crossTab.getRecorderTabId();
          console.log('[AppModeContext] Another recorder is already mounted in tab:', holderTabId);
          setLockStatus('blocked');
          setLockError(
            'Another recorder is already open. Only one recorder can be active at a time.'
          );
          setBlockingTabId(holderTabId);
          return;
        }

        // Step 4: Attempt to acquire the lock using CAS
        console.log('[AppModeContext] Attempting to acquire recorder lock');
        const result: AcquireLockResult = await crossTab.acquireLock();
        if (!mounted) return;

        if (result.success) {
          console.log('[AppModeContext] Recorder lock acquired successfully');
          // Wire up cross-tab coordinator to bridge for state sync
          bridge.setCrossTabCoordinator(crossTab);
          setLockStatus('acquired');
        } else {
          console.log('[AppModeContext] Failed to acquire lock:', result.error);
          setLockStatus('blocked');
          setLockError(result.error ?? 'Failed to acquire recorder lock');
          setBlockingTabId(result.currentHolderTabId ?? null);
        }
      } catch (error) {
        if (!mounted) return;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[AppModeContext] Connection failed:', error);
        setLockStatus('error');
        setLockError(`Failed to connect: ${errorMessage}`);
      }
    }

    connectAll();

    // Cleanup on unmount
    return () => {
      mounted = false;
      console.log('[AppModeContext] Disconnecting');
      bridge.setCrossTabCoordinator(null);
      bridge.disconnect();
      crossTab.disconnect().catch((err) => {
        console.error('[AppModeContext] Error disconnecting cross-tab:', err);
      });
    };
  }, [isEmbedded, isRecording]);

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
 * Hook to access the recorder bridge connection
 * Returns null in standalone mode
 */
export function useBridge(): RecorderBridgeConnection | null {
  return useAppMode().bridge;
}

/**
 * Hook to access the verification bridge connection
 * Returns null in standalone mode
 */
export function useVerificationBridge(): VerificationBridgeConnection | null {
  return useAppMode().verificationBridge;
}

/**
 * Hook to access the cross-tab coordinator (userplane channel)
 * Used for lock management and scatter-gather
 * Returns null in standalone mode
 */
export function useCrossTab(): CrossTabCoordinator | null {
  return useAppMode().crossTab;
}

/**
 * Hook to check cross-tab lock status
 * Returns the lock status, error message, and blocking tab ID if applicable
 */
export function useCrossTabLock(): {
  status: CrossTabLockStatus;
  error: string | null;
  blockingTabId: string | null;
  isAcquired: boolean;
  isBlocked: boolean;
  isPending: boolean;
} {
  const { crossTabLockStatus, crossTabError, blockingTabId } = useAppMode();
  return {
    status: crossTabLockStatus,
    error: crossTabError,
    blockingTabId,
    isAcquired: crossTabLockStatus === 'acquired',
    isBlocked: crossTabLockStatus === 'blocked',
    isPending: crossTabLockStatus === 'pending' || crossTabLockStatus === 'connecting',
  };
}

// Re-export types for convenience
export type { RecordingState, RecordingSessionInfo, CrossTabLockStatus };
