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
import {
  classifyError,
  RecoveryStrategy,
  ErrorCategory,
  type RecordingError,
} from '@/types/errors';
import type { RecordingPreferences } from '@/types/session-preferences';

interface RecordingAppProps {
  linkToken?: string | null;
}

export default function RecordingApp({ linkToken: propToken }: RecordingAppProps) {
  const [linkToken, setLinkToken] = useState<string | null>(propToken || null);

  useEffect(() => {
    console.log('[RecordingApp] useEffect - Extracting token from URL');
    console.log(
      '[RecordingApp] Prop token:',
      propToken ? 'Present (' + propToken.length + ' chars)' : 'NULL'
    );
    console.log('[RecordingApp] Window location:', window.location.href);
    console.log('[RecordingApp] Window search:', window.location.search);

    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');

    console.log(
      '[RecordingApp] URL token from URLSearchParams:',
      urlToken ? 'Present (' + urlToken.length + ' chars)' : 'NULL'
    );

    if (urlToken) {
      console.log('[RecordingApp] Setting token from URL:', urlToken.substring(0, 50) + '...');
      setLinkToken(urlToken);
    } else if (propToken) {
      console.log('[RecordingApp] Using token from props:', propToken.substring(0, 50) + '...');
      setLinkToken(propToken);
    } else {
      console.error('[RecordingApp] No token found in URL or props!');
    }
  }, [propToken]);

  const { state, actions } = useRecordingFlow(linkToken);

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
      const isPostRecordingError = !!state.recordingBlob;
      const classifiedError = classifyError(state.error, isPostRecordingError);

      console.log('[RecordingApp] Rendering: ErrorScreen');
      console.log('[RecordingApp] Has recording blob:', !!state.recordingBlob);
      console.log('[RecordingApp] Error category:', classifiedError.category);
      console.log('[RecordingApp] Recovery strategy:', classifiedError.recoveryStrategy);
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
 * Renders the error screen with appropriate actions based on error type
 */
function renderErrorScreen(
  error: RecordingError,
  preferences: RecordingPreferences,
  actions: RecordingFlowActions
) {
  // Determine primary action based on recovery strategy
  let primaryActionText = error.primaryActionText;
  let onPrimaryAction: (() => void) | undefined;

  switch (error.recoveryStrategy) {
    case RecoveryStrategy.AUTO_RETRY:
      // Auto-retry errors: Show manual retry button after auto-retry attempts
      // For upload errors, use smart retry that preserves upload state
      if (error.category === ErrorCategory.UPLOAD) {
        onPrimaryAction = actions.retryUpload;
      } else {
        // For network errors, reload the page
        onPrimaryAction = () => {
          console.log('[RecordingApp] Manual retry - refreshing page');
          window.location.reload();
        };
      }
      break;

    case RecoveryStrategy.MANUAL_RETRY:
      // Manual retry errors: User action required (e.g., grant permission)
      onPrimaryAction = () => {
        console.log('[RecordingApp] Retrying - refreshing page');
        window.location.reload();
      };
      break;

    case RecoveryStrategy.START_OVER:
      onPrimaryAction = actions.startOver;
      break;

    case RecoveryStrategy.NONE:
    default:
      // Non-recoverable error - no primary action
      onPrimaryAction = undefined;
      primaryActionText = undefined;
      break;
  }

  // Secondary action (if available)
  let onSecondaryAction: (() => void) | undefined;
  if (error.secondaryActionText) {
    onSecondaryAction = actions.startOver;
  }

  return (
    <ErrorScreen
      title={error.title}
      subtitle={error.message}
      preferences={preferences}
      primaryActionText={primaryActionText}
      onPrimaryAction={onPrimaryAction}
      secondaryActionText={error.secondaryActionText}
      onSecondaryAction={onSecondaryAction}
    />
  );
}
