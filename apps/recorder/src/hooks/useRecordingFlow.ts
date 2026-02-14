/**
 * Recording Flow Hook
 * Manages the state machine for the entire recording flow
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { RECORDING_LIMITS } from '@/constants';
import { createLogger } from '@/lib/logger';
import { posthog } from '@/posthog/client';
import { createClientError, createClientErrorWithMessage } from '@/posthog/client-errors';
import {
  isScreenRecordingSupported,
  MediaCapture,
  type RecordingMode,
} from '@/services/media-capture';
import type { UploadProgress } from '@/services/recording-session';
import { RecordingSession, type UploadState } from '@/services/recording-session';
import { classifyError, type RecordingError } from '@/types/errors';
import type { RecordingPreferences } from '@/types/session-preferences';
import { DEFAULT_RECORDING_PREFERENCES } from '@/types/session-preferences';
import { generateVideoThumbnail } from '@/utils/video-thumbnail';

const logger = createLogger('recording-flow');

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
  /**
   * Submit the recording
   * @param customMetadata - Optional custom metadata from host application (in embedded mode)
   * @param notes - Optional notes from the customer
   */
  submitRecording: (
    customMetadata?: Record<string, unknown> | null,
    notes?: string
  ) => Promise<void>;
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
    RECORDING_LIMITS.DEFAULT_MAX_DURATION_MS
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

  const transitionToState = useCallback((newState: FlowState) => {
    setFlowState(newState);
  }, []);

  useEffect(() => {
    if (!linkToken || linkToken.trim() === '') {
      logger.error('no link token provided');
      setError(createClientError('CLIENT_LINK_TOKEN_MISSING'));
      setFlowState('error');
      return;
    }

    if (!action || action.trim() === '') {
      logger.error('no action provided');
      setError(createClientError('CLIENT_LINK_ACTION_MISSING'));
      setFlowState('error');
      return;
    }

    if (action !== 'recording') {
      logger.error({ action }, 'invalid action');
      setError(createClientError('CLIENT_LINK_ACTION_INVALID'));
      setFlowState('error');
      return;
    }

    if (!workspaceIds || workspaceIds.length === 0) {
      logger.error('no workspace IDs provided');
      setError(createClientError('CLIENT_LINK_WORKSPACE_MISSING'));
      setFlowState('error');
      return;
    }

    if (!isScreenRecordingSupported()) {
      logger.error('screen recording not supported');
      setError(createClientError('CLIENT_BROWSER_UNSUPPORTED'));
      setFlowState('error');
      return;
    }

    initializeSession(linkToken, workspaceIds);

    return () => {
      // Cleanup on unmount
      if (sessionRef.current) {
        sessionRef.current.destroy();
      }
      if (mediaCaptureRef.current) {
        // Async destroy, but we can't await in cleanup
        // Trigger it and let it complete asynchronously
        mediaCaptureRef.current.destroy().catch(() => {});
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkToken, action, workspaceIds]);

  useEffect(() => {
    const criticalStates: FlowState[] = ['countdown', 'recording', 'review', 'uploading'];

    if (criticalStates.includes(flowState)) {
      const handler = (e: BeforeUnloadEvent) => {
        e.preventDefault();
      };

      beforeUnloadHandlerRef.current = handler;
      window.addEventListener('beforeunload', handler);

      return () => {
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

    // Clear any existing timer
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
    }

    autoStopTimerRef.current = setTimeout(() => {
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
    setFlowState('loading');
    setError(null);

    const session = new RecordingSession();

    // Initialize session - this exchanges link token for session token
    const result = await session.initialize(linkToken);

    if (!result.ok) {
      logger.error({ err: result.error }, 'session initialization failed');
      setError(result.error);
      setFlowState('error');
      return;
    }

    // Validate workspace ID from the decoded session properties
    if (!session.workspaceId) {
      setError(createClientError('CLIENT_SESSION_WORKSPACE_MISSING'));
      setFlowState('error');
      return;
    }

    // Check if at least one of the expected workspace IDs matches
    const workspaceMatch = expectedWorkspaceIds.includes(session.workspaceId);
    if (!workspaceMatch) {
      setError(createClientError('CLIENT_LINK_WORKSPACE_MISMATCH'));
      setFlowState('error');
      return;
    }

    logger.debug({ sessionId: result.data.sessionId }, 'session initialized');

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
    }

    transitionToState('setup');
  }

  async function startRecording(mode: RecordingMode) {
    try {
      logger.debug({ mode }, 'starting recording');

      setRecordingMode(mode);

      const mediaCapture = new MediaCapture(mode);
      mediaCaptureRef.current = mediaCapture;

      await mediaCapture.requestPermissions({
        mode,
        onStop: async () => {
          // User stopped sharing via browser UI - delegate to stopRecording
          if (stopRecordingRef.current) {
            await stopRecordingRef.current();
          }
        },
        onError: (err) => {
          setError(classifyError(err));
          setFlowState('error');
        },
      });

      const stream = mediaCapture.getStream();
      setMediaStream(stream);

      transitionToState('countdown');
      setCountdownSeconds(3);

      // Clear any existing countdown interval
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }

      let countdown = 3;
      countdownIntervalRef.current = setInterval(() => {
        countdown -= 1;
        setCountdownSeconds(countdown);

        if (countdown === 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          mediaCapture.startRecording();
          transitionToState('recording');
        }
      }, 1000);
    } catch (err) {
      logger.error({ err, mode }, 'recording start failed');

      posthog.captureException(err, {
        error_type: 'recording_start_failed',
        error_source: 'recording_flow',
        recording_mode: mode,
      });

      setError(classifyError(err as Error));
      setFlowState('error');
    }
  }

  const stopRecording = useCallback(async () => {
    // Guard against concurrent calls
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);
    let createdBlobUrl: string | null = null;

    try {
      logger.debug('stopping recording');

      if (!mediaCaptureRef.current) {
        throw new Error('No active recording');
      }

      const durationMs = mediaCaptureRef.current.getDuration();

      const blob = await mediaCaptureRef.current.stop();
      logger.debug({ size: blob.size, type: blob.type, durationMs }, 'recording stopped');

      if (durationMs && durationMs > maxRecordingDurationMs) {
        setError(
          createClientErrorWithMessage(
            'CLIENT_RECORDING_DURATION_EXCEEDED',
            `Recording duration (${Math.round(durationMs / 1000)}s) exceeds the maximum allowed (${Math.round(maxRecordingDurationMs / 1000)}s)`
          )
        );
        setFlowState('error');
        return;
      }

      if (maxRecordingSize && blob.size > maxRecordingSize) {
        setError(
          createClientErrorWithMessage(
            'CLIENT_RECORDING_SIZE_EXCEEDED',
            `Recording size (${Math.round(blob.size / 1048576)}MB) exceeds the maximum allowed (${Math.round(maxRecordingSize / 1048576)}MB)`
          )
        );
        setFlowState('error');
        return;
      }

      // Store duration and blob
      setRecordingDurationMs(durationMs);
      setRecordingBlob(blob);

      // Create video URL for preview
      createdBlobUrl = URL.createObjectURL(blob);
      setVideoUrl(createdBlobUrl);

      // Generate thumbnail for upload
      const thumbnail = await generateVideoThumbnail(blob);
      if (thumbnail) {
        setThumbnailBlob(thumbnail);
      }

      transitionToState('review');
    } catch (err) {
      logger.error({ err }, 'recording stop failed');

      posthog.captureException(err, {
        error_type: 'recording_stop_failed',
        error_source: 'recording_flow',
      });

      // Clean up blob URL if it was created but we're erroring out
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }

      setError(classifyError(err as Error));
      setFlowState('error');
    } finally {
      setIsProcessing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProcessing, maxRecordingDurationMs, maxRecordingSize]);

  // Keep stopRecordingRef in sync with the latest stopRecording function
  useEffect(() => {
    stopRecordingRef.current = stopRecording;
  }, [stopRecording]);

  async function submitRecording(customMetadata?: Record<string, unknown> | null, notes?: string) {
    setIsProcessing(true);
    logger.debug('submitting recording');

    if (!recordingBlob) {
      setError(createClientError('CLIENT_RECORDING_MISSING'));
      setFlowState('error');
      setIsProcessing(false);
      return;
    }

    if (!sessionRef.current) {
      setError(createClientError('CLIENT_SESSION_MISSING'));
      setFlowState('error');
      setIsProcessing(false);
      return;
    }

    transitionToState('uploading');
    setUploadProgress(0);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = recordingBlob.type.includes('webm') ? 'webm' : 'mp4';
    const fileName = `recording-${timestamp}.${extension}`;
    const file = new File([recordingBlob], fileName, {
      type: recordingBlob.type,
    });

    // STEP 1: Initialize upload and get presigned URLs
    const initResult = await sessionRef.current.initializeUpload(
      file,
      thumbnailBlob,
      recordingDurationMs,
      customMetadata,
      notes
    );

    if (!initResult.ok) {
      logger.error({ err: initResult.error }, 'upload initialization failed');
      setError(initResult.error);
      setFlowState('error');
      setIsProcessing(false);
      return;
    }

    const newUploadState = initResult.data;
    setUploadState(newUploadState);

    // STEP 2: Upload files to object storage (retryable)
    const storageResult = await sessionRef.current.uploadToStorage(
      newUploadState,
      (progress: UploadProgress) => {
        setUploadProgress(progress.percentage);
      }
    );

    if (!storageResult.ok) {
      logger.error({ err: storageResult.error }, 'storage upload failed');
      setError(storageResult.error);
      setFlowState('error');
      setIsProcessing(false);
      // Upload state is preserved for retry
      return;
    }

    // STEP 3: Acknowledge upload completion
    const ackResult = await sessionRef.current.acknowledgeUpload(newUploadState);

    if (!ackResult.ok) {
      logger.error({ err: ackResult.error }, 'upload acknowledgment failed');
      setError(ackResult.error);
      setFlowState('error');
      setIsProcessing(false);
      // Upload state is preserved for retry
      return;
    }

    // Clear upload state after successful completion
    setUploadState(null);

    logger.debug({ recordingId: newUploadState.recordingId }, 'upload completed');
    transitionToState('success');
    setIsProcessing(false);
  }

  async function retryUpload() {
    if (!uploadState) {
      logger.error('no upload state for retry');
      setError(createClientError('CLIENT_UPLOAD_STATE_MISSING'));
      setFlowState('error');
      return;
    }

    if (!sessionRef.current) {
      setError(createClientError('CLIENT_SESSION_MISSING'));
      setFlowState('error');
      return;
    }

    setIsProcessing(true);
    setFlowState('uploading');
    setUploadProgress(0);

    // STEP 2: Upload files to object storage (retry)
    const storageResult = await sessionRef.current.uploadToStorage(
      uploadState,
      (progress: UploadProgress) => {
        setUploadProgress(progress.percentage);
      }
    );

    if (!storageResult.ok) {
      logger.error({ err: storageResult.error }, 'retry storage upload failed');
      setError(storageResult.error);
      setFlowState('error');
      setIsProcessing(false);
      // Upload state is preserved for another retry
      return;
    }

    // STEP 3: Acknowledge upload completion
    const ackResult = await sessionRef.current.acknowledgeUpload(uploadState);

    if (!ackResult.ok) {
      logger.error({ err: ackResult.error }, 'retry acknowledgment failed');
      setError(ackResult.error);
      setFlowState('error');
      setIsProcessing(false);
      // Upload state is preserved for another retry
      return;
    }

    // Clear upload state after successful completion
    setUploadState(null);

    setFlowState('success');
    setIsProcessing(false);
  }

  async function startOver() {
    logger.debug('starting over');
    setIsProcessing(true);

    try {
      // Clear any active timers
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }

      if (mediaCaptureRef.current) {
        const currentState = mediaCaptureRef.current.getState();

        if (currentState === 'recording' || currentState === 'paused') {
          try {
            await mediaCaptureRef.current.stop();
          } catch (err) {
            // Ignore stop errors during start over
            logger.debug({ err }, 'error stopping during start over');
          }
        }

        await mediaCaptureRef.current.destroy();
        mediaCaptureRef.current = null;
      }

      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }

      setRecordingBlob(null);
      setThumbnailBlob(null);
      setVideoUrl(null);
      setUploadProgress(0);
      setError(null);
      setMediaStream(null);
      setRecordingDurationMs(null);

      setFlowState('setup');
    } catch (err) {
      logger.error({ err }, 'error during start over');
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
