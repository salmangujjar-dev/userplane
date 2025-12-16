/**
 * Recording Flow Hook
 * Manages the state machine for the entire recording flow
 */

import { useState, useEffect, useRef } from 'react';
import { RecordingSession } from '@/services/recording-session';
import {
  MediaCapture,
  type RecordingMode,
  isScreenRecordingSupported,
} from '@/services/media-capture';
import type { UploadProgress } from '@/services/recording-session';
import type { UIPreferences } from '@/types/session-preferences';
import { DEFAULT_UI_PREFERENCES } from '@/types/session-preferences';
import { generateVideoThumbnail, blobToDataUrl } from '@/utils/video-thumbnail';

export type FlowState =
  | 'loading'
  | 'error'
  | 'setup'
  | 'recording'
  | 'review'
  | 'uploading'
  | 'success';

export interface RecordingFlowState {
  state: FlowState;
  error: string | null;
  recordingMode: RecordingMode;
  recordingBlob: Blob | null;
  thumbnailUrl: string | null;
  uploadProgress: number;
  requesterName: string;
  workspaceLogoUrl: string | null;
  workspaceName: string | null;
  mediaStream: MediaStream | null;
  isProcessing: boolean;
  maxRecordingDuration: number;
  maxRecordingSize: number | null;
  recordingDuration: number | null;
  preferences: UIPreferences;
}

export interface RecordingFlowActions {
  startRecording: (mode: RecordingMode) => Promise<void>;
  stopRecording: () => Promise<void>;
  submitRecording: () => Promise<void>;
  startOver: () => Promise<void>;
}

export function useRecordingFlow(linkToken: string | null): {
  state: RecordingFlowState;
  actions: RecordingFlowActions;
} {
  const [flowState, setFlowState] = useState<FlowState>('loading');
  const [error, setError] = useState<string | null>(null);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('screen-only');
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [requesterName, setRequesterName] = useState('');
  const [workspaceLogoUrl, setWorkspaceLogoUrl] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [maxRecordingDuration, setMaxRecordingDuration] = useState<number>(180000);
  const [maxRecordingSize, setMaxRecordingSize] = useState<number | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number | null>(null);
  const [preferences, setPreferences] = useState<UIPreferences>(DEFAULT_UI_PREFERENCES);

  const sessionRef = useRef<RecordingSession | null>(null);
  const mediaCaptureRef = useRef<MediaCapture | null>(null);
  const beforeUnloadHandlerRef = useRef<((e: BeforeUnloadEvent) => void) | null>(null);

  useEffect(() => {
    console.log('[Flow] Hook initialized');
    console.log('[Flow] Link token:', linkToken ? 'Present' : 'Missing');

    if (!linkToken) {
      console.error('[Flow] Error: No link token provided');
      setError('No link token provided');
      setFlowState('error');
      return;
    }

    if (!isScreenRecordingSupported()) {
      console.error('[Flow] Error: Screen recording not supported');
      setError('Screen recording is not supported in your browser');
      setFlowState('error');
      return;
    }

    console.log('[Flow] Screen recording supported, initializing session...');
    initializeSession(linkToken);

    return () => {
      if (sessionRef.current) {
        sessionRef.current.destroy();
      }
      if (mediaCaptureRef.current) {
        mediaCaptureRef.current.destroy();
      }
    };
  }, [linkToken]);

  useEffect(() => {
    const criticalStates: FlowState[] = ['recording', 'review', 'uploading'];

    if (criticalStates.includes(flowState)) {
      console.log('[Flow] Enabling beforeunload protection');

      const handler = (e: BeforeUnloadEvent) => {
        console.log('[Flow] beforeunload triggered - preventing accidental close');
        e.preventDefault();
        e.returnValue = '';
        return '';
      };

      beforeUnloadHandlerRef.current = handler;
      window.addEventListener('beforeunload', handler);

      return () => {
        console.log('[Flow] Removing beforeunload protection');
        if (beforeUnloadHandlerRef.current) {
          window.removeEventListener('beforeunload', beforeUnloadHandlerRef.current);
          beforeUnloadHandlerRef.current = null;
        }
      };
    }
  }, [flowState]);

  useEffect(() => {
    if (flowState !== 'recording' || !mediaCaptureRef.current) {
      return;
    }

    console.log('[Flow] Setting up auto-stop timer for', maxRecordingDuration, 'ms');

    const timer = setTimeout(() => {
      console.log('[Flow] Max duration reached, auto-stopping recording');
      stopRecording();
    }, maxRecordingDuration);

    return () => {
      clearTimeout(timer);
    };
  }, [flowState, maxRecordingDuration]);

  async function initializeSession(token: string) {
    try {
      console.log('[Flow] Initializing session...');
      console.log('[Flow] Token (first 50 chars):', token.substring(0, 50));

      setFlowState('loading');
      setError(null);

      const session = new RecordingSession();
      console.log('[Flow] RecordingSession instance created');

      await session.initialize(token);
      console.log('[Flow] Session initialized successfully');
      console.log('[Flow] Session ID:', session.sessionId);

      sessionRef.current = session;

      if (session.preferences) {
        setPreferences(session.preferences);
        console.log('[Flow] Preferences loaded:', {
          customizeLink: session.preferences.customizeLink,
          companyName: session.preferences.companyName,
          headerText: session.preferences.headerText,
          primaryColor: session.preferences.primaryColor,
        });
      }

      setRequesterName(session.requesterName || '');
      setWorkspaceLogoUrl(session.workspaceLogoUrl || null);
      setWorkspaceName(session.workspaceName || null);

      setMaxRecordingDuration(session.maxRecordingDuration);
      setMaxRecordingSize(session.maxRecordingSize);

      console.log('[Flow] Metadata extracted:', {
        requester: session.requesterName || '(not provided)',
        workspaceLogoUrl: session.workspaceLogoUrl || '(not provided)',
        workspaceName: session.workspaceName || '(not provided)',
      });

      console.log('[Flow] Constraints extracted:', {
        maxDuration: `${session.maxRecordingDuration}ms (${Math.round(session.maxRecordingDuration / 1000)}s)`,
        maxSize: session.maxRecordingSize ? `${session.maxRecordingSize} bytes` : '(unlimited)',
      });

      console.log('[Flow] Transitioning to setup state');
      setFlowState('setup');
    } catch (err) {
      console.error('[Flow] Session initialization failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize session';
      console.error('[Flow] Error message:', errorMessage);
      setError(errorMessage);
      setFlowState('error');
    }
  }

  async function startRecording(mode: RecordingMode) {
    try {
      console.log('[Flow] Starting recording...');
      console.log('[Flow] Recording mode:', mode);

      setRecordingMode(mode);

      const mediaCapture = new MediaCapture(mode);
      mediaCaptureRef.current = mediaCapture;
      console.log('[Flow] MediaCapture instance created');

      await mediaCapture.start({
        mode,
        onStop: async (blob) => {
          console.log('[Flow] Recording stopped callback');
          console.log('[Flow] Blob size:', blob.size, 'bytes');
          setRecordingBlob(blob);

          console.log('[Flow] Generating thumbnail from callback...');
          const thumbnail = await generateVideoThumbnail(blob);
          if (thumbnail) {
            const thumbnailDataUrl = await blobToDataUrl(thumbnail);
            setThumbnailUrl(thumbnailDataUrl);
          }

          setFlowState('review');
        },
        onError: (err) => {
          console.error('[Flow] Recording error:', err);
          setError(err.message);
          setFlowState('error');
        },
      });

      console.log('[Flow] Recording started successfully');
      console.log('[Flow] Getting media stream for preview');
      const stream = mediaCapture.getStream();
      setMediaStream(stream);
      console.log('[Flow] Media stream:', stream ? 'Available' : 'Not available');
      console.log('[Flow] Transitioning to recording state');
      setFlowState('recording');
    } catch (err) {
      console.error('[Flow] Failed to start recording:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to start recording. Please check permissions.';
      console.error('[Flow] Error message:', errorMessage);
      setError(errorMessage);
      setFlowState('error');
    }
  }

  async function stopRecording() {
    setIsProcessing(true);
    try {
      console.log('[Flow] Stopping recording...');

      if (!mediaCaptureRef.current) {
        throw new Error('No active recording');
      }

      const duration = mediaCaptureRef.current.getDuration();
      console.log('[Flow] Recording duration:', duration ? `${duration}ms` : 'unknown');
      setRecordingDuration(duration);

      const blob = await mediaCaptureRef.current.stop();
      console.log('[Flow] Recording stopped');
      console.log('[Flow] Blob size:', blob.size, 'bytes');
      console.log('[Flow] Blob type:', blob.type);

      if (duration && duration > maxRecordingDuration) {
        console.warn('[Flow] Duration exceeds limit:', {
          actual: duration,
          limit: maxRecordingDuration,
        });
        throw new Error(
          `Recording duration (${Math.round(duration / 1000)}s) exceeds the maximum allowed (${Math.round(maxRecordingDuration / 1000)}s)`
        );
      }

      if (maxRecordingSize && blob.size > maxRecordingSize) {
        console.warn('[Flow] Size exceeds limit:', {
          actual: blob.size,
          limit: maxRecordingSize,
        });
        throw new Error(
          `Recording size (${Math.round(blob.size / 1048576)}MB) exceeds the maximum allowed (${Math.round(maxRecordingSize / 1048576)}MB)`
        );
      }

      setRecordingBlob(blob);

      console.log('[Flow] Generating thumbnail...');
      const thumbnail = await generateVideoThumbnail(blob);
      if (thumbnail) {
        const thumbnailDataUrl = await blobToDataUrl(thumbnail);
        setThumbnailUrl(thumbnailDataUrl);
      }

      console.log('[Flow] Transitioning to review state');
      setFlowState('review');
    } catch (err) {
      console.error('[Flow] Failed to stop recording:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop recording';
      console.error('[Flow] Error message:', errorMessage);
      setError(errorMessage);
      setFlowState('error');
    } finally {
      setIsProcessing(false);
    }
  }

  async function submitRecording() {
    setIsProcessing(true);
    try {
      console.log('[Flow] Submitting recording...');

      if (!recordingBlob) {
        throw new Error('No recording to submit');
      }

      if (!sessionRef.current) {
        throw new Error('No active session');
      }

      console.log('[Flow] Recording blob size:', recordingBlob.size, 'bytes');
      console.log('[Flow] Recording blob type:', recordingBlob.type);

      setFlowState('uploading');
      setUploadProgress(0);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const extension = recordingBlob.type.includes('webm') ? 'webm' : 'mp4';
      const fileName = `recording-${timestamp}.${extension}`;
      const file = new File([recordingBlob], fileName, {
        type: recordingBlob.type,
      });

      console.log('[Flow] Created file:', fileName);
      console.log('[Flow] File size:', file.size, 'bytes');
      console.log(
        '[Flow] Recording duration:',
        recordingDuration ? `${recordingDuration}ms` : 'unknown'
      );
      console.log('[Flow] Starting upload...');

      let thumbnailBlob: Blob | null = null;
      if (thumbnailUrl) {
        const response = await fetch(thumbnailUrl);
        thumbnailBlob = await response.blob();
      }

      await sessionRef.current.uploadFiles(
        file,
        thumbnailBlob,
        recordingDuration,
        (progress: UploadProgress) => {
          console.log('[Flow] Upload progress:', progress.percentage + '%');
          setUploadProgress(progress.percentage);
        }
      );

      console.log('[Flow] Upload completed successfully');
      console.log('[Flow] Transitioning to success state');
      setFlowState('success');

      console.log('[Flow] Tab will auto-close in 5 seconds');
      setTimeout(() => {
        console.log('[Flow] Closing tab...');
        window.close();
      }, 5000);
    } catch (err) {
      console.error('[Flow] Upload failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload recording';
      console.error('[Flow] Error message:', errorMessage);
      setError(errorMessage);
      setFlowState('error');
    } finally {
      setIsProcessing(false);
    }
  }

  async function startOver() {
    console.log('[Flow] Starting over...');
    setIsProcessing(true);

    try {
      if (mediaCaptureRef.current) {
        const currentState = mediaCaptureRef.current.getState();
        console.log('[Flow] Current recording state:', currentState);

        if (currentState === 'recording' || currentState === 'paused') {
          console.log('[Flow] Stopping active recording before restart');
          try {
            await mediaCaptureRef.current.stop();
            console.log('[Flow] Recording stopped successfully');
          } catch (err) {
            console.error('[Flow] Error stopping recording:', err);
          }
        }

        console.log('[Flow] Destroying media capture');
        mediaCaptureRef.current.destroy();
        mediaCaptureRef.current = null;
      }

      console.log('[Flow] Resetting state');
      setRecordingBlob(null);
      setThumbnailUrl(null);
      setUploadProgress(0);
      setError(null);
      setMediaStream(null);

      console.log('[Flow] Transitioning back to setup state');
      setFlowState('setup');
      console.log('[Flow] Start over completed successfully');
    } catch (err) {
      console.error('[Flow] Error during start over:', err);
      setFlowState('setup');
    } finally {
      setIsProcessing(false);
    }
  }

  return {
    state: {
      state: flowState,
      error,
      recordingMode,
      recordingBlob,
      thumbnailUrl,
      uploadProgress,
      requesterName,
      workspaceLogoUrl,
      workspaceName,
      mediaStream,
      isProcessing,
      maxRecordingDuration,
      maxRecordingSize,
      recordingDuration,
      preferences,
    },
    actions: {
      startRecording,
      stopRecording,
      submitRecording,
      startOver,
    },
  };
}
