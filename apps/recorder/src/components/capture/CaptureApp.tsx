'use client';

/**
 * Capture App
 * Lightweight hidden 1x1 iframe application for metadata extraction
 *
 * This component:
 * - Connects to the parent SDK via postbridge (for host communication)
 * - Connects to SharedWorker via cross-tab coordinator (for scatter-gather)
 * - Exposes methods for metadata extraction
 * - Tracks recorder state for cross-tab awareness
 * - Has NO visible UI - purely for background data collection
 *
 * Design rationale:
 * - Unlike recorder/verification apps, this runs invisibly
 * - Always mounted when SDK initializes (unless recorder/verify is active)
 * - Provides cross-tab awareness of recording state
 * - Enables scatter-gather metadata collection from all open tabs
 */

import { useCallback, useEffect, useReducer, useRef } from 'react';

import {
  CaptureBridgeConnection,
  type CaptureRecorderState,
  CONNECTION_PREFIXES,
  CrossTabCoordinator,
  getCaptureBridge,
  getCrossTabCoordinator,
  type TabMetadata,
} from '@/bridge';
import { createLogger } from '@/lib/logger';

const logger = createLogger('capture-app');

/**
 * Capture App - Hidden metadata extraction component
 * No visual rendering - this is a purely functional component
 */
type CaptureState = {
  isConnected: boolean;
  isCrossTabConnected: boolean;
  error: string | null;
  recorderState: CaptureRecorderState;
};

type CaptureAction =
  | { type: 'bridge_connected' }
  | { type: 'cross_tab_connected' }
  | { type: 'error'; message: string }
  | { type: 'recorder_state'; state: CaptureRecorderState };

function captureReducer(state: CaptureState, action: CaptureAction): CaptureState {
  switch (action.type) {
    case 'bridge_connected':
      return { ...state, isConnected: true };
    case 'cross_tab_connected':
      return { ...state, isCrossTabConnected: true };
    case 'error':
      return { ...state, error: action.message };
    case 'recorder_state':
      return { ...state, recorderState: action.state };
  }
}

const initialCaptureState: CaptureState = {
  isConnected: false,
  isCrossTabConnected: false,
  error: null,
  recorderState: {
    recorderTabId: null,
    recorderState: 'inactive',
    lastStateUpdate: Date.now(),
  },
};

export default function CaptureApp() {
  const bridgeRef = useRef<CaptureBridgeConnection | null>(null);
  const crossTabRef = useRef<CrossTabCoordinator | null>(null);
  const [{ isConnected, isCrossTabConnected, error, recorderState }, dispatch] = useReducer(
    captureReducer,
    initialCaptureState
  );

  // Metadata extractor function - called by cross-tab coordinator during scatter-gather
  // Builds flattened TabMetadata - system keys prefixed, custom metadata spread
  const extractMetadata = useCallback((): TabMetadata | null => {
    const bridge = bridgeRef.current;
    if (!bridge || !bridge.isConnected()) {
      logger.warn('cannot extract metadata - bridge not connected');
      return null;
    }

    const metadata: TabMetadata = {
      _pageUrl: bridge.getPageUrl(),
      _pageTitle: bridge.getPageTitle(),
      ...(bridge.getCustomMetadata() || {}),
    };

    logger.debug({ pageUrl: metadata._pageUrl }, 'metadata extracted');
    return metadata;
  }, []);

  // Initialize and connect bridges
  useEffect(() => {
    let mounted = true;

    async function initBridges() {
      try {
        logger.debug('starting bridge initialization');

        // 1. Connect to parent SDK via postbridge
        const bridge = getCaptureBridge({
          onRecorderStateChange: (state) => {
            if (mounted) {
              logger.debug({ state }, 'recorder state changed');
              dispatch({ type: 'recorder_state', state });
            }
          },
        });

        bridgeRef.current = bridge;

        await bridge.connect();

        if (!mounted) return;

        logger.debug('parent bridge connected');
        dispatch({ type: 'bridge_connected' });

        // Initialize recorder state from bridge
        dispatch({ type: 'recorder_state', state: bridge.getCurrentRecorderState() });

        // 2. Connect to cross-tab coordinator (SharedWorker)
        // Use a prefixed tab ID for this capture iframe
        const tabRef = bridge.getTabRef();
        const captureTabId = tabRef ? `${CONNECTION_PREFIXES.CAPTURE}_${tabRef}` : undefined;

        logger.debug({ tabRef, captureTabId }, 'initializing cross-tab coordinator');

        const crossTab = getCrossTabCoordinator({
          workerURL: '/bridge-worker.js',
          channel: 'userplane', // Unified channel for recorders and captures
          callbacks: {
            onRecorderStateChanged: (tabId, state) => {
              if (mounted) {
                logger.debug({ tabId, state }, 'recorder state changed via cross-tab');
                // This is handled by onCaptureRecorderStateChanged now
                // Keep for backwards compatibility but don't update state here
              }
            },
            onCaptureRecorderStateChanged: (state) => {
              if (mounted) {
                logger.debug(
                  { recorderState: state.recorderState },
                  'capture recorder state changed'
                );
                dispatch({ type: 'recorder_state', state });
              }
            },
            onBlurrStart: () => {
              if (mounted && bridge) {
                logger.debug('received blur start command');
                bridge.startBlurr();
              }
            },
            onBlurrStop: () => {
              if (mounted && bridge) {
                logger.debug('received blur stop command');
                bridge.stopBlurr();
              }
            },
            onLogCaptureStart: (preferences, sessionId, workspaceId, internalEndpoints) => {
              if (mounted && bridge) {
                const tabRef = bridge.getTabRef();
                logger.debug({ sessionId, tabRef }, 'received log capture start command');
                bridge.startLogCapture(
                  preferences,
                  sessionId,
                  tabRef ?? '',
                  workspaceId,
                  internalEndpoints
                );
              }
            },
            onLogCaptureStop: () => {
              if (mounted && bridge) {
                logger.debug('received log capture stop command');
                bridge.stopLogCapture();
              }
            },
            onClearLogStore: () => {
              if (mounted && bridge) {
                logger.debug('received clear log store command');
                bridge.clearLogStore().catch((err) => {
                  logger.warn({ err }, 'clear log store failed (non-fatal)');
                });
              }
            },
          },
        });

        crossTabRef.current = crossTab;

        // Register metadata extractor before connecting
        crossTab.setMetadataExtractor(extractMetadata);

        await crossTab.connect(captureTabId);

        if (!mounted) return;

        logger.debug({ captureTabId }, 'cross-tab coordinator connected');
        dispatch({ type: 'cross_tab_connected' });

        // Check if blur is already enabled (for tabs that connect during recording)
        const blurrEnabled = crossTab.isBlurrEnabled();
        if (blurrEnabled) {
          logger.debug('blur already enabled on connect');
          bridge.startBlurr();
        }

        // Check if log capture is already enabled (for tabs that connect during recording)
        const logCaptureEnabled = crossTab.isLogCaptureEnabled();
        if (logCaptureEnabled) {
          const prefs = crossTab.getLogCapturePreferences();
          const sessionId = crossTab.getLogCaptureSessionId();
          const workspaceId = crossTab.getLogCaptureWorkspaceId();
          const internalEndpoints = crossTab.getLogCaptureInternalEndpoints();
          if (prefs && sessionId && workspaceId) {
            const tabRef = bridge.getTabRef();
            logger.debug('log capture already enabled on connect');
            bridge.startLogCapture(
              prefs,
              sessionId,
              tabRef ?? '',
              workspaceId,
              internalEndpoints ?? undefined
            );
          }
        }

        // Register log extractor for scatter-gather
        crossTab.setLogExtractor(async () => {
          return bridge.getLogEntries();
        });
      } catch (err) {
        logger.error({ err }, 'bridge initialization failed');
        if (mounted) {
          dispatch({
            type: 'error',
            message: err instanceof Error ? err.message : 'Failed to connect',
          });
        }
      }
    }

    initBridges();

    // Cleanup on unmount
    return () => {
      mounted = false;
      logger.debug('unmounting');
      if (bridgeRef.current) {
        bridgeRef.current.disconnect();
      }
      if (crossTabRef.current) {
        crossTabRef.current.disconnect();
      }
    };
  }, [extractMetadata]);

  // Log state changes for debugging
  useEffect(() => {
    if (isConnected && isCrossTabConnected) {
      logger.debug(
        { tabRef: bridgeRef.current?.getTabRef(), recorderState: recorderState.recorderState },
        'fully connected'
      );
    }
  }, [isConnected, isCrossTabConnected, recorderState]);

  // This component renders nothing - it's invisible
  // In development, we can add a debug indicator if needed
  if (process.env.NODE_ENV === 'development' && error) {
    // In development, show error state for debugging
    // In production, this would be completely invisible
    return (
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          opacity: 0,
          pointerEvents: 'none',
        }}
        data-userplane-capture="error"
        data-error={error}
      />
    );
  }

  // Render an invisible marker element for debugging
  // This has no visual impact but can be inspected in DevTools
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        width: '1px',
        height: '1px',
        overflow: 'hidden',
        opacity: 0,
        pointerEvents: 'none',
      }}
      data-userplane-capture={isConnected && isCrossTabConnected ? 'connected' : 'connecting'}
      data-tab-ref={bridgeRef.current?.getTabRef() ?? undefined}
      data-recorder-state={recorderState.recorderState}
      data-recorder-tab-id={recorderState.recorderTabId ?? undefined}
      data-cross-tab={isCrossTabConnected ? 'connected' : 'disconnected'}
    />
  );
}
