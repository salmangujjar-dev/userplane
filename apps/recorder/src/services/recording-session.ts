/**
 * Client-side Recording Session Manager
 * Handles session initialization and file uploads using the userplane session API
 */

import { getRecorderClient } from '@/client/api';
import {
  DEFAULT_MAX_RECORDING_DURATION_MS,
  THUMBNAIL_UPLOAD_CONFIG,
  VIDEO_UPLOAD_CONFIG,
} from '@/constants';
import { handleServerResult, type ServerResult } from '@/lib/server-errors';
import type { RecordingPreferences, SessionTokenPayload } from '@/types/session-preferences';
import { toRecordingPreferences } from '@/types/session-preferences';
import { captureSystemMetadata, prettySystemMetadata, type SystemMetadata } from '@/utils/browser';
import { decodeJwtPayload } from '@/utils/jwt';
import { uploadToObjectStore } from '@/utils/upload';

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
    type: 'video' | 'thumbnail' | 'console_log' | 'network_log' | 'action';
    url: string;
  }>;
  videoFile: File;
  thumbnailBlob: Blob | null;
}

/**
 * Session initialization result
 */
export interface SessionData {
  sessionId: string;
  preferences: RecordingPreferences;
  maxRecordingDurationMs: number;
  maxRecordingSize: number | null;
  requesterName: string | null;
}

export type { SystemMetadata };

export class RecordingSession {
  private client: ReturnType<typeof getRecorderClient>;
  private sessionToken: string | null = null;

  // Decoded session token properties (public API)
  public workspaceId: string | null = null;
  public linkId: string | null = null;
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
  async initialize(linkToken: string): Promise<ServerResult<SessionData>> {
    console.log('[Session] Initializing session');

    const [error, response] = await this.client.session.init({
      query: {
        'userplane-token': linkToken,
      },
    });

    const result = handleServerResult(error, response?.data);

    if (!result.ok) {
      console.log('[Session] Initialize failed:', result.error);
      return result;
    }

    this.sessionToken = result.data.sessionToken;

    if (!this.sessionToken) {
      return {
        ok: false,
        error: {
          title: 'Session error',
          message: 'No session token returned from API',
          primaryAction: { label: 'Start over', action: 'start-over' },
        },
      };
    }

    let payload: SessionTokenPayload;
    try {
      payload = decodeJwtPayload<SessionTokenPayload>(this.sessionToken);
    } catch {
      return {
        ok: false,
        error: {
          title: 'Invalid session',
          message: 'Could not decode session token',
          primaryAction: { label: 'Start over', action: 'start-over' },
        },
      };
    }

    console.log('[Session] Session token payload:', payload);

    // Extract decoded properties from session token
    this.workspaceId = payload.wid || null;
    this.linkId = payload.lid || null;
    this.sessionId = payload.sid;

    if (!payload.prefs) {
      return {
        ok: false,
        error: {
          title: 'Session error',
          message: 'Session token missing preferences',
          primaryAction: { label: 'Start over', action: 'start-over' },
        },
      };
    }

    console.log('[Session] Raw preferences from token:', payload.prefs);

    this.preferences = toRecordingPreferences(payload.prefs);
    this.maxRecordingDurationMs =
      this.preferences?.maxDurationMs ?? DEFAULT_MAX_RECORDING_DURATION_MS;
    this.requesterName = this.preferences?.requestedBy ?? null;
    this.maxRecordingSize = null; // Not currently used

    console.log('[Session] Initialized successfully');
    console.log('[Session] Workspace ID:', this.workspaceId);
    console.log('[Session] Link ID:', this.linkId);
    console.log('[Session] Session ID:', this.sessionId);
    console.log('[Session] Preferences:', this.preferences);
    console.log('[Session] Max recording duration:', `${this.maxRecordingDurationMs}ms`);
    console.log(
      '[Session] Max recording size:',
      this.maxRecordingSize ? `${this.maxRecordingSize} bytes` : '(unlimited)'
    );

    return {
      ok: true,
      data: {
        sessionId: this.sessionId,
        preferences: this.preferences,
        maxRecordingDurationMs: this.maxRecordingDurationMs,
        maxRecordingSize: this.maxRecordingSize,
        requesterName: this.requesterName,
      },
    };
  }

  /**
   * STEP 1: Initialize upload and get presigned URLs
   * Returns upload state that can be stored for retry
   *
   * @param videoFile - The video file to upload
   * @param thumbnailBlob - Optional thumbnail blob
   * @param recordingDurationMs - Duration of the recording in milliseconds
   * @param customMetadata - Optional custom metadata from the host application
   */
  async initializeUpload(
    videoFile: File,
    thumbnailBlob: Blob | null,
    recordingDurationMs: number | null,
    customMetadata?: Record<string, unknown> | null
  ): Promise<ServerResult<UploadState>> {
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
      return {
        ok: false,
        error: {
          title: 'Session expired',
          message: 'No session token available. Please start over.',
          primaryAction: { label: 'Start over', action: 'start-over' },
        },
      };
    }

    const systemMetadata = captureSystemMetadata();
    console.log('[Upload:Init] System metadata:', systemMetadata);

    const files: Array<{
      type: 'video' | 'thumbnail' | 'console_log' | 'network_log' | 'action';
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
      body: {
        recording_duration: recordingDurationMs || 0,
        files,
        metadata: {
          systemMetadata: prettySystemMetadata(systemMetadata),
          customMetadata: customMetadata ?? {},
        },
      },
    };
    console.log('[Upload:Init] Upload init payload:', uploadInitPayload);
    if (customMetadata) {
      console.log('[Upload:Init] Custom metadata attached:', customMetadata);
    }

    const [error, response] = await this.client.session.upload.init(uploadInitPayload, {
      context: {
        headers: {
          'x-userplane-session-token': this.sessionToken,
        },
      },
    });

    const result = handleServerResult(error, response?.data);

    if (!result.ok) {
      console.log('[Upload:Init] Failed:', result.error);
      return result;
    }

    console.log('[Upload:Init] Received upload initialization response');

    this.recordingId = result.data.recordingId;
    const uploadToken = result.data.uploadToken;
    const presignedUrls = result.data.presignedUrls;

    console.log('[Upload:Init] Recording ID:', this.recordingId);
    console.log('[Upload:Init] Upload token received');
    console.log('[Upload:Init] Presigned URLs count:', presignedUrls.length);

    return {
      ok: true,
      data: {
        recordingId: this.recordingId,
        uploadToken,
        presignedUrls,
        videoFile,
        thumbnailBlob,
      },
    };
  }

  /**
   * STEP 2: Upload files to object storage
   * Can be retried independently if it fails
   */
  async uploadToStorage(
    uploadState: UploadState,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ServerResult<void>> {
    console.log('[Upload:Storage] Starting file uploads to object storage');
    console.log('[Upload:Storage] Recording ID:', uploadState.recordingId);

    const { videoFile, thumbnailBlob, presignedUrls } = uploadState;

    const videoUrl = presignedUrls.find((u) => u.type === 'video');
    if (!videoUrl) {
      return {
        ok: false,
        error: {
          title: 'Upload error',
          message: 'No video upload URL provided',
          primaryAction: { label: 'Start over', action: 'start-over' },
        },
      };
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

    try {
      // Upload video file with unified configuration
      await uploadToObjectStore(videoFile, videoUrl.url, {
        ...VIDEO_UPLOAD_CONFIG,
        onProgress: (progress) => {
          videoUploaded = progress.loaded;
          reportProgress();
        },
      });
    } catch (err) {
      console.error('[Upload:Storage] Video upload failed:', err);
      return {
        ok: false,
        error: {
          title: 'Upload failed',
          message: 'Failed to upload video. Check your connection and try again.',
          primaryAction: { label: 'Retry', action: 'retry-upload' },
          secondaryAction: { label: 'Start over', action: 'start-over' },
        },
      };
    }

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
          // Don't return error - proceed with acknowledgment anyway
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
    return { ok: true, data: undefined };
  }

  /**
   * STEP 3: Complete upload and acknowledge success
   * Marks the recording as available
   */
  async acknowledgeUpload(uploadState: UploadState): Promise<ServerResult<void>> {
    console.log('[Upload:Ack] Acknowledging upload completion');
    console.log('[Upload:Ack] Recording ID:', uploadState.recordingId);

    const [error, response] = await this.client.session.upload.complete(
      {
        body: {
          recording_id: uploadState.recordingId,
        },
      },
      {
        context: {
          headers: {
            'x-userplane-upload-token': uploadState.uploadToken,
          },
        },
      }
    );

    const result = handleServerResult(error, response?.data);

    if (!result.ok) {
      console.log('[Upload:Ack] Failed:', result.error);
      return result;
    }

    console.log('[Upload:Ack] Upload acknowledged successfully');
    return { ok: true, data: undefined };
  }

  /**
   * Cleanup session resources
   */
  destroy(): void {
    this.sessionToken = null;
  }
}
