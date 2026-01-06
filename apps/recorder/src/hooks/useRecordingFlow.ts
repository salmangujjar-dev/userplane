/**
 * Recording Flow Hook
 * Manages the state machine for the entire recording flow
 */

import { useState, useEffect, useRef, useCallback } from 'react';
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
import { type RecordingError, classifyError } from '@/types/errors';

export type FlowState =
  | 'loading'
  | 'error'
  | 'setup'
  | 'countdown'
  | 'recording'
  | 'review'
  | 'uploading'
  | 'success';

/**
 * Session information exposed to parent components
 */
export interface SessionInfo {
  workspaceId: string;
  sessionId: string;
  linkId?: string;
}

export interface RecordingFlowState {
  state: FlowState;
  error: RecordingError | null;
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

export function useRecordingFlow(
  linkToken: string,
  action: string,
  workspaceIds: string[]
): {
  state: RecordingFlowState;
  actions: RecordingFlowActions;
  sessionInfo: SessionInfo | null;
} {
  const [flowState, setFlowState] = useState<FlowState>('loading');
  const [error, setError] = useState<RecordingError | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
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
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoStopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stopRecordingRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    console.log('[Flow] Hook initialized');
    console.log('[Flow] Link token:', linkToken ? 'Present' : 'Empty');
    console.log('[Flow] Action:', action || 'Empty');
    console.log('[Flow] Workspace IDs:', workspaceIds.length > 0 ? workspaceIds : 'Empty');

    if (!linkToken || linkToken.trim() === '') {
      console.error('[Flow] Error: No link token provided');
      setError({
        title: 'Invalid link',
        message: 'No link token provided',
      });
      setFlowState('error');
      return;
    }

    if (!action || action.trim() === '') {
      console.error('[Flow] Error: No action provided');
      setError({
        title: 'Invalid link',
        message: 'No action specified in the link',
      });
      setFlowState('error');
      return;
    }

    if (action !== 'recording') {
      console.error('[Flow] Error: Invalid action:', action);
      setError({
        title: 'Invalid action',
        message: `Action "${action}" is not supported`,
      });
      setFlowState('error');
      return;
    }

    if (!workspaceIds || workspaceIds.length === 0) {
      console.error('[Flow] Error: No workspace IDs provided');
      setError({
        title: 'Invalid link',
        message: 'No workspace ID provided in the link',
      });
      setFlowState('error');
      return;
    }

    if (!isScreenRecordingSupported()) {
      console.error('[Flow] Error: Screen recording not supported');
      setError({
        title: 'Not supported',
        message: 'Screen recording is not supported in your browser',
      });
      setFlowState('error');
      return;
    }

    console.log('[Flow] Screen recording supported, initializing session...');
    initializeSession(linkToken, workspaceIds);

    return () => {
      // Cleanup on unmount
      if (sessionRef.current) {
        sessionRef.current.destroy();
      }
      if (mediaCaptureRef.current) {
        // Async destroy, but we can't await in cleanup
        // Trigger it and let it complete asynchronously
        mediaCaptureRef.current.destroy().catch((err) => {
          console.error('[Flow] Error during mediaCapture cleanup:', err);
        });
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }
    };
  }, [linkToken, action, workspaceIds]);

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

    // Clear any existing timer
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
    }

    autoStopTimerRef.current = setTimeout(() => {
      console.log('[Flow] Max duration reached, auto-stopping recording');
      if (stopRecordingRef.current) {
        stopRecordingRef.current();
      }
    }, maxRecordingDurationMs);

    return () => {
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }
    };
  }, [flowState, maxRecordingDurationMs]);

  async function initializeSession(linkToken: string, expectedWorkspaceIds: string[]) {
    console.log('[Flow] Initializing session...');
    console.log('[Flow] Link token (first 50 chars):', linkToken.substring(0, 50));
    console.log('[Flow] Expected workspace IDs:', expectedWorkspaceIds);

    setFlowState('loading');
    setError(null);

    const session = new RecordingSession();
    console.log('[Flow] RecordingSession instance created');

    // Initialize session - this exchanges link token for session token
    const result = await session.initialize(linkToken);

    if (!result.ok) {
      console.error('[Flow] Session initialization failed:', result.error);
      setError(result.error);
      setFlowState('error');
      return;
    }

    // Validate workspace ID from the decoded session properties
    if (!session.workspaceId) {
      console.error('[Flow] Session missing workspace ID');
      setError({
        title: 'Invalid session',
        message: 'Session is missing workspace information',
      });
      setFlowState('error');
      return;
    }

    // Check if at least one of the expected workspace IDs matches
    const workspaceMatch = expectedWorkspaceIds.includes(session.workspaceId);
    if (!workspaceMatch) {
      console.error('[Flow] Workspace ID mismatch - none of the provided IDs match');
      console.error('[Flow] Expected one of:', expectedWorkspaceIds);
      console.error('[Flow] Session contains:', session.workspaceId);
      setError({
        title: 'Workspace mismatch',
        message: 'This recording link is not valid for this workspace',
      });
      setFlowState('error');
      return;
    }

    console.log('[Flow] Workspace ID validated successfully - matched:', session.workspaceId);
    console.log('[Flow] Session properties:', {
      workspaceId: session.workspaceId,
      sessionId: session.sessionId,
      linkId: session.linkId,
    });

    console.log('[Flow] Session initialized successfully');
    console.log('[Flow] Session ID:', result.data.sessionId);
    console.log('[Flow] Requester name:', result.data.requesterName);
    console.log('[Flow] Max recording duration:', `${result.data.maxRecordingDurationMs}ms`);
    console.log(
      '[Flow] Max recording size:',
      result.data.maxRecordingSize ? `${result.data.maxRecordingSize} bytes` : '(unlimited)'
    );
    console.log('[Flow] Preferences:', result.data.preferences);

    sessionRef.current = session;
    setPreferences(result.data.preferences);
    setRequesterName(result.data.requesterName || '');
    setMaxRecordingDurationMs(result.data.maxRecordingDurationMs);
    setMaxRecordingSize(result.data.maxRecordingSize);

    // Set session info for parent communication
    if (session.workspaceId && session.sessionId) {
      setSessionInfo({
        workspaceId: session.workspaceId,
        sessionId: session.sessionId,
        linkId: session.linkId ?? undefined,
      });
      console.log('[Flow] Session info set:', {
        workspaceId: session.workspaceId,
        sessionId: session.sessionId,
        linkId: session.linkId,
      });
    }

    console.log('[Flow] Transitioning to setup state');
    setFlowState('setup');
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
        onStop: async () => {
          // User stopped sharing via browser UI - delegate to stopRecording
          console.log('[Flow] User stopped sharing via browser UI');
          if (stopRecordingRef.current) {
            await stopRecordingRef.current();
          }
        },
        onError: (err) => {
          console.error('[Flow] Recording error:', err);
          setError(classifyError(err));
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

      // Clear any existing countdown interval
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }

      let countdown = 3;
      countdownIntervalRef.current = setInterval(() => {
        countdown -= 1;
        setCountdownSeconds(countdown);
        console.log('[Flow] Countdown:', countdown);

        if (countdown === 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          console.log('[Flow] Countdown complete, starting recording...');
          mediaCapture.startRecording();
          setFlowState('recording');
        }
      }, 1000);
    } catch (err) {
      console.error('[Flow] Failed to start recording:', err);
      console.error('[Flow] Error message:', err instanceof Error ? err.message : 'Unknown error');
      setError(classifyError(err as Error));
      setFlowState('error');
    }
  }

  const stopRecording = useCallback(async () => {
    // Guard against concurrent calls
    if (isProcessing) {
      console.log('[Flow] Stop already in progress, ignoring duplicate call');
      return;
    }

    setIsProcessing(true);
    let createdBlobUrl: string | null = null;

    try {
      console.log('[Flow] Stopping recording...');

      if (!mediaCaptureRef.current) {
        throw new Error('No active recording');
      }

      const durationMs = mediaCaptureRef.current.getDuration();
      console.log('[Flow] Recording duration:', durationMs ? `${durationMs}ms` : 'unknown');

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
        setError({
          title: 'Recording too long',
          message: `Recording duration (${Math.round(durationMs / 1000)}s) exceeds the maximum allowed (${Math.round(maxRecordingDurationMs / 1000)}s)`,
          primaryAction: { label: 'Start over', action: 'start-over' },
        });
        setFlowState('error');
        return;
      }

      if (maxRecordingSize && blob.size > maxRecordingSize) {
        console.warn('[Flow] Size exceeds limit:', {
          actual: blob.size,
          limit: maxRecordingSize,
        });
        setError({
          title: 'Recording too large',
          message: `Recording size (${Math.round(blob.size / 1048576)}MB) exceeds the maximum allowed (${Math.round(maxRecordingSize / 1048576)}MB)`,
          primaryAction: { label: 'Start over', action: 'start-over' },
        });
        setFlowState('error');
        return;
      }

      console.log('[Flow] All constraints passed');

      // Store duration and blob
      setRecordingDurationMs(durationMs);
      setRecordingBlob(blob);

      // Create video URL for preview
      createdBlobUrl = URL.createObjectURL(blob);
      setVideoUrl(createdBlobUrl);
      console.log('[Flow] Video blob URL created for preview:', createdBlobUrl);

      // Generate thumbnail for upload
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
    } catch (err) {
      console.error('[Flow] Failed to stop recording:', err);
      console.error('[Flow] Error message:', err instanceof Error ? err.message : 'Unknown error');

      // Clean up blob URL if it was created but we're erroring out
      if (createdBlobUrl) {
        console.log('[Flow] Revoking blob URL due to error');
        URL.revokeObjectURL(createdBlobUrl);
      }

      setError(classifyError(err as Error));
      setFlowState('error');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, maxRecordingDurationMs, maxRecordingSize]);

  // Keep stopRecordingRef in sync with the latest stopRecording function
  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  async function submitRecording() {
    setIsProcessing(true);
    console.log('[Flow] Submitting recording...');

    if (!recordingBlob) {
      setError({
        title: 'No recording',
        message: 'No recording to submit',
        primaryAction: { label: 'Start over', action: 'start-over' },
      });
      setFlowState('error');
      setIsProcessing(false);
      return;
    }

    if (!sessionRef.current) {
      setError({
        title: 'Session expired',
        message: 'No active session',
        primaryAction: { label: 'Start over', action: 'start-over' },
      });
      setFlowState('error');
      setIsProcessing(false);
      return;
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
    const initResult = await sessionRef.current.initializeUpload(
      file,
      thumbnailBlob,
      recordingDurationMs
    );

    if (!initResult.ok) {
      console.error('[Flow] Upload initialization failed:', initResult.error);
      setError(initResult.error);
      setFlowState('error');
      setIsProcessing(false);
      return;
    }

    const newUploadState = initResult.data;
    setUploadState(newUploadState);
    console.log('[Flow] Upload initialized, state saved for retry');

    // STEP 2: Upload files to object storage (retryable)
    console.log('[Flow] Step 2: Uploading files to storage...');
    const storageResult = await sessionRef.current.uploadToStorage(
      newUploadState,
      (progress: UploadProgress) => {
        console.log('[Flow] Upload progress:', progress.percentage + '%');
        setUploadProgress(progress.percentage);
      }
    );

    if (!storageResult.ok) {
      console.error('[Flow] Storage upload failed:', storageResult.error);
      setError(storageResult.error);
      setFlowState('error');
      setIsProcessing(false);
      // Upload state is preserved for retry
      return;
    }

    console.log('[Flow] Files uploaded to storage');

    // STEP 3: Acknowledge upload completion
    console.log('[Flow] Step 3: Acknowledging upload...');
    const ackResult = await sessionRef.current.acknowledgeUpload(newUploadState);

    if (!ackResult.ok) {
      console.error('[Flow] Upload acknowledgment failed:', ackResult.error);
      setError(ackResult.error);
      setFlowState('error');
      setIsProcessing(false);
      // Upload state is preserved for retry
      return;
    }

    console.log('[Flow] Upload acknowledged');

    // Clear upload state after successful completion
    setUploadState(null);

    console.log('[Flow] Upload completed successfully');
    console.log('[Flow] Transitioning to success state');
    setFlowState('success');
    setIsProcessing(false);
  }

  async function retryUpload() {
    if (!uploadState) {
      console.error('[Flow] No upload state available for retry');
      setError({
        title: 'Cannot retry',
        message: 'No upload state available. Please start over.',
        primaryAction: { label: 'Start over', action: 'start-over' },
      });
      setFlowState('error');
      return;
    }

    if (!sessionRef.current) {
      console.error('[Flow] No active session');
      setError({
        title: 'Session expired',
        message: 'No active session. Please start over.',
        primaryAction: { label: 'Start over', action: 'start-over' },
      });
      setFlowState('error');
      return;
    }

    setIsProcessing(true);
    console.log('[Flow] Retrying upload from storage step...');
    setFlowState('uploading');
    setUploadProgress(0);

    // STEP 2: Upload files to object storage (retry)
    console.log('[Flow] Step 2 (retry): Uploading files to storage...');
    const storageResult = await sessionRef.current.uploadToStorage(
      uploadState,
      (progress: UploadProgress) => {
        console.log('[Flow] Upload progress:', progress.percentage + '%');
        setUploadProgress(progress.percentage);
      }
    );

    if (!storageResult.ok) {
      console.error('[Flow] Retry storage upload failed:', storageResult.error);
      setError(storageResult.error);
      setFlowState('error');
      setIsProcessing(false);
      // Upload state is preserved for another retry
      return;
    }

    console.log('[Flow] Files uploaded to storage');

    // STEP 3: Acknowledge upload completion
    console.log('[Flow] Step 3: Acknowledging upload...');
    const ackResult = await sessionRef.current.acknowledgeUpload(uploadState);

    if (!ackResult.ok) {
      console.error('[Flow] Retry acknowledgment failed:', ackResult.error);
      setError(ackResult.error);
      setFlowState('error');
      setIsProcessing(false);
      // Upload state is preserved for another retry
      return;
    }

    console.log('[Flow] Upload acknowledged');

    // Clear upload state after successful completion
    setUploadState(null);

    console.log('[Flow] Retry successful');
    console.log('[Flow] Transitioning to success state');
    setFlowState('success');
    setIsProcessing(false);
  }

  async function startOver() {
    console.log('[Flow] Starting over...');
    setIsProcessing(true);

    try {
      // Clear any active timers
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        console.log('[Flow] Countdown interval cleared');
      }

      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
        console.log('[Flow] Auto-stop timer cleared');
      }

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
        await mediaCaptureRef.current.destroy();
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
    sessionInfo,
  };
}
