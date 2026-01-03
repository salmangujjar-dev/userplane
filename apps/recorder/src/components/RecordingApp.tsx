/**
 * Recording App
 * Main application component that orchestrates the recording flow
 */

import { useEffect, useState } from 'react';
import { useRecordingFlow, type RecordingFlowActions } from '@/hooks/useRecordingFlow';
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

interface RecordingAppProps {
  linkToken?: string | null;
  action?: string | null;
}

export default function RecordingApp({
  linkToken: propToken,
  action: propAction,
}: RecordingAppProps) {
  const [linkToken, setLinkToken] = useState<string | null>(propToken || null);
  const [action, setAction] = useState<string | null>(propAction || null);

  useEffect(() => {
    console.log('[RecordingApp] useEffect - Extracting token and action from URL');
    console.log(
      '[RecordingApp] Prop token:',
      propToken ? 'Present (' + propToken.length + ' chars)' : 'NULL'
    );
    console.log('[RecordingApp] Prop action:', propAction || 'NULL');
    console.log('[RecordingApp] Window location:', window.location.href);
    console.log('[RecordingApp] Window search:', window.location.search);

    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('userplane-token');
    const urlAction = params.get('userplane-action');

    console.log(
      '[RecordingApp] URL token from URLSearchParams:',
      urlToken ? 'Present (' + urlToken.length + ' chars)' : 'NULL'
    );
    console.log('[RecordingApp] URL action from URLSearchParams:', urlAction || 'NULL');

    if (urlToken) {
      console.log('[RecordingApp] Setting token from URL:', urlToken.substring(0, 50) + '...');
      setLinkToken(urlToken);
    } else if (propToken) {
      console.log('[RecordingApp] Using token from props:', propToken.substring(0, 50) + '...');
      setLinkToken(propToken);
    } else {
      console.error('[RecordingApp] No token found in URL or props!');
    }

    if (urlAction) {
      console.log('[RecordingApp] Setting action from URL:', urlAction);
      setAction(urlAction);
    } else if (propAction) {
      console.log('[RecordingApp] Using action from props:', propAction);
      setAction(propAction);
    } else {
      console.error('[RecordingApp] No action found in URL or props!');
    }
  }, [propToken, propAction]);

  const { state, actions } = useRecordingFlow(linkToken, action);

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
          onSubmit={actions.submitRecording}
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
