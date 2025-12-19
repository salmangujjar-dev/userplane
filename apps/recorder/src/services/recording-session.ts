/**
 * Client-side Recording Session Manager
 * Handles session initialization and file uploads using the userplane session API
 */

import { getRecorderClient } from '@/client/api';
import type { UserplaneClient } from '@workspace/client';
import type { SessionTokenPayload, RecordingPreferences } from '@/types/session-preferences';
import { toRecordingPreferences } from '@/types/session-preferences';
import { uploadToObjectStore } from '@/utils/upload';
import { captureSystemMetadata, type SystemMetadata } from '@/utils/browser';
import { decodeJwtPayload } from '@/utils/jwt';
import {
  DEFAULT_MAX_RECORDING_DURATION_MS,
  VIDEO_UPLOAD_CONFIG,
  THUMBNAIL_UPLOAD_CONFIG,
} from '@/constants';

export interface UploadProgress {
  partNumber: number;
  totalParts: number;
  uploadedBytes: number;
  totalBytes: number;
  percentage: number;
}

/**
 * Upload state containing presigned URLs and tokens
 * This state can be stored and used to retry the upload step
 */
export interface UploadState {
  recordingId: string;
  uploadToken: string;
  presignedUrls: Array<{
    type: 'video' | 'thumbnail' | 'console_log' | 'network_log';
    url: string;
  }>;
  videoFile: File;
  thumbnailBlob: Blob | null;
}

export type { SystemMetadata };

export class RecordingSession {
  private client: UserplaneClient;
  private sessionToken: string | null = null;
  public sessionId: string | null = null;
  public recordingId: string | null = null;
  public maxRecordingDurationMs: number = DEFAULT_MAX_RECORDING_DURATION_MS;
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

    const payload = decodeJwtPayload<SessionTokenPayload>(this.sessionToken);
    console.log('[Session] Session token payload:', payload);
    this.sessionId = payload.sid;

    if (!payload.prefs) {
      throw new Error('Session token missing preferences');
    }

    console.log('[Session] Raw preferences from token:', payload.prefs);

    this.preferences = toRecordingPreferences(payload.prefs);
    this.maxRecordingDurationMs = this.preferences.maxDurationMs;
    this.requesterName = this.preferences.requestedBy;

    const linkPayload = decodeJwtPayload<{ rms?: number }>(linkToken);
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
   * STEP 1: Initialize upload and get presigned URLs
   * Returns upload state that can be stored for retry
   */
  async initializeUpload(
    videoFile: File,
    thumbnailBlob: Blob | null,
    recordingDurationMs: number | null
  ): Promise<UploadState> {
    console.log('[Upload:Init] Initializing upload');
    console.log('[Upload:Init] Video file:', {
      name: videoFile.name,
      size: videoFile.size,
      type: videoFile.type,
    });
    console.log(
      '[Upload:Init] Recording duration:',
      recordingDurationMs ? `${recordingDurationMs}ms` : '0ms (default)'
    );
    console.log('[Upload:Init] Thumbnail:', thumbnailBlob ? `${thumbnailBlob.size} bytes` : 'none');

    if (!this.sessionToken) {
      throw new Error('No session token available');
    }

    const systemMetadata = captureSystemMetadata();
    console.log('[Upload:Init] System metadata:', systemMetadata);

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
      '[Upload:Init] Requesting presigned URLs with session token:',
      this.sessionToken?.substring(0, 20) + '...'
    );

    const uploadInitPayload = {
      recording_duration: recordingDurationMs || 0,
      files,
      metadata: {
        systemMetadata: {
          date: systemMetadata.date,
          time: systemMetadata.time,
          browser: systemMetadata.browser,
          os: systemMetadata.os,
          windowSize: systemMetadata.windowSize,
        },
        customMetadata: {},
      },
    };
    console.log('[Upload:Init] Upload init payload:', uploadInitPayload);

    const uploadData = await this.client.session.upload.init(uploadInitPayload, {
      context: {
        headers: {
          'x-session-token': this.sessionToken,
        },
      },
    });

    console.log('[Upload:Init] Received upload initialization response');

    this.recordingId = uploadData.data.recordingId;
    const uploadToken = uploadData.data.uploadToken;
    const presignedUrls = uploadData.data.presignedUrls;

    console.log('[Upload:Init] Recording ID:', this.recordingId);
    console.log('[Upload:Init] Upload token received');
    console.log('[Upload:Init] Presigned URLs count:', presignedUrls.length);

    return {
      recordingId: this.recordingId,
      uploadToken,
      presignedUrls,
      videoFile,
      thumbnailBlob,
    };
  }

  /**
   * STEP 2: Upload files to object storage
   * Can be retried independently if it fails
   */
  async uploadToStorage(
    uploadState: UploadState,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<void> {
    console.log('[Upload:Storage] Starting file uploads to object storage');
    console.log('[Upload:Storage] Recording ID:', uploadState.recordingId);

    const { videoFile, thumbnailBlob, presignedUrls } = uploadState;

    const videoUrl = presignedUrls.find((u) => u.type === 'video');
    if (!videoUrl) {
      throw new Error('No video upload URL provided');
    }

    // Track progress across both files
    const totalSize = videoFile.size + (thumbnailBlob?.size || 0);
    let videoUploaded = 0;
    let thumbnailUploaded = 0;

    const reportProgress = () => {
      if (onProgress) {
        const uploadedBytes = videoUploaded + thumbnailUploaded;
        onProgress({
          partNumber: 1,
          totalParts: 1,
          uploadedBytes,
          totalBytes: totalSize,
          percentage: Math.round((uploadedBytes / totalSize) * 100),
        });
      }
    };

    console.log('[Upload:Storage] Uploading video file...');
    // Upload video file with unified configuration
    await uploadToObjectStore(videoFile, videoUrl.url, {
      ...VIDEO_UPLOAD_CONFIG,
      onProgress: (progress) => {
        videoUploaded = progress.loaded;
        reportProgress();
      },
    });
    console.log('[Upload:Storage] Video upload complete');

    // Upload thumbnail if available
    // Thumbnail upload is non-critical: if it fails, we proceed with acknowledgment
    // to prevent orphaning the already-uploaded video
    if (thumbnailBlob && thumbnailBlob.size > 0) {
      const thumbnailUrl = presignedUrls.find((u) => u.type === 'thumbnail');
      if (thumbnailUrl) {
        console.log('[Upload:Storage] Uploading thumbnail...');
        try {
          const thumbnailFile = new File([thumbnailBlob], 'thumbnail.webp', {
            type: 'image/webp',
          });
          await uploadToObjectStore(thumbnailFile, thumbnailUrl.url, {
            ...THUMBNAIL_UPLOAD_CONFIG,
            onProgress: (progress) => {
              thumbnailUploaded = progress.loaded;
              reportProgress();
            },
          });
          console.log('[Upload:Storage] Thumbnail upload complete');
        } catch (err) {
          console.warn(
            '[Upload:Storage] Thumbnail upload failed, proceeding without thumbnail:',
            err
          );
          // Don't throw - proceed with acknowledgment anyway
        }
      }
    }

    // Report 100% completion
    if (onProgress) {
      onProgress({
        partNumber: 1,
        totalParts: 1,
        uploadedBytes: totalSize,
        totalBytes: totalSize,
        percentage: 100,
      });
    }

    console.log('[Upload:Storage] All files uploaded successfully');
  }

  /**
   * STEP 3: Complete upload and acknowledge success
   * Marks the recording as available
   */
  async acknowledgeUpload(uploadState: UploadState): Promise<void> {
    console.log('[Upload:Ack] Acknowledging upload completion');
    console.log('[Upload:Ack] Recording ID:', uploadState.recordingId);

    await this.client.session.upload.complete(
      {
        recording_id: uploadState.recordingId,
      },
      {
        context: {
          headers: {
            'x-upload-token': uploadState.uploadToken,
          },
        },
      }
    );

    console.log('[Upload:Ack] Upload acknowledged successfully');
  }

  /**
   * Cleanup session resources
   */
  destroy(): void {
    this.sessionToken = null;
  }
}
