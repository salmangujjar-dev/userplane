/**
 * Client-side Recording Session Manager
 * Handles session initialization and file uploads using the userplane session API
 */

import { getRecorderClient } from '@/client/api';
import type { UserplaneClient } from '@workspace/client';

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
  public maxRecordingDuration: number | null = null;
  public maxRecordingSize: number | null = null;
  public requesterName: string | null = null;
  public workspaceLogoUrl: string | null = null;
  public workspaceName: string | null = null;

  constructor() {
    this.client = getRecorderClient();
  }

  /**
   * Initialize session from link token
   */
  async initialize(linkToken: string): Promise<void> {
    try {
      console.log('[Session] Initializing session with token');

      const result = await this.client.session.init({
        token: linkToken,
      });

      this.sessionToken = result.data.sessionToken;

      if (!this.sessionToken) {
        throw new Error('No session token returned from API');
      }

      const payload = this.decodeJWT(this.sessionToken);
      this.sessionId = payload.sid;

      const linkPayload = this.decodeJWT(linkToken);
      this.requesterName = linkPayload.rn || null;
      this.workspaceLogoUrl = linkPayload.wlu || null;
      this.workspaceName = linkPayload.wn || null;
      this.maxRecordingDuration = linkPayload.rmd ? linkPayload.rmd * 1000 : null;
      this.maxRecordingSize = linkPayload.rms || null;

      console.log('[Session] Initialized:', {
        sessionId: this.sessionId,
        requester: this.requesterName || '(not provided)',
        workspace: this.workspaceName || '(not provided)',
        maxDuration: this.maxRecordingDuration ? `${this.maxRecordingDuration}ms` : '(unlimited)',
        maxSize: this.maxRecordingSize ? `${this.maxRecordingSize} bytes` : '(unlimited)',
      });
    } catch (error) {
      console.error('[Session] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Upload recording files
   */
  async uploadFiles(
    videoFile: File,
    thumbnailBlob: Blob | null,
    recordingDuration: number | null,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<void> {
    console.log('[Upload] Starting upload process');

    if (!this.sessionToken) {
      throw new Error('No session token available');
    }

    const systemMetadata = this.captureSystemMetadata();

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
        name: 'thumbnail.jpg',
        size: thumbnailBlob.size,
        mime_type: 'image/jpeg',
      });
    }

    const uploadData = await this.client.session.upload.init(
      {
        recording_duration: recordingDuration || 0,
        files,
        metadata: {
          systemMetadata,
          customMetadata: {},
        },
      },
      {
        context: {
          headers: {
            'x-session-token': this.sessionToken,
          },
        },
      }
    );

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
        const thumbnailFile = new File([thumbnailBlob], 'thumbnail.jpg', {
          type: 'image/jpeg',
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
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Upload] Uploading ${file.name} (attempt ${attempt + 1}/${maxRetries + 1})`);

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
        return;
      } catch (error) {
        lastError = error as Error;
        console.error(`[Upload] Attempt ${attempt + 1} failed:`, error);

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.log(`[Upload] Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Upload failed');
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
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.sessionToken = null;
  }
}
