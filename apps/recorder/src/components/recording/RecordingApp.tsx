/**
 * Recording App
 * Main application component that orchestrates the recording flow
 * Handles cross-tab coordination to ensure only one recorder is active at a time
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { URL_PARAMS } from '@/constants';
import {
  AppModeProvider,
  useAppMode,
  useBridge,
  useCrossTab,
  useCrossTabLock,
} from '@/contexts/AppModeContext';
import {
  type FlowState,
  type RecordingFlowActions,
  useRecordingFlow,
} from '@/hooks/useRecordingFlow';
import { createLogger } from '@/lib/logger';
import { classifyError, type ErrorAction, type RecordingError } from '@/types/errors';
import type { RecordingPreferences } from '@/types/session-preferences';
import { getUrlParams, parseWorkspaceIds } from '@/utils/url';

import ErrorScreen from './ErrorScreen';
import PostRecordingAckScreen from './PostRecordingAckScreen';
import PostRecordingReviewScreen from './PostRecordingReviewScreen';
import PostRecordingUploadScreen from './PostRecordingUploadScreen';
import PreRecordingCountdownScreen from './PreRecordingCountdownScreen';
import PreRecordingLoadingScreen from './PreRecordingLoadingScreen';
import PreRecordingScreen from './PreRecordingScreen';
import RecordingInProgressScreen from './RecordingInProgressScreen';
import SettingsDropdown from './SettingsDropdown';

const logger = createLogger('recording-app');

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface RecordingAppProps {}

/**
 * Root component that provides app mode context
 */
// eslint-disable-next-line no-empty-pattern
export default function RecordingApp({}: RecordingAppProps = {}) {
  return (
    <AppModeProvider actionType="recording">
      <RecordingAppContent />
    </AppModeProvider>
  );
}

/**
 * Main content component that uses the app mode context
 */
function RecordingAppContent() {
  const { mode, isEmbedded } = useAppMode();
  const bridge = useBridge();
  const crossTab = useCrossTab();
  const crossTabLock = useCrossTabLock();

  // Initialize state from URL immediately to avoid race condition
  const [linkToken, setLinkToken] = useState<string>(() => getUrlParams().token);
  const [action, setAction] = useState<string>(() => getUrlParams().action);
  const [workspaceIds, setWorkspaceIds] = useState<string[]>(() =>
    parseWorkspaceIds(getUrlParams().workspace)
  );

  // Track previous flow state for detecting transitions
  const prevFlowStateRef = useRef<FlowState | null>(null);
  const sessionReportedRef = useRef(false);

  // User override for blur preference (null = use session preference)
  const [blurOverride, setBlurOverride] = useState<boolean | null>(null);

  // IMPORTANT: All hooks must be called unconditionally (Rules of Hooks)
  // Initialize recording flow - this hook must always be called
  const { state, actions, sessionInfo } = useRecordingFlow(linkToken, action, workspaceIds);

  // Effective blur state: user override if set, otherwise use session preference
  // No effect needed - just derive directly from state
  const effectiveBlurEnabled =
    blurOverride !== null ? blurOverride : (state.preferences?.hideSensitive ?? false);

  // Handle user blur toggle - sets override
  const handleBlurToggle = useCallback((enabled: boolean) => {
    logger.debug({ enabled }, 'blur toggled');
    setBlurOverride(enabled);
  }, []);

  // Effect to extract URL params
  useEffect(() => {
    logger.debug({ mode, isEmbedded, lockStatus: crossTabLock.status }, 'app initialized');

    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get(URL_PARAMS.TOKEN);
    const urlAction = params.get(URL_PARAMS.ACTION);
    const urlWorkspace = params.get(URL_PARAMS.WORKSPACE);

    if (urlToken) {
      setLinkToken(urlToken);
    }
    if (urlAction) {
      setAction(urlAction);
    }
    if (urlWorkspace) {
      setWorkspaceIds(parseWorkspaceIds(urlWorkspace));
    }
  }, [mode, isEmbedded, crossTabLock.status]);

  // Report state changes to parent via bridge (embedded mode only)
  // This effect must be called unconditionally - the guard is inside the effect
  useEffect(() => {
    // Skip if not in embedded mode or cross-tab not acquired
    if (!isEmbedded || !crossTabLock.isAcquired) return;
    if (!bridge) return;
    if (state.state === prevFlowStateRef.current) return;

    logger.debug({ from: prevFlowStateRef.current, to: state.state }, 'flow state changed');
    prevFlowStateRef.current = state.state;

    // Notify parent based on flow state
    switch (state.state) {
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
        // Error with recording blob = retained, otherwise inactive
        if (state.recordingBlob) {
          bridge.recordingRetained();
        } else {
          bridge.recordingInactive();
        }
        break;
    }
  }, [bridge, isEmbedded, crossTabLock.isAcquired, state.state, state.recordingBlob]);

  // Control privacy blur via cross-tab broadcast to capture iframes (embedded mode only)
  // Uses effectiveBlurEnabled which respects user toggle override
  // Track previous blur state to only trigger on actual changes
  const prevBlurStateRef = useRef<'active' | 'inactive' | null>(null);

  useEffect(() => {
    // Skip if not in embedded mode or cross-tab not acquired
    if (!isEmbedded || !crossTabLock.isAcquired) return;
    if (!crossTab) return;

    // Determine blur state based on flow state AND user preference
    // Only blur during active recording (countdown/recording) if blur is enabled
    // Stop blur for all other states including retained (review/uploading)
    const shouldBlur =
      effectiveBlurEnabled && (state.state === 'countdown' || state.state === 'recording');
    const blurState = shouldBlur ? 'active' : 'inactive';

    // Skip if blur state hasn't changed
    if (blurState === prevBlurStateRef.current) return;

    const prevBlurState = prevBlurStateRef.current;
    prevBlurStateRef.current = blurState;

    logger.debug(
      { from: prevBlurState, to: blurState, flowState: state.state },
      'blur state changed'
    );

    if (blurState === 'active') {
      // Start blur when recording becomes active (and blur is enabled)
      logger.debug('broadcasting blur start');
      crossTab.broadcastStartBlurr();
    } else if (blurState === 'inactive' && prevBlurState === 'active') {
      // Stop blur when transitioning from active to inactive
      logger.debug('broadcasting blur stop');
      crossTab.broadcastStopBlurr();
    }
  }, [crossTab, isEmbedded, crossTabLock.isAcquired, state.state, effectiveBlurEnabled]);

  // Initialize session with parent when ready (embedded mode only)
  // This effect must be called unconditionally - the guard is inside the effect
  useEffect(() => {
    // Skip if not in embedded mode or cross-tab not acquired
    if (!isEmbedded || !crossTabLock.isAcquired) return;
    if (!bridge || sessionReportedRef.current) return;

    // Initialize session when we have session info and are in setup state
    if (sessionInfo && state.state === 'setup') {
      logger.debug('initializing session with parent');
      bridge.initSession(sessionInfo);
      sessionReportedRef.current = true;
    }
  }, [bridge, isEmbedded, crossTabLock.isAcquired, sessionInfo, state.state]);

  /**
   * Gather metadata from all capture iframes via scatter-gather
   * Returns unified metadata if all tabs identical, per-tab structure otherwise
   */
  const gatherMetadataFromCaptureTabs = async (): Promise<Record<string, unknown> | null> => {
    if (!crossTab) return null;

    const scatterResult = await crossTab.scatterGatherMetadata(3000);
    logger.debug(
      {
        responded: scatterResult.respondedTabs.length,
        timedOut: scatterResult.timedOutTabs.length,
      },
      'scatter-gather complete'
    );

    // Build per-tab metadata map
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

    // Extract custom metadata (everything except _pageUrl, _pageTitle)
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
  };

  /**
   * Submit recording with metadata from capture iframes
   */
  const handleSubmitRecording = async () => {
    let customMetadata: Record<string, unknown> | null = null;

    if (isEmbedded && crossTab) {
      logger.debug('gathering metadata from capture tabs');
      try {
        customMetadata = await gatherMetadataFromCaptureTabs();
      } catch (err) {
        logger.warn({ err }, 'metadata collection failed (non-fatal)');
      }
    }

    await actions.submitRecording(customMetadata);
  };

  // === ALL HOOKS ABOVE THIS LINE ===
  // Now we can have conditional returns

  // In embedded mode, check cross-tab status before showing recording UI
  if (isEmbedded) {
    if (crossTabLock.isPending) {
      return <PreRecordingLoadingScreen />;
    }

    if (crossTabLock.isBlocked) {
      return (
        <ErrorScreen
          title="Recorder Already Active"
          subtitle={
            crossTabLock.error ||
            'Another recorder is currently active. Only one recorder can be active at a time across all tabs.'
          }
        />
      );
    }
  }

  // Settings dropdown for embedded mode (blur control, etc.)
  // Only show when we have preferences and in embedded mode
  // Toggle is always enabled - blur can be toggled even during recording
  // The blur effect handles broadcasting changes to capture iframes
  const settingsElement =
    isEmbedded && state.preferences ? (
      <SettingsDropdown isBlurEnabled={effectiveBlurEnabled} onBlurToggle={handleBlurToggle} />
    ) : null;

  switch (state.state) {
    case 'loading':
      return <PreRecordingLoadingScreen />;

    case 'error': {
      const classifiedError = classifyError(state.error);

      return renderErrorScreen(classifiedError, state.preferences, actions);
    }

    case 'setup':
      return (
        <PreRecordingScreen
          requesterName={state.requesterName}
          preferences={state.preferences}
          onStartRecording={actions.startRecording}
          settingsElement={settingsElement}
        />
      );

    case 'countdown':
      return (
        <PreRecordingCountdownScreen
          countdownSeconds={state.countdownSeconds}
          mediaStream={state.mediaStream}
          preferences={state.preferences}
          settingsElement={settingsElement}
        />
      );

    case 'recording':
      return (
        <RecordingInProgressScreen
          mediaStream={state.mediaStream}
          preferences={state.preferences}
          isProcessing={state.isProcessing}
          onStopRecording={actions.stopRecording}
          settingsElement={settingsElement}
        />
      );

    case 'review':
      if (!state.videoUrl) {
        logger.error('no video URL in review state');
        return <PreRecordingLoadingScreen />;
      }

      return (
        <PostRecordingReviewScreen
          videoUrl={state.videoUrl}
          preferences={state.preferences}
          onSubmit={handleSubmitRecording}
          onStartOver={actions.startOver}
          settingsElement={settingsElement}
        />
      );

    case 'uploading':
      if (!state.videoUrl) {
        logger.error('no video URL in uploading state');
        return <PreRecordingLoadingScreen />;
      }

      return (
        <PostRecordingUploadScreen
          videoUrl={state.videoUrl}
          progress={state.uploadProgress}
          preferences={state.preferences}
          settingsElement={settingsElement}
        />
      );

    case 'success':
      return (
        <PostRecordingAckScreen preferences={state.preferences} settingsElement={settingsElement} />
      );

    default:
      return <PreRecordingLoadingScreen />;
  }
}

/**
 * Map action type to handler function
 */
function getActionHandler(action: ErrorAction, actions: RecordingFlowActions): () => void {
  switch (action) {
    case 'retry-upload':
      return actions.retryUpload;
    case 'reload':
      return () => {
        logger.debug('reloading page');
        window.location.reload();
      };
    case 'start-over':
      return actions.startOver;
  }
}

/**
 * Renders the error screen with appropriate actions
 */
function renderErrorScreen(
  error: RecordingError,
  preferences: RecordingPreferences,
  actions: RecordingFlowActions
) {
  const onPrimaryAction = error.primaryAction
    ? getActionHandler(error.primaryAction.action, actions)
    : undefined;

  const onSecondaryAction = error.secondaryAction
    ? getActionHandler(error.secondaryAction.action, actions)
    : undefined;

  return (
    <ErrorScreen
      title={error.title}
      subtitle={error.message}
      preferences={preferences}
      primaryActionText={error.primaryAction?.label}
      onPrimaryAction={onPrimaryAction}
      secondaryActionText={error.secondaryAction?.label}
      onSecondaryAction={onSecondaryAction}
    />
  );
}
