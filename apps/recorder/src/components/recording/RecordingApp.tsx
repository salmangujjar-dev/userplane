/**
 * Recording App
 * Main application component that orchestrates the recording flow
 * Handles cross-tab coordination to ensure only one recorder is active at a time
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

import { AppModeProvider, useAppMode, useCrossTabLock } from '@/contexts/AppModeContext';
import { useEmbeddedBridgeSync } from '@/hooks/useEmbeddedBridgeSync';
import { type RecordingFlowActions, useRecordingFlow } from '@/hooks/useRecordingFlow';
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
  const crossTabLock = useCrossTabLock();

  // Extract URL params once on mount (stable values)
  const urlParams = useMemo(() => getUrlParams(), []);
  const linkToken = urlParams.token;
  const action = urlParams.action;
  const workspaceIds = useMemo(() => parseWorkspaceIds(urlParams.workspace), [urlParams.workspace]);

  // User override for blur preference (null = use session preference)
  const [blurOverride, setBlurOverride] = useState<boolean | null>(null);

  // IMPORTANT: All hooks must be called unconditionally (Rules of Hooks)
  // Initialize recording flow - this hook must always be called
  const { state, actions, sessionInfo } = useRecordingFlow(linkToken, action, workspaceIds);

  // Effective blur state: user override if set, otherwise use session preference
  const effectiveBlurEnabled =
    blurOverride !== null ? blurOverride : (state.preferences?.hideSensitive ?? false);

  // Handle user blur toggle - sets override
  const handleBlurToggle = useCallback((enabled: boolean) => {
    logger.debug({ enabled }, 'blur toggled');
    setBlurOverride(enabled);
  }, []);

  // Log app initialization on mode/lock changes
  useEffect(() => {
    logger.debug({ mode, isEmbedded, lockStatus: crossTabLock.status }, 'app initialized');
  }, [mode, isEmbedded, crossTabLock.status]);

  // Bridge sync: state reporting, blur control, session init, metadata gathering
  const { gatherAndMergeMetadata } = useEmbeddedBridgeSync({
    isEmbedded,
    flowState: state.state,
    recordingBlob: state.recordingBlob,
    effectiveBlurEnabled,
    sessionInfo,
  });

  const handleSubmitRecording = useCallback(
    async (notes?: string) => {
      const customMetadata = await gatherAndMergeMetadata();
      await actions.submitRecording(customMetadata, notes);
    },
    [gatherAndMergeMetadata, actions]
  );

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
