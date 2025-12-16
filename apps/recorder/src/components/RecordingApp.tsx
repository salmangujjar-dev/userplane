/**
 * Recording App
 * Main application component that orchestrates the recording flow
 */

import { useEffect, useState } from 'react';
import { useRecordingFlow } from '@/hooks/useRecordingFlow';
import PreRecordingLoadingScreen from './PreRecordingLoadingScreen';
import PreRecordingErrorScreen from './PreRecordingErrorScreen';
import PostRecordingErrorScreen from './PostRecordingErrorScreen';
import PreRecordingScreen from './PreRecordingScreen';
import RecordingInProgressScreen from './RecordingInProgressScreen';
import PostRecordingReviewScreen from './PostRecordingReviewScreen';
import PostRecordingUploadScreen from './PostRecordingUploadScreen';
import PostRecordingAckScreen from './PostRecordingAckScreen';
import { PRE_RECORDING_ERROR_COPY } from '@/constants/screen-copy';

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
  console.log('[RecordingApp] Has thumbnail:', !!state.thumbnailUrl);
  console.log('[RecordingApp] Upload progress:', state.uploadProgress + '%');

  switch (state.state) {
    case 'loading':
      console.log('[RecordingApp] Rendering: PreRecordingLoadingScreen');
      return <PreRecordingLoadingScreen />;

    case 'error':
      const isPostRecordingError = !!state.recordingBlob;
      const isPermissionError = isPermissionDeniedError(state.error);

      console.log(
        '[RecordingApp] Rendering:',
        isPostRecordingError ? 'PostRecordingErrorScreen' : 'PreRecordingErrorScreen'
      );
      console.log('[RecordingApp] Has recording blob:', !!state.recordingBlob);
      console.log('[RecordingApp] Is permission error:', isPermissionError);
      console.log('[RecordingApp] Error title:', getErrorTitle(state.error));
      console.log('[RecordingApp] Error subtitle:', getErrorSubtitle(state.error));

      if (isPostRecordingError) {
        return (
          <PostRecordingErrorScreen
            title={getErrorTitle(state.error)}
            subtitle={getErrorSubtitle(state.error)}
            onStartOver={actions.startOver}
          />
        );
      }

      return (
        <PreRecordingErrorScreen
          title={getErrorTitle(state.error)}
          subtitle={getErrorSubtitle(state.error)}
          actionTitle={getActionTitle(isPermissionError)}
          onAction={getActionHandler(isPermissionError)}
        />
      );

    case 'setup':
      console.log('[RecordingApp] Rendering: PreRecordingScreen');
      console.log('[RecordingApp] Requester name:', state.requesterName);
      console.log('[RecordingApp] Workspace logo URL:', state.workspaceLogoUrl || '(not provided)');
      console.log('[RecordingApp] Workspace name:', state.workspaceName || '(not provided)');
      console.log(
        '[RecordingApp] Max duration:',
        `${state.maxRecordingDuration}ms (${Math.round(state.maxRecordingDuration / 1000)}s)`
      );
      console.log(
        '[RecordingApp] Max size:',
        state.maxRecordingSize ? `${state.maxRecordingSize} bytes` : '(unlimited)'
      );
      console.log('[RecordingApp] Preferences:', {
        customizeLink: state.preferences.customizeLink,
        headerText: state.preferences.headerText,
        primaryColor: state.preferences.primaryColor,
      });
      return (
        <PreRecordingScreen
          requesterName={state.requesterName}
          workspaceLogoUrl={state.workspaceLogoUrl}
          workspaceName={state.workspaceName}
          maxRecordingDuration={state.maxRecordingDuration}
          maxRecordingSize={state.maxRecordingSize}
          preferences={state.preferences}
          onStartRecording={actions.startRecording}
        />
      );

    case 'recording':
      console.log('[RecordingApp] Rendering: RecordingInProgressScreen');
      console.log('[RecordingApp] Media stream available:', !!state.mediaStream);
      return (
        <RecordingInProgressScreen
          mediaStream={state.mediaStream}
          workspaceLogoUrl={state.workspaceLogoUrl}
          workspaceName={state.workspaceName}
          preferences={state.preferences}
          onStopRecording={actions.stopRecording}
        />
      );

    case 'review':
      console.log('[RecordingApp] Rendering: PostRecordingReviewScreen');
      console.log('[RecordingApp] Thumbnail URL length:', state.thumbnailUrl?.length || 0);
      return (
        <PostRecordingReviewScreen
          thumbnailUrl={state.thumbnailUrl || undefined}
          workspaceLogoUrl={state.workspaceLogoUrl}
          workspaceName={state.workspaceName}
          preferences={state.preferences}
          onSubmit={actions.submitRecording}
          onStartOver={actions.startOver}
        />
      );

    case 'uploading':
      console.log('[RecordingApp] Rendering: PostRecordingUploadScreen');
      console.log('[RecordingApp] Upload progress:', state.uploadProgress + '%');
      return (
        <PostRecordingUploadScreen
          thumbnailUrl={state.thumbnailUrl || undefined}
          progress={state.uploadProgress}
          workspaceLogoUrl={state.workspaceLogoUrl}
          workspaceName={state.workspaceName}
          preferences={state.preferences}
        />
      );

    case 'success':
      console.log('[RecordingApp] Rendering: PostRecordingAckScreen');
      return (
        <PostRecordingAckScreen
          thumbnailUrl={state.thumbnailUrl || undefined}
          workspaceLogoUrl={state.workspaceLogoUrl}
          workspaceName={state.workspaceName}
          preferences={state.preferences}
        />
      );

    default:
      console.log('[RecordingApp] Unknown state, rendering: PreRecordingLoadingScreen');
      return <PreRecordingLoadingScreen />;
  }
}

function isPermissionDeniedError(error: string | null): boolean {
  if (!error) return false;
  return error.includes('permission') || error.includes('denied');
}

function getErrorTitle(error: string | null): string {
  if (!error) return 'Something went wrong';

  if (error.includes('token') || error.includes('link')) {
    return "Hmm... that link isn't valid";
  }

  if (error.includes('permission') || error.includes('denied')) {
    return 'Permission denied';
  }

  if (error.includes('supported')) {
    return 'Browser not supported';
  }

  if (error.includes('upload') || error.includes('Upload')) {
    return 'Upload failed';
  }

  if (error.includes('network') || error.includes('fetch')) {
    return 'Connection error';
  }

  return 'Something went wrong';
}

function getErrorSubtitle(error: string | null): string {
  if (!error) return 'An unexpected error occurred';

  if (error.includes('token') || error.includes('link')) {
    return 'The recording link appears to be incorrect';
  }

  if (error.includes('permission') || error.includes('denied')) {
    return 'Screen recording permission is required';
  }

  if (error.includes('supported')) {
    return "Your browser doesn't support screen recording";
  }

  if (error.includes('upload') || error.includes('Upload')) {
    return 'Something went wrong while uploading your recording';
  }

  if (error.includes('network') || error.includes('fetch')) {
    return 'Unable to connect to the server';
  }

  return error;
}

function getActionTitle(isPermissionError: boolean): string {
  return isPermissionError
    ? PRE_RECORDING_ERROR_COPY.retryButton
    : PRE_RECORDING_ERROR_COPY.requestLinkButton;
}

function getActionHandler(isPermissionError: boolean): () => void {
  if (isPermissionError) {
    return () => {
      console.log('[RecordingApp] Retrying - refreshing page');
      window.location.reload();
    };
  } else {
    return async () => {
      console.log('[RecordingApp] Copying request message to clipboard');
      try {
        await navigator.clipboard.writeText(PRE_RECORDING_ERROR_COPY.requestMessage);
        console.log('[RecordingApp] Message copied successfully');
        alert('Message copied to clipboard!');
      } catch (err) {
        console.error('[RecordingApp] Failed to copy to clipboard:', err);
        alert('Failed to copy message');
      }
    };
  }
}
