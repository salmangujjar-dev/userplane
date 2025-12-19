/**
 * Recording Flow Hook
 * Manages the state machine for the entire recording flow
 */

import { useState, useEffect, useRef } from 'react';
import { RecordingSession, type UploadState } from '@/services/recording-session';
import {
  MediaCapture,
  type RecordingMode,
  isScreenRecordingSupported,
} from '@/services/media-capture';
import type { UploadProgress } from '@/services/recording-session';
import type { RecordingPreferences } from '@/types/session-preferences';
import { DEFAULT_RECORDING_PREFERENCES } from '@/types/session-preferences';
import { generateVideoThumbnail } from '@/utils/video-thumbnail';
import { RECORDING_DURATION_LIMITS } from '@workspace/contract';

export type FlowState =
  | 'loading'
  | 'error'
  | 'setup'
  | 'countdown'
  | 'recording'
  | 'review'
  | 'uploading'
  | 'success';

export interface RecordingFlowState {
  state: FlowState;
  error: any;
  recordingMode: RecordingMode;
  recordingBlob: Blob | null;
  videoUrl: string | null;
  uploadProgress: number;
  requesterName: string;
  mediaStream: MediaStream | null;
  isProcessing: boolean;
  maxRecordingDurationMs: number;
  maxRecordingSize: number | null;
  recordingDurationMs: number | null;
  preferences: RecordingPreferences;
  countdownSeconds: number;
}

export interface RecordingFlowActions {
  startRecording: (mode: RecordingMode) => Promise<void>;
  stopRecording: () => Promise<void>;
  submitRecording: () => Promise<void>;
  retryUpload: () => Promise<void>;
  startOver: () => Promise<void>;
}

export function useRecordingFlow(linkToken: string | null): {
  state: RecordingFlowState;
  actions: RecordingFlowActions;
} {
  const [flowState, setFlowState] = useState<FlowState>('loading');
  const [error, setError] = useState<any>(null);
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('screen-only');
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [thumbnailBlob, setThumbnailBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [requesterName, setRequesterName] = useState('');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [maxRecordingDurationMs, setMaxRecordingDurationMs] = useState<number>(
    RECORDING_DURATION_LIMITS.DEFAULT_MAX_DURATION_MS
  );
  const [maxRecordingSize, setMaxRecordingSize] = useState<number | null>(null);
  const [recordingDurationMs, setRecordingDurationMs] = useState<number | null>(null);
  const [preferences, setPreferences] = useState<RecordingPreferences>(
    DEFAULT_RECORDING_PREFERENCES
  );
  const [countdownSeconds, setCountdownSeconds] = useState<number>(3);
  const [uploadState, setUploadState] = useState<UploadState | null>(null);

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
    const criticalStates: FlowState[] = ['countdown', 'recording', 'review', 'uploading'];

    if (criticalStates.includes(flowState)) {
      console.log('[Flow] Enabling beforeunload protection');

      const handler = (e: BeforeUnloadEvent) => {
        console.log('[Flow] beforeunload triggered - preventing accidental close');
        e.preventDefault();
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

    console.log('[Flow] Setting up auto-stop timer for', maxRecordingDurationMs, 'ms');

    const timer = setTimeout(() => {
      console.log('[Flow] Max duration reached, auto-stopping recording');
      stopRecording();
    }, maxRecordingDurationMs);

    return () => {
      clearTimeout(timer);
    };
  }, [flowState, maxRecordingDurationMs]);

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
      console.log('[Flow] Recording ID:', session.recordingId);
      console.log('[Flow] Requester name:', session.requesterName);
      console.log('[Flow] Max recording duration:', `${session.maxRecordingDurationMs}ms`);
      console.log(
        '[Flow] Max recording size:',
        session.maxRecordingSize ? `${session.maxRecordingSize} bytes` : '(unlimited)'
      );
      console.log('[Flow] Preferences:', session.preferences);

      sessionRef.current = session;

      if (session.preferences) {
        setPreferences(session.preferences);
      }

      setRequesterName(session.requesterName || '');
      setMaxRecordingDurationMs(session.maxRecordingDurationMs);
      setMaxRecordingSize(session.maxRecordingSize);

      console.log('[Flow] Transitioning to setup state');
      setFlowState('setup');
    } catch (err) {
      console.error('[Flow] Session initialization failed:', err);
      console.error('[Flow] Error message:', err instanceof Error ? err.message : 'Unknown error');
      setError(err);
      setFlowState('error');
    }
  }

  async function startRecording(mode: RecordingMode) {
    try {
      console.log('[Flow] Preparing to start recording...');
      console.log('[Flow] Recording mode:', mode);

      setRecordingMode(mode);

      const mediaCapture = new MediaCapture(mode);
      mediaCaptureRef.current = mediaCapture;
      console.log('[Flow] MediaCapture instance created');

      console.log('[Flow] Requesting media permissions...');
      await mediaCapture.requestPermissions({
        mode,
        onStop: async (blob) => {
          console.log('[Flow] Recording stopped callback triggered');
          console.log('[Flow] Blob size:', blob.size, 'bytes');
          console.log('[Flow] Blob type:', blob.type);

          const durationMs = mediaCapture.getDuration();
          console.log('[Flow] Recording duration:', durationMs ? `${durationMs}ms` : 'unknown');
          setRecordingDurationMs(durationMs);

          setRecordingBlob(blob);

          const blobUrl = URL.createObjectURL(blob);
          setVideoUrl(blobUrl);
          console.log('[Flow] Video blob URL created for preview:', blobUrl);

          console.log('[Flow] Generating thumbnail for upload...');
          const thumbnail = await generateVideoThumbnail(blob);
          if (thumbnail) {
            setThumbnailBlob(thumbnail);
            console.log('[Flow] Thumbnail generated:', {
              size: thumbnail.size,
              type: thumbnail.type,
            });
          } else {
            console.warn('[Flow] Thumbnail generation failed - will upload without thumbnail');
          }

          console.log('[Flow] Transitioning to review state');
          setFlowState('review');
        },
        onError: (err) => {
          console.error('[Flow] Recording error:', err);
          setError(err);
          setFlowState('error');
        },
      });

      console.log('[Flow] Media permissions granted');
      console.log('[Flow] Getting media stream for preview');
      const stream = mediaCapture.getStream();
      setMediaStream(stream);
      console.log('[Flow] Media stream:', stream ? 'Available' : 'Not available');

      console.log('[Flow] Starting 3-second countdown...');
      setFlowState('countdown');
      setCountdownSeconds(3);

      let countdown = 3;
      const countdownInterval = setInterval(() => {
        countdown -= 1;
        setCountdownSeconds(countdown);
        console.log('[Flow] Countdown:', countdown);

        if (countdown === 0) {
          clearInterval(countdownInterval);
          console.log('[Flow] Countdown complete, starting recording...');
          mediaCapture.startRecording();
          setFlowState('recording');
        }
      }, 1000);
    } catch (err) {
      console.error('[Flow] Failed to start recording:', err);
      console.error('[Flow] Error message:', err instanceof Error ? err.message : 'Unknown error');
      setError(err);
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

      const durationMs = mediaCaptureRef.current.getDuration();
      console.log('[Flow] Recording duration:', durationMs ? `${durationMs}ms` : 'unknown');
      setRecordingDurationMs(durationMs);

      const blob = await mediaCaptureRef.current.stop();
      console.log('[Flow] Recording stopped successfully');
      console.log('[Flow] Blob size:', blob.size, 'bytes');
      console.log('[Flow] Blob type:', blob.type);
      console.log('[Flow] Checking constraints...');
      console.log('[Flow] Max duration limit:', maxRecordingDurationMs, 'ms');
      console.log(
        '[Flow] Max size limit:',
        maxRecordingSize ? `${maxRecordingSize} bytes` : 'unlimited'
      );

      if (durationMs && durationMs > maxRecordingDurationMs) {
        console.warn('[Flow] Duration exceeds limit:', {
          actual: durationMs,
          limit: maxRecordingDurationMs,
        });
        throw new Error(
          `Recording duration (${durationMs}ms) exceeds the maximum allowed (${maxRecordingDurationMs}ms)`
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

      console.log('[Flow] All constraints passed');
      setRecordingBlob(blob);

      console.log('[Flow] Transitioning to review state');
      setFlowState('review');
    } catch (err) {
      console.error('[Flow] Failed to stop recording:', err);
      console.error('[Flow] Error message:', err instanceof Error ? err.message : 'Unknown error');
      setError(err);
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
      console.log('[Flow] File type:', file.type);
      console.log(
        '[Flow] Recording duration:',
        recordingDurationMs ? `${recordingDurationMs}ms` : '0ms (will default to 0)'
      );
      console.log(
        '[Flow] Thumbnail:',
        thumbnailBlob ? `${thumbnailBlob.size} bytes, ${thumbnailBlob.type}` : 'none'
      );

      // STEP 1: Initialize upload and get presigned URLs
      console.log('[Flow] Step 1: Initializing upload...');
      const newUploadState = await sessionRef.current.initializeUpload(
        file,
        thumbnailBlob,
        recordingDurationMs
      );
      setUploadState(newUploadState);
      console.log('[Flow] Upload initialized, state saved for retry');

      // STEP 2: Upload files to object storage (retryable)
      console.log('[Flow] Step 2: Uploading files to storage...');
      await sessionRef.current.uploadToStorage(newUploadState, (progress: UploadProgress) => {
        console.log('[Flow] Upload progress:', progress.percentage + '%');
        setUploadProgress(progress.percentage);
      });
      console.log('[Flow] Files uploaded to storage');

      // STEP 3: Acknowledge upload completion
      console.log('[Flow] Step 3: Acknowledging upload...');
      await sessionRef.current.acknowledgeUpload(newUploadState);
      console.log('[Flow] Upload acknowledged');

      // Clear upload state after successful completion
      setUploadState(null);

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
      console.error('[Flow] Error message:', err instanceof Error ? err.message : 'Unknown error');
      setError(err);
      setFlowState('error');
      // Upload state is preserved for retry
    } finally {
      setIsProcessing(false);
    }
  }

  async function retryUpload() {
    if (!uploadState) {
      console.error('[Flow] No upload state available for retry');
      setError('Cannot retry: No upload state available');
      setFlowState('error');
      return;
    }

    if (!sessionRef.current) {
      console.error('[Flow] No active session');
      setError('Cannot retry: No active session');
      setFlowState('error');
      return;
    }

    setIsProcessing(true);
    try {
      console.log('[Flow] Retrying upload from storage step...');
      setFlowState('uploading');
      setUploadProgress(0);

      // STEP 2: Upload files to object storage (retry)
      console.log('[Flow] Step 2 (retry): Uploading files to storage...');
      await sessionRef.current.uploadToStorage(uploadState, (progress: UploadProgress) => {
        console.log('[Flow] Upload progress:', progress.percentage + '%');
        setUploadProgress(progress.percentage);
      });
      console.log('[Flow] Files uploaded to storage');

      // STEP 3: Acknowledge upload completion
      console.log('[Flow] Step 3: Acknowledging upload...');
      await sessionRef.current.acknowledgeUpload(uploadState);
      console.log('[Flow] Upload acknowledged');

      // Clear upload state after successful completion
      setUploadState(null);

      console.log('[Flow] Retry successful');
      console.log('[Flow] Transitioning to success state');
      setFlowState('success');

      console.log('[Flow] Tab will auto-close in 5 seconds');
      setTimeout(() => {
        console.log('[Flow] Closing tab...');
        window.close();
      }, 5000);
    } catch (err) {
      console.error('[Flow] Retry failed:', err);
      console.error('[Flow] Error message:', err instanceof Error ? err.message : 'Unknown error');
      setError(err);
      setFlowState('error');
      // Upload state is preserved for another retry
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

      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
        console.log('[Flow] Video blob URL revoked');
      }

      setRecordingBlob(null);
      setThumbnailBlob(null);
      setVideoUrl(null);
      setUploadProgress(0);
      setError(null);
      setMediaStream(null);
      setRecordingDurationMs(null);

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
      videoUrl,
      uploadProgress,
      requesterName,
      mediaStream,
      isProcessing,
      maxRecordingDurationMs,
      maxRecordingSize,
      recordingDurationMs,
      preferences,
      countdownSeconds,
    },
    actions: {
      startRecording,
      stopRecording,
      submitRecording,
      retryUpload,
      startOver,
    },
  };
}
