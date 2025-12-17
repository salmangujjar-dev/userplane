/**
 * Media Capture Service
 * Handles screen and audio recording using MediaRecorder API
 */

export type RecordingMode = 'screen-voice' | 'screen-only';

export interface MediaCaptureOptions {
  mode: RecordingMode;
  onDataAvailable?: (chunk: Blob) => void;
  onStop?: (blob: Blob) => void;
  onError?: (error: Error) => void;
}

export class MediaCapture {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private mode: RecordingMode;
  private startTime: number | null = null;
  private onStopCallback: ((blob: Blob) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;

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

      console.log('[MediaCapture] Requesting display media permissions...');
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor',
        } as any,
        audio: false,
      });

      let combinedStream = displayStream;

      if (mode === 'screen-voice') {
        try {
          console.log('[MediaCapture] Requesting audio permissions...');
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100,
            },
            video: false,
          });

          const audioTrack = audioStream.getAudioTracks()[0];
          combinedStream.addTrack(audioTrack);

          console.log('[MediaCapture] Audio track added');
        } catch (audioError) {
          console.warn(
            '[MediaCapture] Failed to get audio, continuing with video only:',
            audioError
          );
        }
      }

      this.stream = combinedStream;

      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 2500000,
      });

      console.log(`[MediaCapture] MediaRecorder created with ${mimeType}`);

      this.recordedChunks = [];
      this.onStopCallback = options?.onStop || null;
      this.onErrorCallback = options?.onError || null;

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
          options?.onDataAvailable?.(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        console.log(`[MediaCapture] Recording stopped, size: ${blob.size} bytes`);
        if (this.onStopCallback) {
          this.onStopCallback(blob);
        }
      };

      this.mediaRecorder.onerror = (event: any) => {
        const error = new Error(`MediaRecorder error: ${event.error}`);
        console.error('[MediaCapture] Error:', error);
        if (this.onErrorCallback) {
          this.onErrorCallback(error);
        }
      };

      combinedStream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('[MediaCapture] User stopped sharing');
        this.stop();
      });

      console.log('[MediaCapture] Permissions granted, ready to start recording');
    } catch (error) {
      console.error('[MediaCapture] Failed to request permissions:', error);
      throw error;
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
      console.warn('[MediaCapture] Recording already started');
      return;
    }

    console.log('[MediaCapture] Starting recording...');
    this.mediaRecorder.start(1000);
    this.startTime = Date.now();
    console.log('[MediaCapture] Recording started at:', new Date(this.startTime).toISOString());
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
   */
  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recording'));
        return;
      }

      if (this.mediaRecorder.state === 'inactive') {
        const blob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder.mimeType,
        });
        resolve(blob);
        return;
      }

      const handleStop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder!.mimeType,
        });
        this.cleanup();
        resolve(blob);
      };

      this.mediaRecorder.addEventListener('stop', handleStop, { once: true });
      this.mediaRecorder.stop();
    });
  }

  /**
   * Pause recording
   */
  pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      console.log('[MediaCapture] Recording paused');
    }
  }

  /**
   * Resume recording
   */
  resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      console.log('[MediaCapture] Recording resumed');
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
   * Get supported MIME type
   */
  private getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4',
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }

    return 'video/webm';
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
   */
  destroy(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.startTime = null;
  }
}

/**
 * Check if screen recording is supported
 */
export function isScreenRecordingSupported(): boolean {
  return !!(
    navigator.mediaDevices &&
    typeof navigator.mediaDevices.getDisplayMedia === 'function' &&
    typeof window.MediaRecorder !== 'undefined'
  );
}

/**
 * Request permission for screen recording
 */
export async function requestScreenRecordingPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (error) {
    console.error('Screen recording permission denied:', error);
    return false;
  }
}
