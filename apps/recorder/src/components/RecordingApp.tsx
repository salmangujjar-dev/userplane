/**
 * Recording App
 * Main application component that orchestrates the recording flow
 */

import { useEffect, useState, useRef } from 'react';
import {
  useRecordingFlow,
  type RecordingFlowActions,
  type FlowState,
} from '@/hooks/useRecordingFlow';
import { AppModeProvider, useAppMode, useBridge } from '@/contexts/AppModeContext';
import PreRecordingLoadingScreen from './PreRecordingLoadingScreen';
import ErrorScreen from './ErrorScreen';
import PreRecordingScreen from './PreRecordingScreen';
import PreRecordingCountdownScreen from './PreRecordingCountdownScreen';
import RecordingInProgressScreen from './RecordingInProgressScreen';
import PostRecordingReviewScreen from './PostRecordingReviewScreen';
import PostRecordingUploadScreen from './PostRecordingUploadScreen';
import PostRecordingAckScreen from './PostRecordingAckScreen';
import { classifyError, type RecordingError, type ErrorAction } from '@/types/errors';
import type { RecordingPreferences } from '@/types/session-preferences';
import { getUrlParams, parseWorkspaceIds } from '@/utils/url';
import { URL_PARAMS } from '@/constants';

interface RecordingAppProps {}

/**
 * Root component that provides app mode context
 */
export default function RecordingApp({}: RecordingAppProps = {}) {
  return (
    <AppModeProvider>
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
  // Initialize state from URL immediately to avoid race condition
  const [linkToken, setLinkToken] = useState<string>(() => getUrlParams().token);
  const [action, setAction] = useState<string>(() => getUrlParams().action);
  const [workspaceIds, setWorkspaceIds] = useState<string[]>(() =>
    parseWorkspaceIds(getUrlParams().workspace)
  );

  // Track previous flow state for detecting transitions
  const prevFlowStateRef = useRef<FlowState | null>(null);
  const sessionReportedRef = useRef(false);

  useEffect(() => {
    console.log(
      '[RecordingApp] App mode:',
      mode,
      isEmbedded ? '(running in iframe)' : '(standalone)'
    );
    console.log('[RecordingApp] useEffect - Extracting token, action and workspace from URL');
    console.log('[RecordingApp] Window location:', window.location.href);
    console.log('[RecordingApp] Window search:', window.location.search);

    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get(URL_PARAMS.TOKEN);
    const urlAction = params.get(URL_PARAMS.ACTION);
    const urlWorkspace = params.get(URL_PARAMS.WORKSPACE);

    console.log(
      '[RecordingApp] URL token:',
      urlToken ? 'Present (' + urlToken.length + ' chars)' : 'Missing'
    );
    console.log('[RecordingApp] URL action:', urlAction || 'Missing');
    console.log('[RecordingApp] URL workspace:', urlWorkspace || 'Missing');

    if (urlToken) {
      console.log('[RecordingApp] Setting token:', urlToken.substring(0, 50) + '...');
      setLinkToken(urlToken);
    }

    if (urlAction) {
      console.log('[RecordingApp] Setting action:', urlAction);
      setAction(urlAction);
    }

    if (urlWorkspace) {
      const parsedWorkspaceIds = parseWorkspaceIds(urlWorkspace);
      console.log('[RecordingApp] Setting workspace IDs:', parsedWorkspaceIds);
      setWorkspaceIds(parsedWorkspaceIds);
    }
  }, [mode, isEmbedded]);

  const { state, actions, sessionInfo } = useRecordingFlow(linkToken, action, workspaceIds);

  // Report state changes to parent via bridge (embedded mode only)
  useEffect(() => {
    if (!bridge) return;
    if (state.state === prevFlowStateRef.current) return;

    console.log('[RecordingApp] Flow state changed:', prevFlowStateRef.current, '->', state.state);
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
  }, [bridge, state.state, state.recordingBlob]);

  // Initialize session with parent when ready (embedded mode only)
  useEffect(() => {
    if (!bridge || !isEmbedded || sessionReportedRef.current) return;

    // Initialize session when we have session info and are in setup state
    if (sessionInfo && state.state === 'setup') {
      console.log('[RecordingApp] Initializing session with parent');
      bridge.initSession(sessionInfo);
      sessionReportedRef.current = true;
    }
  }, [bridge, isEmbedded, sessionInfo, state.state]);

  /**
   * Submit recording with custom metadata from host (in embedded mode)
   * Fetches metadata from the host application via bridge before submitting
   */
  const handleSubmitRecording = async () => {
    let customMetadata: Record<string, unknown> | null = null;

    // In embedded mode, fetch custom metadata from host before submitting
    if (isEmbedded && bridge) {
      console.log('[RecordingApp] Fetching custom metadata from host...');
      customMetadata = await bridge.getCustomMetadata();
      if (customMetadata) {
        console.log('[RecordingApp] Got custom metadata:', customMetadata);
      } else {
        console.log('[RecordingApp] No custom metadata from host');
      }
    }

    await actions.submitRecording(customMetadata);
  };

  console.log('[RecordingApp] Current state:', state.state);
  console.log('[RecordingApp] Error:', state.error);
  console.log('[RecordingApp] Recording mode:', state.recordingMode);
  console.log('[RecordingApp] Has recording blob:', !!state.recordingBlob);
  console.log('[RecordingApp] Upload progress:', state.uploadProgress + '%');

  switch (state.state) {
    case 'loading':
      console.log('[RecordingApp] Rendering: PreRecordingLoadingScreen');
      return <PreRecordingLoadingScreen />;

    case 'error':
      const classifiedError = classifyError(state.error);

      console.log('[RecordingApp] Rendering: ErrorScreen');
      console.log('[RecordingApp] Has recording blob:', !!state.recordingBlob);
      console.log('[RecordingApp] Error:', classifiedError.title);
      console.log('[RecordingApp] Primary action:', classifiedError.primaryAction?.action);
      console.log('[RecordingApp] Error message:', classifiedError.message);

      return renderErrorScreen(classifiedError, state.preferences, actions);

    case 'setup':
      console.log('[RecordingApp] Rendering: PreRecordingScreen');
      console.log('[RecordingApp] Requester name:', state.requesterName);
      console.log(
        '[RecordingApp] Company name:',
        state.preferences.companyName || '(not provided)'
      );
      console.log(
        '[RecordingApp] Max duration:',
        `${state.maxRecordingDurationMs}ms (${Math.round(state.maxRecordingDurationMs / 1000)}s)`
      );
      console.log(
        '[RecordingApp] Max size:',
        state.maxRecordingSize ? `${state.maxRecordingSize} bytes` : '(unlimited)'
      );
      console.log('[RecordingApp] Preferences:', state.preferences);
      return (
        <PreRecordingScreen
          requesterName={state.requesterName}
          preferences={state.preferences}
          onStartRecording={actions.startRecording}
        />
      );

    case 'countdown':
      console.log('[RecordingApp] Rendering: PreRecordingCountdownScreen');
      console.log('[RecordingApp] Countdown seconds:', state.countdownSeconds);
      console.log('[RecordingApp] Media stream available:', !!state.mediaStream);
      return (
        <PreRecordingCountdownScreen
          countdownSeconds={state.countdownSeconds}
          mediaStream={state.mediaStream}
          preferences={state.preferences}
        />
      );

    case 'recording':
      console.log('[RecordingApp] Rendering: RecordingInProgressScreen');
      console.log('[RecordingApp] Media stream available:', !!state.mediaStream);
      return (
        <RecordingInProgressScreen
          mediaStream={state.mediaStream}
          preferences={state.preferences}
          isProcessing={state.isProcessing}
          onStopRecording={actions.stopRecording}
        />
      );

    case 'review':
      console.log('[RecordingApp] Rendering: PostRecordingReviewScreen');
      console.log('[RecordingApp] Video URL available:', !!state.videoUrl);

      if (!state.videoUrl) {
        console.error('[RecordingApp] No video URL in review state');
        return <PreRecordingLoadingScreen />;
      }

      return (
        <PostRecordingReviewScreen
          videoUrl={state.videoUrl}
          preferences={state.preferences}
          onSubmit={handleSubmitRecording}
          onStartOver={actions.startOver}
        />
      );

    case 'uploading':
      console.log('[RecordingApp] Rendering: PostRecordingUploadScreen');
      console.log('[RecordingApp] Upload progress:', state.uploadProgress + '%');

      if (!state.videoUrl) {
        console.error('[RecordingApp] No video URL in uploading state');
        return <PreRecordingLoadingScreen />;
      }

      return (
        <PostRecordingUploadScreen
          videoUrl={state.videoUrl}
          progress={state.uploadProgress}
          preferences={state.preferences}
        />
      );

    case 'success':
      console.log('[RecordingApp] Rendering: PostRecordingAckScreen');
      return <PostRecordingAckScreen preferences={state.preferences} />;

    default:
      console.log('[RecordingApp] Unknown state, rendering: PreRecordingLoadingScreen');
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
        console.log('[RecordingApp] Reloading page');
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
