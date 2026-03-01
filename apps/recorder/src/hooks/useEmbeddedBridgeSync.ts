/**
 * Embedded Bridge Sync Hook
 * Manages bridge communication, blur control, session initialization,
 * and metadata gathering for embedded (iframe) recording mode.
 *
 * Extracted from RecordingAppContent to reduce component complexity.
 */

import { useCallback, useEffect, useRef } from 'react';

import type { AggregatedLogs, LogCapturePreferences } from '@/bridge/types';
import {
  type RecordingSessionInfo,
  useBridge,
  useCrossTab,
  useCrossTabLock,
} from '@/contexts/AppModeContext';
import { env } from '@/env';
import type { FlowState } from '@/hooks/useRecordingFlow';
import { createLogger } from '@/lib/logger';
import { parseMetaParams } from '@/utils/url';

const logger = createLogger('embedded-bridge-sync');

interface UseEmbeddedBridgeSyncOptions {
  isEmbedded: boolean;
  flowState: FlowState;
  recordingBlob?: Blob | null;
  effectiveBlurEnabled: boolean;
  sessionInfo: RecordingSessionInfo | null;
  preferences?: {
    captureClientLog?: boolean;
    captureNetworkLog?: boolean;
    captureClientAction?: boolean;
  } | null;
}

interface UseEmbeddedBridgeSyncResult {
  gatherAndMergeMetadata: () => Promise<Record<string, unknown> | null>;
  gatherLogs: () => Promise<AggregatedLogs | null>;
}

export function useEmbeddedBridgeSync({
  isEmbedded,
  flowState,
  recordingBlob,
  effectiveBlurEnabled,
  sessionInfo,
  preferences,
}: UseEmbeddedBridgeSyncOptions): UseEmbeddedBridgeSyncResult {
  const bridge = useBridge();
  const crossTab = useCrossTab();
  const crossTabLock = useCrossTabLock();

  const prevFlowStateRef = useRef<FlowState | null>(null);
  const sessionReportedRef = useRef(false);
  const prevBlurStateRef = useRef<'active' | 'inactive' | null>(null);
  const prevLogCaptureStateRef = useRef<'active' | 'inactive' | null>(null);

  // Report state changes to parent via bridge (embedded mode only)
  useEffect(() => {
    if (!isEmbedded || !crossTabLock.isAcquired) return;
    if (!bridge) return;
    if (flowState === prevFlowStateRef.current) return;

    logger.debug({ from: prevFlowStateRef.current, to: flowState }, 'flow state changed');
    prevFlowStateRef.current = flowState;

    switch (flowState) {
      case 'countdown':
      case 'recording':
        bridge.recordingActive();
        break;
      case 'review':
      case 'uploading':
        bridge.recordingRetained();
        break;
      case 'loading':
      case 'setup':
      case 'success':
        bridge.recordingInactive();
        break;
      case 'error':
        if (recordingBlob) {
          bridge.recordingRetained();
        } else {
          bridge.recordingInactive();
        }
        break;
    }
  }, [bridge, isEmbedded, crossTabLock.isAcquired, flowState, recordingBlob]);

  // Control privacy blur via cross-tab broadcast to capture iframes
  useEffect(() => {
    if (!isEmbedded || !crossTabLock.isAcquired) return;
    if (!crossTab) return;

    const shouldBlur =
      effectiveBlurEnabled && (flowState === 'countdown' || flowState === 'recording');
    const blurState = shouldBlur ? 'active' : 'inactive';

    if (blurState === prevBlurStateRef.current) return;

    const prevBlurState = prevBlurStateRef.current;
    prevBlurStateRef.current = blurState;

    logger.debug({ from: prevBlurState, to: blurState, flowState }, 'blur state changed');

    if (blurState === 'active') {
      logger.debug('broadcasting blur start');
      crossTab.broadcastStartBlurr();
    } else if (blurState === 'inactive' && prevBlurState === 'active') {
      logger.debug('broadcasting blur stop');
      crossTab.broadcastStopBlurr();
    }
  }, [crossTab, isEmbedded, crossTabLock.isAcquired, flowState, effectiveBlurEnabled]);

  // Control log capture via cross-tab broadcast to capture iframes
  useEffect(() => {
    if (!isEmbedded || !crossTabLock.isAcquired) {
      logger.debug(
        { isEmbedded, lockAcquired: crossTabLock.isAcquired },
        'log capture effect skipped (not embedded or no lock)'
      );
      return;
    }
    if (!crossTab || !sessionInfo) {
      logger.debug(
        { hasCrossTab: !!crossTab, hasSessionInfo: !!sessionInfo },
        'log capture effect skipped (no crossTab or sessionInfo)'
      );
      return;
    }

    const hasLogPrefs = !!(
      preferences?.captureClientLog ||
      preferences?.captureNetworkLog ||
      preferences?.captureClientAction
    );
    const isRecordingPhase = flowState === 'countdown' || flowState === 'recording';
    const shouldCapture = hasLogPrefs && isRecordingPhase;
    const logCaptureState = shouldCapture ? 'active' : 'inactive';

    logger.debug(
      {
        hasLogPrefs,
        isRecordingPhase,
        shouldCapture,
        flowState,
        captureClientLog: preferences?.captureClientLog,
        captureNetworkLog: preferences?.captureNetworkLog,
        captureClientAction: preferences?.captureClientAction,
        prev: prevLogCaptureStateRef.current,
        next: logCaptureState,
      },
      'log capture effect evaluated'
    );

    if (logCaptureState === prevLogCaptureStateRef.current) return;

    const prevLogCaptureState = prevLogCaptureStateRef.current;
    prevLogCaptureStateRef.current = logCaptureState;

    logger.debug(
      { from: prevLogCaptureState, to: logCaptureState, flowState },
      'log capture state changed'
    );

    if (logCaptureState === 'active') {
      const logPrefs: LogCapturePreferences = {
        captureConsole: preferences?.captureClientLog ?? false,
        captureNetwork: preferences?.captureNetworkLog ?? false,
        captureAction: preferences?.captureClientAction ?? false,
      };
      const internalEndpoints = env.api.url ? [env.api.url] : undefined;
      logger.debug(
        { logPrefs, sessionId: sessionInfo.sessionId, internalEndpoints },
        'broadcasting log capture start'
      );
      crossTab.broadcastStartLogCapture(
        logPrefs,
        sessionInfo.sessionId,
        sessionInfo.workspaceId,
        internalEndpoints
      );
    } else if (logCaptureState === 'inactive' && prevLogCaptureState === 'active') {
      logger.debug('broadcasting log capture stop');
      crossTab.broadcastStopLogCapture();
    }
  }, [crossTab, isEmbedded, crossTabLock.isAcquired, flowState, sessionInfo, preferences]);

  // Initialize session with parent when ready
  useEffect(() => {
    if (!isEmbedded || !crossTabLock.isAcquired) return;
    if (!bridge || sessionReportedRef.current) return;

    if (sessionInfo && flowState === 'setup') {
      logger.debug('initializing session with parent');
      bridge.initSession(sessionInfo);
      sessionReportedRef.current = true;
    }
  }, [bridge, isEmbedded, crossTabLock.isAcquired, sessionInfo, flowState]);

  /**
   * Gather metadata from all capture iframes via scatter-gather
   * Returns unified metadata if all tabs identical, per-tab structure otherwise
   */
  const gatherMetadataFromCaptureTabs = useCallback(async (): Promise<Record<
    string,
    unknown
  > | null> => {
    if (!crossTab) return null;

    const scatterResult = await crossTab.scatterGatherMetadata(3000);
    logger.debug(
      {
        responded: scatterResult.respondedTabs.length,
        timedOut: scatterResult.timedOutTabs.length,
      },
      'scatter-gather complete'
    );

    const allTabsMetadata: Record<string, Record<string, unknown>> = {};

    if (scatterResult.perTab) {
      for (const [tabId, entry] of Object.entries(scatterResult.perTab)) {
        allTabsMetadata[tabId] = entry as Record<string, unknown>;
      }
    } else if (scatterResult.unified && scatterResult.respondedTabs.length > 0) {
      for (const tabId of scatterResult.respondedTabs) {
        allTabsMetadata[tabId] = {
          _pageUrl: '',
          _pageTitle: '',
          ...((scatterResult.unified as Record<string, unknown>) || {}),
        };
      }
    }

    if (Object.keys(allTabsMetadata).length === 0) {
      logger.debug('no metadata from any tab');
      return null;
    }

    const extractCustom = (entry: Record<string, unknown>) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _pageUrl, _pageTitle, ...custom } = entry;
      return custom;
    };

    const allCustomMetadata = Object.values(allTabsMetadata).map(extractCustom);
    const allIdentical = allCustomMetadata.every(
      (m) => JSON.stringify(m) === JSON.stringify(allCustomMetadata[0])
    );

    if (allIdentical && Object.keys(allCustomMetadata[0] || {}).length > 0) {
      logger.debug({ unified: true }, 'metadata aggregated');
      return allCustomMetadata[0] as Record<string, unknown>;
    }

    logger.debug({ unified: false }, 'metadata aggregated');
    return allTabsMetadata;
  }, [crossTab]);

  /**
   * Gather metadata from capture tabs and merge with URL meta params
   */
  const gatherAndMergeMetadata = useCallback(async (): Promise<Record<string, unknown> | null> => {
    const urlMeta = parseMetaParams();

    let bridgeMetadata: Record<string, unknown> | null = null;
    if (isEmbedded && crossTab) {
      logger.debug('gathering metadata from capture tabs');
      try {
        bridgeMetadata = await gatherMetadataFromCaptureTabs();
      } catch (err) {
        logger.warn({ err }, 'metadata collection failed (non-fatal)');
      }
    }

    if (urlMeta || bridgeMetadata) {
      return { ...(urlMeta ?? {}), ...(bridgeMetadata ?? {}) };
    }

    return null;
  }, [isEmbedded, crossTab, gatherMetadataFromCaptureTabs]);

  /**
   * Gather logs from all capture iframes via scatter-gather
   * Returns aggregated logs from all tabs, or null if not available
   */
  const gatherLogs = useCallback(async (): Promise<AggregatedLogs | null> => {
    if (!crossTab || !isEmbedded) return null;

    try {
      logger.debug('gathering logs from capture tabs');
      const aggregatedLogs = await crossTab.scatterGatherLogs(5000);
      logger.debug(
        {
          responded: aggregatedLogs.respondedTabs.length,
          timedOut: aggregatedLogs.timedOutTabs.length,
        },
        'log scatter-gather complete'
      );
      return aggregatedLogs;
    } catch (err) {
      logger.warn({ err }, 'log collection failed (non-fatal)');
      return null;
    }
  }, [crossTab, isEmbedded]);

  return { gatherAndMergeMetadata, gatherLogs };
}
