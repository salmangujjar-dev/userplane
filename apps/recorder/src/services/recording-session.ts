/**
 * Client-side Recording Session Manager
 * Handles session initialization and file uploads using the userplane session API
 */

import { getRecorderClient } from '@/client/api';
import type { UserplaneClient } from '@workspace/client';
import type { SessionTokenPayload, RecordingPreferences } from '@/types/session-preferences';
import { toRecordingPreferences } from '@/types/session-preferences';

export interface UploadProgress {
  partNumber: number;
  totalParts: number;
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
}

export interface SystemMetadata {
  date: string;
  time: string;
  browser: string;
  os: string;
  windowSize: {
    width: number;
    height: number;
  };
}

export class RecordingSession {
  private client: UserplaneClient;
  private sessionToken: string | null = null;
  public sessionId: string | null = null;
  public recordingId: string | null = null;
  public maxRecordingDurationMs: number = 180000; // Default 3 minutes
  public maxRecordingSize: number | null = null;
  public requesterName: string | null = null;
  public preferences: RecordingPreferences | null = null;

  constructor() {
    this.client = getRecorderClient();
  }

  /**
   * Initialize session from link token
   */
  async initialize(linkToken: string): Promise<void> {
    console.log('[Session] Initializing session');

    const result = await this.client.session.init({
      token: linkToken,
    });

    this.sessionToken = result.data.sessionToken;

    if (!this.sessionToken) {
      throw new Error('No session token returned from API');
    }

    const payload = this.decodeJWT(this.sessionToken) as SessionTokenPayload;
    console.log('[Session] Session token payload:', payload);
    this.sessionId = payload.sid;

    if (!payload.prefs) {
      throw new Error('Session token missing preferences');
    }

    console.log('[Session] Raw preferences from token:', payload.prefs);

    this.preferences = toRecordingPreferences(payload.prefs);
    this.maxRecordingDurationMs = this.preferences.maxDurationMs;
    this.requesterName = this.preferences.requestedBy;

    const linkPayload = this.decodeJWT(linkToken);
    console.log('[Session] Link token payload:', linkPayload);
    this.maxRecordingSize = linkPayload.rms || null;

    console.log('[Session] Initialized successfully');
    console.log('[Session] Session ID:', this.sessionId);
    console.log('[Session] Preferences:', this.preferences);
    console.log('[Session] Max recording duration:', `${this.maxRecordingDurationMs}ms`);
    console.log(
      '[Session] Max recording size:',
      this.maxRecordingSize ? `${this.maxRecordingSize} bytes` : '(unlimited)'
    );
  }

  /**
   * Upload recording files
   */
  async uploadFiles(
    videoFile: File,
    thumbnailBlob: Blob | null,
    recordingDurationMs: number | null,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<void> {
    console.log('[Upload] Starting upload process');
    console.log('[Upload] Video file:', {
      name: videoFile.name,
      size: videoFile.size,
      type: videoFile.type,
    });
    console.log(
      '[Upload] Recording duration:',
      recordingDurationMs ? `${recordingDurationMs}ms` : '0ms (default)'
    );
    console.log('[Upload] Thumbnail:', thumbnailBlob ? `${thumbnailBlob.size} bytes` : 'none');

    if (!this.sessionToken) {
      throw new Error('No session token available');
    }

    const systemMetadata = this.captureSystemMetadata();
    console.log('[Upload] System metadata:', systemMetadata);

    const files: Array<{
      type: 'video' | 'thumbnail' | 'console_log' | 'network_log';
      name: string;
      size: number;
      mime_type: string;
    }> = [
      {
        type: 'video',
        name: videoFile.name,
        size: videoFile.size,
        mime_type: videoFile.type,
      },
    ];

    if (thumbnailBlob && thumbnailBlob.size > 0) {
      files.push({
        type: 'thumbnail',
        name: 'thumbnail.webp',
        size: thumbnailBlob.size,
        mime_type: 'image/webp',
      });
    }

    console.log(
      '[Upload] Initiating upload with session token:',
      this.sessionToken?.substring(0, 20) + '...'
    );
    console.log('[Upload] Session token header will be set as x-session-token');

    const uploadInitPayload = {
      recording_duration: recordingDurationMs || 0,
      files,
      metadata: {
        systemMetadata,
        customMetadata: {},
      },
    };
    console.log('[Upload] Upload init payload:', uploadInitPayload);

    const uploadData = await this.client.session.upload.init(uploadInitPayload, {
      context: {
        headers: {
          'x-session-token': this.sessionToken,
        },
      },
    });

    console.log('[Upload] Upload init response:', uploadData.data);

    this.recordingId = uploadData.data.recordingId;
    const uploadToken = uploadData.data.uploadToken;
    const presignedUrls = uploadData.data.presignedUrls;

    console.log('[Upload] Upload initialized, uploading files...');

    const videoUrl = presignedUrls.find((u) => u.type === 'video');
    if (!videoUrl) {
      throw new Error('No video upload URL provided');
    }

    await this.uploadToS3(videoFile, videoUrl.url);

    if (thumbnailBlob && thumbnailBlob.size > 0) {
      const thumbnailUrl = presignedUrls.find((u) => u.type === 'thumbnail');
      if (thumbnailUrl) {
        const thumbnailFile = new File([thumbnailBlob], 'thumbnail.webp', {
          type: 'image/webp',
        });
        await this.uploadToS3(thumbnailFile, thumbnailUrl.url);
      }
    }

    if (onProgress) {
      onProgress({
        partNumber: 1,
        totalParts: 1,
        uploadedBytes: videoFile.size,
        totalBytes: videoFile.size,
        percentage: 100,
      });
    }

    console.log(
      '[Upload] Completing upload with upload token:',
      uploadToken?.substring(0, 20) + '...'
    );
    console.log('[Upload] Upload token header will be set as x-upload-token');

    await this.client.session.upload.complete(
      {
        recording_id: this.recordingId,
        state: 'complete',
      },
      {
        context: {
          headers: {
            'x-upload-token': uploadToken,
          },
        },
      }
    );

    console.log('[Upload] Upload completed successfully');
  }

  /**
   * Upload file to S3 using presigned URL
   */
  private async uploadToS3(file: File, url: string): Promise<void> {
    console.log(`[Upload] Uploading ${file.name}`);

    const uploadResponse = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file: ${uploadResponse.status}`);
    }

    console.log(`[Upload] ${file.name} uploaded successfully`);
  }

  /**
   * Capture system metadata
   */
  private captureSystemMetadata(): SystemMetadata {
    const now = new Date();

    const browser = this.detectBrowser();
    const os = this.detectOS();

    return {
      date: now.toISOString().split('T')[0],
      time: now.toISOString().split('T')[1].split('.')[0],
      browser,
      os,
      windowSize: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
  }

  /**
   * Detect browser
   */
  private detectBrowser(): string {
    const ua = navigator.userAgent;

    if (ua.indexOf('Firefox') > -1) {
      return 'Firefox';
    } else if (ua.indexOf('Edg') > -1) {
      return 'Edge';
    } else if (ua.indexOf('Chrome') > -1) {
      return 'Chrome';
    } else if (ua.indexOf('Safari') > -1) {
      return 'Safari';
    }

    return 'Unknown';
  }

  /**
   * Detect OS
   */
  private detectOS(): string {
    const ua = navigator.userAgent;

    if (ua.indexOf('Win') > -1) return 'Windows';
    if (ua.indexOf('Mac') > -1) return 'macOS';
    if (ua.indexOf('Linux') > -1) return 'Linux';
    if (ua.indexOf('Android') > -1) return 'Android';
    if (ua.indexOf('iOS') > -1) return 'iOS';

    return 'Unknown';
  }

  /**
   * Decode JWT (client-side only, for debugging)
   */
  private decodeJWT(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT');
    }
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.sessionToken = null;
  }
}
