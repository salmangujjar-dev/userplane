/**
 * Client-side Recording Session Manager
 * Handles session initialization and file uploads using the userplane session API
 */

import * as Sentry from '@sentry/astro';
import {
  buildErrorTags,
  createApiBreadcrumb,
  createSystemBreadcrumb,
  createUploadBreadcrumb,
  ErrorSources,
  ErrorTypes,
  type UploadContext,
} from '@workspace/sentry';

import { getRecorderClient } from '@/client/api';
import {
  DEFAULT_MAX_RECORDING_DURATION_MS,
  THUMBNAIL_UPLOAD_CONFIG,
  VIDEO_UPLOAD_CONFIG,
} from '@/constants';
import { createLogger } from '@/lib/logger';
import { handleServerResult, type ServerResult } from '@/lib/server-errors';
import { createRecordingSpan, setRecordingContext } from '@/sentry/recording';
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

const logger = createLogger('recording-session');

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
    return Sentry.startSpan(
      {
        name: 'api.session.init',
        op: 'http.client',
        attributes: {
          'http.method': 'POST',
          'http.url': '/api/v1/session',
        },
      },
      async (span) => {
        logger.debug('initializing session');

        const startTime = Date.now();
        const [error, response] = await this.client.session.init({
          query: {
            'userplane-token': linkToken,
          },
        });
        const responseTime = Date.now() - startTime;

        // Set span attributes for detailed tracking
        span.setStatus({ code: error ? 1 : 0 });
        span.setAttribute('http.response_time_ms', responseTime);
        span.setAttribute('has_error', !!error);

        const result = handleServerResult(error, response?.data);

        if (!result.ok) {
          logger.error({ err: result.error }, 'initialization failed');
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

        this.preferences = toRecordingPreferences(payload.prefs);
        this.maxRecordingDurationMs =
          this.preferences?.maxDurationMs ?? DEFAULT_MAX_RECORDING_DURATION_MS;
        this.requesterName = this.preferences?.requestedBy ?? null;
        this.maxRecordingSize = null; // Not currently used

        logger.debug(
          { sessionId: this.sessionId, workspaceId: this.workspaceId },
          'session initialized'
        );

        // Set recording context in Sentry
        setRecordingContext({
          sessionId: this.sessionId,
          stage: 'initialization',
        });

        // Set user context for error correlation
        Sentry.setUser({
          id: this.sessionId || 'unknown',
          workspace_id: this.workspaceId || undefined,
          link_id: this.linkId || undefined,
        });

        // Set recording preferences context
        Sentry.setContext('recording_preferences', {
          maxDurationMs: this.maxRecordingDurationMs,
          maxSizeBytes: this.maxRecordingSize,
          requestedBy: this.requesterName,
          preferences: this.preferences,
        });

        // Capture and set browser capabilities context
        const systemMetadata = captureSystemMetadata();
        Sentry.setContext('browser_capabilities', {
          browser: systemMetadata.browser,
          os: systemMetadata.os,
          screen_resolution: `${systemMetadata.screenSize.width}x${systemMetadata.screenSize.height}`,
          window_size: `${systemMetadata.windowSize.width}x${systemMetadata.windowSize.height}`,
          language: systemMetadata.language,
          timezone: systemMetadata.timezone,
        });

        // Add breadcrumb with system info
        Sentry.addBreadcrumb(
          createSystemBreadcrumb({
            browser: systemMetadata.browser,
            os: systemMetadata.os,
            screenResolution: `${systemMetadata.screenSize.width}x${systemMetadata.screenSize.height}`,
          })
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
    );
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
    customMetadata?: Record<string, unknown> | null,
    notes?: string
  ): Promise<ServerResult<UploadState>> {
    return createRecordingSpan('session.initializeUpload', 'recording.upload', async () => {
      logger.debug('initializing upload');

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

      // Set system metadata context for error tracking
      Sentry.setContext('system', systemMetadata as unknown as Record<string, unknown>);

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

      const uploadInitPayload = {
        body: {
          recording_duration: recordingDurationMs || 0,
          files,
          metadata: {
            systemMetadata: prettySystemMetadata(systemMetadata),
            customMetadata: customMetadata ?? {},
            ...(notes ? { notes } : {}),
          },
        },
      };

      const startTime = Date.now();
      const [error, response] = await this.client.session.upload.init(uploadInitPayload, {
        context: {
          headers: {
            'x-userplane-session-token': this.sessionToken,
          },
        },
      });
      const responseTime = Date.now() - startTime;

      // Track API call performance
      Sentry.addBreadcrumb(
        createApiBreadcrumb({
          endpoint: '/session/upload/init',
          method: 'POST',
          hasError: !!error,
          responseTime,
          additionalData: {
            videoSize: videoFile.size,
            thumbnailSize: thumbnailBlob?.size || 0,
          },
        })
      );

      const result = handleServerResult(error, response?.data);

      if (!result.ok) {
        logger.error({ err: result.error }, 'upload initialization failed');
        return result;
      }

      this.recordingId = result.data.recordingId;
      const uploadToken = result.data.uploadToken;
      const presignedUrls = result.data.presignedUrls;

      // Update recording context with recordingId
      setRecordingContext({
        sessionId: this.sessionId || undefined,
        recordingId: this.recordingId,
        stage: 'upload',
      });

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
    });
  }

  /**
   * STEP 2: Upload files to object storage
   * Can be retried independently if it fails
   */
  async uploadToStorage(
    uploadState: UploadState,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<ServerResult<void>> {
    return createRecordingSpan('session.uploadToStorage', 'recording.storage', async () => {
      logger.debug({ recordingId: uploadState.recordingId }, 'starting storage upload');

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
          const percentage = Math.round((uploadedBytes / totalSize) * 100);

          // Add breadcrumbs at upload milestones for monitoring
          if ([25, 50, 75, 100].includes(percentage)) {
            Sentry.addBreadcrumb(
              createUploadBreadcrumb({
                percentage,
                uploadedBytes,
                totalSize,
                recordingId: uploadState.recordingId,
                sessionId: this.sessionId ?? undefined,
              })
            );
          }

          onProgress({
            partNumber: 1,
            totalParts: 1,
            uploadedBytes,
            totalBytes: totalSize,
            percentage,
          });
        }
      };

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
        logger.error({ err }, 'video upload failed');

        // Capture CRITICAL video upload failure in Sentry with detailed context
        const uploadCtx: UploadContext = {
          file_type: 'video',
          file_size: videoFile.size,
          file_mime_type: videoFile.type,
          recording_id: uploadState.recordingId,
          session_id: this.sessionId ?? undefined,
          total_size: totalSize,
          progress_before_failure: videoUploaded,
        };
        Sentry.captureException(err, {
          level: 'error',
          tags: {
            ...buildErrorTags({
              errorType: ErrorTypes.VIDEO_UPLOAD_FAILED,
              errorSource: ErrorSources.RECORDING_SESSION,
            }),
            recording_id: uploadState.recordingId,
          },
          contexts: {
            upload: uploadCtx,
          },
        });

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

      logger.debug('video upload complete');

      // Upload thumbnail if available
      // Thumbnail upload is non-critical: if it fails, we proceed with acknowledgment
      // to prevent orphaning the already-uploaded video
      if (thumbnailBlob && thumbnailBlob.size > 0) {
        const thumbnailUrl = presignedUrls.find((u) => u.type === 'thumbnail');
        if (thumbnailUrl) {
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
          } catch (err) {
            logger.warn({ err }, 'thumbnail upload failed, proceeding without');

            // Capture thumbnail upload failures as quality degradation warnings
            const thumbCtx: UploadContext = {
              file_type: 'thumbnail',
              recording_id: uploadState.recordingId,
              session_id: this.sessionId ?? undefined,
            };
            Sentry.captureException(err, {
              level: 'warning',
              tags: {
                ...buildErrorTags({
                  errorType: ErrorTypes.THUMBNAIL_UPLOAD_FAILURE,
                  errorSource: ErrorSources.RECORDING_SESSION,
                }),
                recording_id: uploadState.recordingId || 'unknown',
              },
              contexts: {
                upload: thumbCtx,
              },
            });

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

      logger.debug('all files uploaded');
      return { ok: true, data: undefined };
    });
  }

  /**
   * STEP 3: Complete upload and acknowledge success
   * Marks the recording as available
   */
  async acknowledgeUpload(uploadState: UploadState): Promise<ServerResult<void>> {
    return Sentry.startSpan(
      {
        name: 'api.session.upload.complete',
        op: 'http.client',
        attributes: {
          'http.method': 'POST',
          'http.url': '/api/v1/session/upload/complete',
          recording_id: uploadState.recordingId,
        },
      },
      async (span) => {
        logger.debug({ recordingId: uploadState.recordingId }, 'acknowledging upload');

        const startTime = Date.now();
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
        const responseTime = Date.now() - startTime;

        // Set span attributes for detailed tracking
        span.setStatus({ code: error ? 1 : 0 });
        span.setAttribute('http.response_time_ms', responseTime);
        span.setAttribute('has_error', !!error);

        const result = handleServerResult(error, response?.data);

        if (!result.ok) {
          logger.error({ err: result.error }, 'upload acknowledgment failed');
          return result;
        }

        logger.debug('upload acknowledged');
        return { ok: true, data: undefined };
      }
    );
  }

  /**
   * Cleanup session resources
   */
  destroy(): void {
    this.sessionToken = null;
  }
}
