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

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  CaptureBridgeConnection,
  type CaptureRecorderState,
  CONNECTION_PREFIXES,
  CrossTabCoordinator,
  getCaptureBridge,
  getCrossTabCoordinator,
  type TabMetadata,
} from '@/bridge';

/**
 * Capture App - Hidden metadata extraction component
 * No visual rendering - this is a purely functional component
 */
export default function CaptureApp() {
  const bridgeRef = useRef<CaptureBridgeConnection | null>(null);
  const crossTabRef = useRef<CrossTabCoordinator | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCrossTabConnected, setIsCrossTabConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track recorder state for debugging (could be exposed via context if needed)
  const [recorderState, setRecorderState] = useState<CaptureRecorderState>({
    recorderTabId: null,
    recorderState: 'inactive',
    lastStateUpdate: Date.now(),
  });

  // Metadata extractor function - called by cross-tab coordinator during scatter-gather
  // Builds flattened TabMetadata - system keys prefixed, custom metadata spread
  const extractMetadata = useCallback((): TabMetadata | null => {
    const bridge = bridgeRef.current;
    if (!bridge || !bridge.isConnected()) {
      console.warn('[CaptureApp][Metadata] Cannot extract - bridge not connected');
      return null;
    }

    const metadata: TabMetadata = {
      _pageUrl: bridge.getPageUrl(),
      _pageTitle: bridge.getPageTitle(),
      ...(bridge.getCustomMetadata() || {}),
    };

    console.log('[CaptureApp][Metadata] Extracted:', { pageUrl: metadata._pageUrl });
    return metadata;
  }, []);

  // Initialize and connect bridges
  useEffect(() => {
    let mounted = true;

    async function initBridges() {
      try {
        console.log('[CaptureApp][Init] Starting bridge initialization');

        // 1. Connect to parent SDK via postbridge
        const bridge = getCaptureBridge({
          onRecorderStateChange: (state) => {
            if (mounted) {
              console.log('[CaptureApp][Bridge] Recorder state changed:', state);
              setRecorderState(state);
            }
          },
        });

        bridgeRef.current = bridge;

        await bridge.connect();

        if (!mounted) return;

        console.log('[CaptureApp][Bridge] Parent bridge connected');
        setIsConnected(true);

        // Initialize recorder state from bridge
        setRecorderState(bridge.getCurrentRecorderState());

        // 2. Connect to cross-tab coordinator (SharedWorker)
        // Use a prefixed tab ID for this capture iframe
        const tabRef = bridge.getTabRef();
        const captureTabId = tabRef ? `${CONNECTION_PREFIXES.CAPTURE}_${tabRef}` : undefined;

        console.log('[CaptureApp][CrossTab] Initializing coordinator', { tabRef, captureTabId });

        const crossTab = getCrossTabCoordinator({
          channel: 'userplane', // Unified channel for recorders and captures
          callbacks: {
            onRecorderStateChanged: (tabId, state) => {
              if (mounted) {
                console.debug('[CaptureApp][CrossTab] Recorder state changed:', { tabId, state });
                // This is handled by onCaptureRecorderStateChanged now
                // Keep for backwards compatibility but don't update state here
              }
            },
            onCaptureRecorderStateChanged: (state) => {
              if (mounted) {
                console.log('[CaptureApp][CrossTab] Capture recorder state changed:', {
                  recorderTabId: state.recorderTabId,
                  recorderState: state.recorderState,
                });
                setRecorderState(state);
              }
            },
            onBlurrStart: () => {
              if (mounted && bridge) {
                console.log('[CaptureApp][Blur] Received START command');
                bridge.startBlurr();
              }
            },
            onBlurrStop: () => {
              if (mounted && bridge) {
                console.log('[CaptureApp][Blur] Received STOP command');
                bridge.stopBlurr();
              }
            },
          },
        });

        crossTabRef.current = crossTab;

        // Register metadata extractor before connecting
        crossTab.setMetadataExtractor(extractMetadata);

        await crossTab.connect(captureTabId);

        if (!mounted) return;

        console.log('[CaptureApp][CrossTab] Coordinator connected', {
          captureTabId,
          isConnected: crossTab.isConnected(),
        });
        setIsCrossTabConnected(true);

        // Check if blur is already enabled (for tabs that connect during recording)
        const blurrEnabled = crossTab.isBlurrEnabled();
        if (blurrEnabled) {
          console.log('[CaptureApp][Blur] Already enabled on connect - starting privacy blur');
          bridge.startBlurr();
        }
      } catch (err) {
        console.error('[CaptureApp][Init] Failed to initialize bridges:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to connect');
        }
      }
    }

    initBridges();

    // Cleanup on unmount
    return () => {
      mounted = false;
      console.log('[CaptureApp][Cleanup] Unmounting capture app');
      if (bridgeRef.current) {
        console.log('[CaptureApp][Cleanup] Disconnecting parent bridge');
        bridgeRef.current.disconnect();
      }
      if (crossTabRef.current) {
        console.log('[CaptureApp][Cleanup] Disconnecting cross-tab coordinator');
        crossTabRef.current.disconnect();
      }
    };
  }, [extractMetadata]);

  // Log state changes for debugging
  useEffect(() => {
    if (isConnected && isCrossTabConnected) {
      console.debug('[CaptureApp][Status] Fully connected', {
        parentBridge: isConnected,
        crossTab: isCrossTabConnected,
        tabRef: bridgeRef.current?.getTabRef(),
        recorderState: recorderState.recorderState,
        recorderTabId: recorderState.recorderTabId,
      });
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
