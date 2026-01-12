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

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  CaptureBridgeConnection,
  getCaptureBridge,
  getCrossTabCoordinator,
  CrossTabCoordinator,
  CONNECTION_PREFIXES,
  type CaptureRecorderState,
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
    recorderId: null,
    recorderState: 'inactive',
    tabRef: '',
  });

  // Metadata extractor function - called by cross-tab coordinator during scatter-gather
  // Builds flattened TabMetadata - system keys prefixed, custom metadata spread
  const extractMetadata = useCallback((): TabMetadata | null => {
    const bridge = bridgeRef.current;
    if (!bridge || !bridge.isConnected()) {
      console.log('[CaptureApp] Cannot extract metadata - bridge not connected');
      return null;
    }

    const metadata: TabMetadata = {
      _pageUrl: bridge.getPageUrl(),
      _pageTitle: bridge.getPageTitle(),
      ...(bridge.getCustomMetadata() || {}),
    };

    console.log('[CaptureApp] Extracted metadata:', metadata._pageUrl);
    return metadata;
  }, []);

  // Initialize and connect bridges
  useEffect(() => {
    let mounted = true;

    async function initBridges() {
      try {
        console.log('[CaptureApp] Initializing capture bridges');

        // 1. Connect to parent SDK via postbridge
        const bridge = getCaptureBridge({
          onRecorderStateChange: (state) => {
            if (mounted) {
              console.log('[CaptureApp] Recorder state changed:', state);
              setRecorderState(state);
            }
          },
        });

        bridgeRef.current = bridge;

        await bridge.connect();

        if (!mounted) return;

        console.log('[CaptureApp] Parent bridge connected');
        setIsConnected(true);

        // Initialize recorder state from bridge
        setRecorderState(bridge.getCurrentRecorderState());

        // 2. Connect to cross-tab coordinator (SharedWorker)
        // Use a prefixed tab ID for this capture iframe
        const tabRef = bridge.getTabRef();
        const captureTabId = tabRef ? `${CONNECTION_PREFIXES.CAPTURE}_${tabRef}` : undefined;

        const crossTab = getCrossTabCoordinator({
          channel: 'userplane', // Use same channel as recorder
          callbacks: {
            onRecorderStateChanged: (tabId, state) => {
              if (mounted) {
                console.log('[CaptureApp] Cross-tab recorder state:', { tabId, state });
                setRecorderState((prev) => ({
                  ...prev,
                  recorderId: tabId,
                  recorderState: state,
                }));
              }
            },
          },
        });

        crossTabRef.current = crossTab;

        // Register metadata extractor before connecting
        crossTab.setMetadataExtractor(extractMetadata);

        await crossTab.connect(captureTabId);

        if (!mounted) return;

        console.log('[CaptureApp] Cross-tab coordinator connected with ID:', captureTabId);
        setIsCrossTabConnected(true);
      } catch (err) {
        console.error('[CaptureApp] Failed to initialize bridges:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to connect');
        }
      }
    }

    initBridges();

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (bridgeRef.current) {
        console.log('[CaptureApp] Disconnecting parent bridge');
        bridgeRef.current.disconnect();
      }
      if (crossTabRef.current) {
        console.log('[CaptureApp] Disconnecting cross-tab coordinator');
        crossTabRef.current.disconnect();
      }
    };
  }, [extractMetadata]);

  // Log state changes for debugging
  useEffect(() => {
    if (isConnected && isCrossTabConnected) {
      console.log('[CaptureApp] Fully connected:', {
        parentBridge: isConnected,
        crossTab: isCrossTabConnected,
        tabRef: bridgeRef.current?.getTabRef(),
        recorderState,
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
      data-recorder-id={recorderState.recorderId ?? undefined}
      data-cross-tab={isCrossTabConnected ? 'connected' : 'disconnected'}
    />
  );
}
