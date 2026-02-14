/**
 * Media Capture Service
 * Handles screen and audio recording using MediaRecorder API
 */

import { AUDIO_SAMPLE_RATE_HZ, MEDIA_RECORDER_TIMESLICE_MS, VIDEO_BITRATE_BPS } from '@/constants';
import { createLogger } from '@/lib/logger';
import { posthog } from '@/posthog/client';
import { ClientError } from '@/posthog/client-errors';
import {
  getBestMimeType,
  isScreenRecordingSupported as checkScreenRecordingSupport,
} from '@/utils/browser';

export type RecordingMode = 'screen-voice' | 'screen-only';

export interface MediaCaptureOptions {
  mode: RecordingMode;
  onDataAvailable?: (chunk: Blob) => void;
  onStop?: (blob: Blob) => void;
  onError?: (error: Error) => void;
}

const logger = createLogger('media-capture');

export class MediaCapture {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private mode: RecordingMode;
  private startTime: number | null = null;
  private onStopCallback: ((blob: Blob) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;
  private isStopping: boolean = false;
  private stopPromiseResolve: ((blob: Blob) => void) | null = null;

  constructor(mode: RecordingMode = 'screen-only') {
    this.mode = mode;
  }

  /**
   * Get the active media stream for preview
   */
  getStream(): MediaStream | null {
    return this.stream;
  }

  /**
   * Get the current recording duration in milliseconds
   * Returns null if recording hasn't started
   */
  getDuration(): number | null {
    if (this.startTime === null) {
      return null;
    }
    return Date.now() - this.startTime;
  }

  /**
   * Get the recording start time
   */
  getStartTime(): number | null {
    return this.startTime;
  }

  /**
   * Request permissions and set up media stream (but don't start recording yet)
   */
  async requestPermissions(options?: MediaCaptureOptions): Promise<void> {
    try {
      const mode = options?.mode || this.mode;

      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        audio: false,
      });

      const combinedStream = displayStream;

      if (mode === 'screen-voice') {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: AUDIO_SAMPLE_RATE_HZ,
            },
            video: false,
          });

          const audioTrack = audioStream.getAudioTracks()[0];
          combinedStream.addTrack(audioTrack);
        } catch (audioError) {
          logger.warn({ err: audioError }, 'audio capture failed, continuing video-only');
        }
      }

      this.stream = combinedStream;

      const mimeType = getBestMimeType();
      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: VIDEO_BITRATE_BPS,
      });

      this.recordedChunks = [];
      this.onStopCallback = options?.onStop || null;
      this.onErrorCallback = options?.onError || null;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
          options?.onDataAvailable?.(event.data);
        }
      };

      // Set up onstop handler - this is the single source of truth for blob creation
      // Fires both for programmatic stops and browser UI stops
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder!.mimeType,
        });
        this.cleanup();
        this.isStopping = false;

        // Resolve stop() promise if it's waiting
        if (this.stopPromiseResolve) {
          this.stopPromiseResolve(blob);
          this.stopPromiseResolve = null;
        }

        // Notify callback if set (for browser UI stops)
        if (this.onStopCallback) {
          this.onStopCallback(blob);
        }
      };

      // MediaRecorder error event type is not well-defined in TypeScript
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.mediaRecorder.onerror = (event: any) => {
        const error = new ClientError('CLIENT_MEDIA_CONNECTION_FAILED', event.error);
        logger.error({ err: error, code: error.code }, 'media recorder error');

        posthog.captureException(error, {
          error_type: 'media_recorder_error',
          error_source: 'media_capture',
          error_code: error.code,
          recorder_state: this.mediaRecorder?.state || 'unknown',
          recorder_mime_type: this.mediaRecorder?.mimeType || 'unknown',
        });

        if (this.onErrorCallback) {
          this.onErrorCallback(error);
        }
      };

      // When user clicks "Stop sharing" in browser, MediaRecorder will automatically
      // stop and fire the onstop event above
      combinedStream.getVideoTracks()[0].addEventListener('ended', () => {
        // No need to do anything here - onstop handler will fire automatically
      });
    } catch (error) {
      logger.error({ err: error, mode: this.mode }, 'permission request failed');

      posthog.captureException(error, {
        error_type: 'media_permission_denied',
        error_source: 'media_capture',
        recording_mode: this.mode,
        browser_supported: checkScreenRecordingSupport(),
      });

      throw ClientError.fromBrowserError(error as Error);
    }
  }

  /**
   * Start the actual recording (must call requestPermissions first)
   */
  startRecording(): void {
    if (!this.mediaRecorder) {
      throw new Error('MediaRecorder not initialized. Call requestPermissions first.');
    }

    if (this.mediaRecorder.state !== 'inactive') {
      return;
    }

    this.mediaRecorder.start(MEDIA_RECORDER_TIMESLICE_MS);
    this.startTime = Date.now();
  }

  /**
   * Start recording (legacy method - requests permissions and starts recording immediately)
   */
  async start(options?: MediaCaptureOptions): Promise<void> {
    await this.requestPermissions(options);
    this.startRecording();
  }

  /**
   * Stop recording
   * Returns a promise that resolves with the recorded blob
   */
  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      if (this.mediaRecorder.state === 'inactive') {
        // Already stopped - return existing blob
        const blob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder.mimeType,
        });
        resolve(blob);
        return;
      }

      // Guard against concurrent stop calls
      if (this.isStopping) {
        reject(new Error('Stop already in progress'));
        return;
      }

      this.isStopping = true;

      // Store the resolve function - onstop handler will call it
      this.stopPromiseResolve = resolve;

      // Trigger stop - onstop handler will create blob and resolve promise
      this.mediaRecorder.stop();
    });
  }

  /**
   * Pause recording
   */
  pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  /**
   * Resume recording
   */
  resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  /**
   * Get current recording state
   */
  getState(): RecordingState | null {
    return this.mediaRecorder?.state || null;
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
  }

  /**
   * Destroy and cleanup all resources
   * Async to properly await stop() if recording is active
   */
  async destroy(): Promise<void> {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        await this.stop();
      } catch (err) {
        logger.warn({ err }, 'error stopping during destroy');
      }
    }
    this.cleanup();
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.startTime = null;
    this.isStopping = false;
    this.stopPromiseResolve = null;
    this.onStopCallback = null;
    this.onErrorCallback = null;
  }
}

/**
 * Check if screen recording is supported
 * Re-exported from browser utils for convenience
 */
export const isScreenRecordingSupported = checkScreenRecordingSupport;

/**
 * Request permission for screen recording (test only, immediately releases stream)
 */
export async function requestScreenRecordingPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (error) {
    logger.error({ err: error }, 'screen recording permission denied');

    posthog.captureException(error, {
      error_type: 'permission_check_failed',
      error_source: 'media_capture_test',
    });

    return false;
  }
}
