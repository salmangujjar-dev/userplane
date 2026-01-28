/**
 * Sentry utilities for recorder app
 * Provides recording-specific error capture with context
 */
import * as Sentry from '@sentry/astro';
import {
  buildRecordingTags,
  type RecordingContext as SharedRecordingContext,
} from '@workspace/sentry';

/**
 * Recording context for Sentry
 */
export interface RecordingContext {
  sessionId?: string;
  recordingId?: string;
  stage?: 'initialization' | 'upload' | 'processing' | 'completion';
  uploadStatus?: string;
}

/**
 * Capture recording error with context
 * Adds recording-specific context to Sentry events
 */
export function captureRecordingError(
  error: unknown,
  context: RecordingContext,
  additionalTags?: Record<string, string>
): void {
  const sentryContext: SharedRecordingContext = {
    session_id: context.sessionId,
    recording_id: context.recordingId,
    stage: context.stage,
    upload_status: context.uploadStatus,
  };

  Sentry.captureException(error, {
    tags: {
      ...buildRecordingTags({
        sessionId: context.sessionId,
        recordingId: context.recordingId,
        stage: context.stage,
        uploadStatus: context.uploadStatus,
      }),
      ...additionalTags,
    },
    contexts: {
      recording: sentryContext,
    },
  });
}

/**
 * Set recording context for subsequent events
 * Useful for setting context at the start of a recording session
 */
export function setRecordingContext(context: RecordingContext): void {
  const sentryContext: SharedRecordingContext = {
    session_id: context.sessionId,
    recording_id: context.recordingId,
    stage: context.stage,
    upload_status: context.uploadStatus,
  };
  Sentry.setContext('recording', sentryContext);

  if (context.sessionId) {
    Sentry.setTag('session_id', context.sessionId);
  }
  if (context.recordingId) {
    Sentry.setTag('recording_id', context.recordingId);
  }
}

/**
 * Create a span for recording operations
 * Use for performance monitoring of recording stages
 */
export function createRecordingSpan<T>(
  name: string,
  operation: string,
  callback: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      name,
      op: operation,
    },
    callback
  );
}
