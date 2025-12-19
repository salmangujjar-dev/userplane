/**
 * SessionService - Business logic for recording session and upload operations
 * Handles token generation, validation, and upload workflow
 */

import jwt from 'jsonwebtoken';
import { env } from '@/api/env';
import { generateSessionId, generateRecordingId } from '@/api/lib/id-generator';
import {
  LinkRepository,
  type LinkWithWorkspacePrefsRow,
} from '@/api/repositories/links.repository';
import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { ProjectRepository } from '@/api/repositories/projects.repository';
import { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import type { LinkService } from '@/api/services/link.service';
import {
  ValidationError,
  NotFoundError,
  GoneError,
  ForbiddenError,
  ConflictError,
} from '@/api/lib/errors';
import {
  SESSION_CONSTRAINTS,
  validateFileMimeType,
  getMaxFileSize,
  isTerminalState,
  type UploadFile,
  type RecordingMetaInput,
} from '@/api/schema/session.schema';
import type {
  SessionTokenPayload,
  UploadTokenPayload,
  SessionPreferences,
  PresignedUrlInfo,
  UploadFileType,
} from '@/api/types';
import type {
  VideoStorageClient,
  ThumbnailsStorageClient,
  ConsoleLogsStorageClient,
  NetworkLogsStorageClient,
} from '@workspace/storage';
import { tasks } from '@trigger.dev/sdk/v3';
import { TASK_IDS } from '@/api/trigger/constants';
import { buildStaleRecordingCheckKey } from '@/api/trigger/idempotency';
import { getPurgeDelay } from '../trigger/delay-calculator';

export interface SessionServiceDeps {
  linkRepo: LinkRepository;
  recordingRepo: RecordingRepository;
  projectRepo: ProjectRepository;
  workspaceRepo: WorkspaceRepository;
  videoStorage: VideoStorageClient;
  thumbnailsStorage: ThumbnailsStorageClient;
  consoleLogsStorage: ConsoleLogsStorageClient;
  networkLogsStorage: NetworkLogsStorageClient;
  linkService: LinkService;
}

/**
 * Result of session initialization
 */
export interface SessionInitResult {
  sessionToken: string;
  expiresIn: number;
}

/**
 * Excluded file info for response headers
 */
export interface ExcludedFileInfo {
  type: UploadFileType;
  reason: string;
}

/**
 * Result of upload initialization
 */
export interface UploadInitResult {
  recordingId: string;
  uploadToken: string;
  uploadTokenExpiresIn: number;
  presignedUrls: PresignedUrlInfo[];
  excludedFiles: ExcludedFileInfo[];
}

/**
 * Result of marking upload as available
 */
export interface UploadCompleteResult {
  success: boolean;
  recordingId: string;
  status: 'available';
}

/**
 * Parsed file info with storage path
 */
interface FileUploadInfo {
  type: UploadFileType;
  path: string;
  url: string;
  size: number;
}

export class SessionService {
  private sessionSecret: string;
  private uploadSecret: string;
  private jwtIssuer: string;

  constructor(private deps: SessionServiceDeps) {
    this.sessionSecret = env.session.tokenSecret;
    this.uploadSecret = env.session.uploadTokenSecret;
    this.jwtIssuer = env.jwtIssuer;
  }

  /**
   * Initialize a recording session for a link
   * GET /api/v1/session
   * Validates the link token and extracts the link ID before proceeding
   */
  async initSession(linkToken: string): Promise<SessionInitResult> {
    // Verify link token and extract link ID
    const linkId = this.deps.linkService.verifyLinkToken(linkToken);

    // Fetch link with workspace preferences
    const linkData = await this.deps.linkRepo.findByIdWithWorkspacePrefs(linkId);

    if (!linkData) {
      // Check if link was deleted
      const isSoftDeleted = await this.deps.linkRepo.isSoftDeleted(linkId);
      if (isSoftDeleted === true) {
        throw new GoneError("Link's expired, try requesting a new one");
      }
      throw new NotFoundError("Link doesn't seem to exist, try requesting a new one");
    }

    // Guard rails: Check if related resources are deleted
    // Note: The query findByIdWithWorkspacePrefs already filters for non-deleted workspace and domain
    // via the JOIN conditions with eq(workspaces.isDeleted, false) and eq(domains.isDeleted, false)
    // So if we reach here, workspace and domain are valid

    // Validate link type - only recording links allowed
    if (linkData.linkType !== 'recording') {
      throw new ValidationError("Link isn't set up for recordings");
    }

    // Check reusability - if not reusable, ensure no terminal state recordings
    // Non-terminal state (pending) is allowed to retry
    if (!linkData.linkReusable) {
      const terminalCount = await this.deps.linkRepo.countTerminalRecordingsForLink(linkId);
      if (terminalCount > 0) {
        throw new ConflictError("Link's been used already, grab a new one");
      }
    }

    // Generate session ID for tracking
    const sessionId = generateSessionId();

    // Build session token payload
    const payload: Omit<SessionTokenPayload, 'iat' | 'exp'> = {
      iss: this.jwtIssuer,
      lid: linkData.linkId,
      lt: linkData.linkType,
      wid: linkData.workspaceId,
      sid: sessionId,
      prefs: this.buildSessionPreferences(linkData),
    };

    // Sign token with session secret
    const sessionToken = jwt.sign(payload, this.sessionSecret, {
      expiresIn: SESSION_CONSTRAINTS.SESSION_TOKEN_EXPIRY,
    });

    return {
      sessionToken,
      expiresIn: SESSION_CONSTRAINTS.SESSION_TOKEN_EXPIRY,
    };
  }

  /**
   * Initialize upload and generate presigned URLs
   * POST /api/v1/session
   *
   * @param sessionToken - Valid session token from GET /api/v1/session
   * @param recordingDurationMs - Duration of the recording in milliseconds
   * @param files - Array of files to upload
   * @param metadata - Client-provided metadata
   */
  async initUpload(
    sessionToken: string,
    recordingDurationMs: number,
    files: UploadFile[],
    metadata: RecordingMetaInput
  ): Promise<UploadInitResult> {
    // Verify and decode session token
    const sessionPayload = this.verifySessionToken(sessionToken);
    if (!sessionPayload) {
      throw new ForbiddenError("Session's expired, let's start over");
    }

    // Re-validate link state (may have been deleted since session init)
    const linkData = await this.deps.linkRepo.findByIdWithWorkspacePrefs(sessionPayload.lid);
    if (!linkData) {
      const isSoftDeleted = await this.deps.linkRepo.isSoftDeleted(sessionPayload.lid);
      if (isSoftDeleted === true) {
        throw new GoneError("Link's expired, try requesting a new one");
      }
      throw new NotFoundError("Link doesn't seem to exist, try requesting a new one");
    }

    // Validate link type again
    if (linkData.linkType !== 'recording') {
      throw new ValidationError("Link isn't set up for recordings");
    }

    // Check reusability again - only block if terminal state recordings exist
    // Allows users to retry if previous upload was in non-terminal state (pending)
    if (!linkData.linkReusable) {
      const terminalCount = await this.deps.linkRepo.countTerminalRecordingsForLink(
        sessionPayload.lid
      );
      if (terminalCount > 0) {
        throw new ConflictError("Link's been used already, grab a new one");
      }
    }

    // Validate recording duration
    if (recordingDurationMs < SESSION_CONSTRAINTS.MIN_DURATION_MS) {
      throw new ValidationError('Recording needs to be a bit longer');
    }

    // Validate against workspace-specific limit (if set)
    if (sessionPayload.prefs.rmd !== null && recordingDurationMs > sessionPayload.prefs.rmd) {
      throw new ValidationError('Recording ran too long, try keeping it shorter');
    }

    // Validate against absolute maximum
    if (recordingDurationMs > SESSION_CONSTRAINTS.DEFAULT_MAX_DURATION_MS) {
      throw new ValidationError('Recording ran too long, try keeping it shorter');
    }

    // Validate files and get exclusions
    // filesToUpload stores the information about the files that will be uploaded
    // excludedFiles stores the information about the files that were excluded
    // excludedFiles is used to return the information about the files that were excluded
    // to the client in the response headers
    const { filesToUpload, excludedFiles } = this.validateAndFilterFiles(
      files,
      sessionPayload.prefs
    );

    // Generate recording ID
    const recordingId = generateRecordingId();

    // Generate presigned URLs for files that need upload
    const fileUploads = await this.generatePresignedUrls(recordingId, filesToUpload);

    // Extract file paths and sizes for database (only for files being uploaded)
    const filePaths = this.extractFilePaths(fileUploads);

    // Create recording record in database
    await this.deps.recordingRepo.create({
      id: recordingId,
      recordingLinkId: sessionPayload.lid,
      workspaceId: sessionPayload.wid,
      projectId: linkData.projectId,
      createdBy: linkData.createdBy,
      recordingDurationMs,
      recordingVideoRef: filePaths.videoPath,
      recordingThumbnailRef: filePaths.thumbnailPath,
      recordingConsoleLogRef: filePaths.consoleLogPath,
      recordingNetworkLogsRef: filePaths.networkLogPath,
      recordingMeta: {
        version: 1,
        systemMetadata: metadata.systemMetadata,
        customMetadata: {
          ...metadata.customMetadata,
          sessionId: sessionPayload.sid,
        },
      },
    });

    // Schedule stale recording check
    // Delays execution by presignedUrlExpiry to check if recording is still pending
    // If so, marks it deleted and triggers cleanup
    await tasks.trigger(
      TASK_IDS.CHECK_STALE_RECORDING,
      { recordingId },
      {
        idempotencyKey: buildStaleRecordingCheckKey(recordingId),
        delay: getPurgeDelay('pending'),
      }
    );

    // Generate upload token scoped to this recording
    const uploadToken = this.generateUploadToken(
      recordingId,
      sessionPayload.lid,
      sessionPayload.lt
    );

    // Build presigned URL response (only for files being uploaded)
    const presignedUrls: PresignedUrlInfo[] = fileUploads.map((f) => ({
      type: f.type,
      url: f.url,
      expiresIn: SESSION_CONSTRAINTS.PRESIGNED_URL_EXPIRY,
    }));

    return {
      recordingId,
      uploadToken,
      uploadTokenExpiresIn: SESSION_CONSTRAINTS.UPLOAD_TOKEN_EXPIRY,
      presignedUrls,
      excludedFiles,
    };
  }

  /**
   * Mark upload as available
   * PATCH /api/v1/session
   *
   * @param uploadToken - Valid upload token from POST /api/v1/session
   * @param recordingId - Recording ID to update
   */
  async markAsAvailable(uploadToken: string, recordingId: string): Promise<UploadCompleteResult> {
    // Verify upload token
    const uploadPayload = this.verifyUploadToken(uploadToken);
    if (!uploadPayload) {
      throw new ForbiddenError('Upload session expired, try uploading again');
    }

    // Validate recording ID matches token
    if (uploadPayload.rid !== recordingId) {
      throw new ForbiddenError('Upload got mixed up, try again');
    }

    // Check if link still exists
    const linkExists = await this.deps.linkRepo.findById(uploadPayload.lid);
    if (!linkExists) {
      const isSoftDeleted = await this.deps.linkRepo.isSoftDeleted(uploadPayload.lid);
      if (isSoftDeleted === true) {
        throw new GoneError("Link's expired, try requesting a new one");
      }
      throw new NotFoundError("Link doesn't seem to exist, try requesting a new one");
    }

    // Get pending recording by ID with file paths
    const recording =
      await this.deps.recordingRepo.findPendingRecordingByIdWithFilePaths(recordingId);
    if (!recording) {
      // Check if soft deleted
      const isSoftDeleted = await this.deps.recordingRepo.isSoftDeleted(recordingId);
      if (isSoftDeleted === true) {
        throw new GoneError("Recording's expired, try starting fresh");
      }
      throw new NotFoundError("Can't find that recording, try again");
    }

    // Verify recording belongs to token's link
    if (recording.recordingLinkId !== uploadPayload.lid) {
      throw new ForbiddenError('Upload got mixed up, try again');
    }

    // Verify all requested files are uploaded and mark as available
    await this.verifyUploadedFiles(recording, 'minimal');

    // Mark recording as available
    const updated = await this.deps.recordingRepo.markAsAvailable(recording.id);
    if (!updated) {
      throw new ValidationError("Couldn't finalize upload, try again");
    }

    return {
      success: true,
      recordingId: recording.id,
      status: 'available',
    };
  }

  /**
   * Get remaining time for upload token
   */
  getUploadTokenRemainingTime(uploadToken: string): number | null {
    const payload = this.verifyUploadToken(uploadToken);
    if (!payload) return null;

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - now);
  }

  /**
   * Build session preferences from link data
   */
  private buildSessionPreferences(linkData: LinkWithWorkspacePrefsRow): SessionPreferences {
    return {
      rcl: linkData.recordingCustomizeLink,
      rhs: linkData.recordingHideSensitive,
      rccl: linkData.recordingCaptureClientLog,
      rcsl: linkData.recordingCaptureServerLog,
      rcnl: linkData.recordingCaptureNetworkLog,
      rcn: linkData.recordingCompanyName,
      rclp: linkData.recordingCompanyLogoPath,
      rh: linkData.recordingHeader,
      rf: linkData.recordingFootnote,
      rpc: linkData.recordingPrimaryColor,
      rmd: linkData.recordingMaxDurationMs,
      rrb: linkData.createdByName || '',
    };
  }

  /**
   * Verify session token signature and expiry
   */
  private verifySessionToken(token: string): SessionTokenPayload | null {
    try {
      const payload = jwt.verify(token, this.sessionSecret) as SessionTokenPayload;
      // Verify issuer
      if (payload.iss !== this.jwtIssuer) {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Generate upload token for a recording
   */
  private generateUploadToken(recordingId: string, linkId: string, linkType: string): string {
    const payload: Omit<UploadTokenPayload, 'iat' | 'exp'> = {
      iss: this.jwtIssuer,
      rid: recordingId,
      lid: linkId,
      lt: linkType as UploadTokenPayload['lt'],
    };

    return jwt.sign(payload, this.uploadSecret, {
      expiresIn: SESSION_CONSTRAINTS.UPLOAD_TOKEN_EXPIRY,
    });
  }

  /**
   * Verify upload token signature and expiry
   */
  private verifyUploadToken(token: string): UploadTokenPayload | null {
    try {
      const payload = jwt.verify(token, this.uploadSecret) as UploadTokenPayload;
      // Verify issuer
      if (payload.iss !== this.jwtIssuer) {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Validate and filter upload files against preferences and constraints
   *
   * @param files - Array of files from the request
   * @param prefs - Workspace preferences from session token
   * @returns Object containing files to upload and list of excluded files with reasons
   */
  private validateAndFilterFiles(
    files: UploadFile[],
    prefs: SessionPreferences
  ): { filesToUpload: UploadFile[]; excludedFiles: ExcludedFileInfo[] } {
    const excludedFiles: ExcludedFileInfo[] = [];
    const filesToUpload: UploadFile[] = [];

    // Check for required files with size > 0
    const videoFile = files.find((f) => f.type === 'video');
    const thumbnailFile = files.find((f) => f.type === 'thumbnail');

    if (!videoFile) {
      throw new ValidationError("Video's missing, try recording again");
    }
    if (videoFile.size <= 0) {
      throw new ValidationError('Video file is empty, try recording again');
    }

    // Process each file
    for (const file of files) {
      // Skip validation for optional files with size <= 0 (they won't be uploaded)
      if (
        (file.type === 'console_log' || file.type === 'network_log' || file.type === 'thumbnail') &&
        file.size <= 0
      ) {
        excludedFiles.push({
          type: file.type,
          reason: 'File size is zero or negative',
        });
        continue;
      }

      // Check workspace permission for log files
      if (file.type === 'console_log' && file.size > 0 && !prefs.rccl) {
        excludedFiles.push({
          type: 'console_log',
          reason: 'Console log capture is not enabled for this workspace',
        });
        continue;
      }

      if (file.type === 'network_log' && file.size > 0 && !prefs.rcnl) {
        excludedFiles.push({
          type: 'network_log',
          reason: 'Network log capture is not enabled for this workspace',
        });
        continue;
      }

      // Validate MIME type
      if (!validateFileMimeType(file.type, file.mime_type)) {
        // MIME type errors are always thrown (not silently excluded)
        throw new ValidationError("Format's not supported, try recording again");
      }

      // Validate file size
      const maxSize = getMaxFileSize(file.type);
      if (file.size > maxSize) {
        // Size limit errors are always thrown (not silently excluded)
        throw new ValidationError("File's too big, try recording something shorter");
      }

      // File passed all checks, include it
      filesToUpload.push(file);
    }

    return { filesToUpload, excludedFiles };
  }

  /**
   * Generate presigned URLs for all files
   */
  private async generatePresignedUrls(
    recordingId: string,
    files: UploadFile[]
  ): Promise<FileUploadInfo[]> {
    const results: FileUploadInfo[] = [];

    for (const file of files) {
      const uploadInfo = await this.getPresignedUrlForFile(recordingId, file);
      results.push({
        type: file.type,
        path: uploadInfo.path,
        url: uploadInfo.url,
        size: file.size,
      });
    }

    return results;
  }

  /**
   * Get presigned URL for a specific file type
   */
  private async getPresignedUrlForFile(
    recordingId: string,
    file: UploadFile
  ): Promise<{ url: string; path: string }> {
    const expiresIn = SESSION_CONSTRAINTS.PRESIGNED_URL_EXPIRY;

    switch (file.type) {
      case 'video':
        return this.deps.videoStorage.getRecordingUploadUrl(recordingId, file.mime_type, {
          contentLength: file.size,
          expiresIn,
        });

      case 'thumbnail':
        return this.deps.thumbnailsStorage.getThumbnailUploadUrl(recordingId, file.mime_type, {
          contentLength: file.size,
          expiresIn,
        });

      case 'console_log':
        return this.deps.consoleLogsStorage.getUploadUrl(recordingId, {
          contentLength: file.size,
          expiresIn,
        });

      case 'network_log':
        return this.deps.networkLogsStorage.getUploadUrl(recordingId, {
          contentLength: file.size,
          expiresIn,
        });

      default:
        throw new ValidationError("Format's not supported, try recording again");
    }
  }

  /**
   * Extract file paths from upload info
   */
  private extractFilePaths(uploads: FileUploadInfo[]): {
    videoPath: string | null;
    thumbnailPath: string | null;
    consoleLogPath: string | null;
    networkLogPath: string | null;
  } {
    return {
      videoPath: uploads.find((f) => f.type === 'video')?.path ?? null,
      thumbnailPath: uploads.find((f) => f.type === 'thumbnail')?.path ?? null,
      consoleLogPath: uploads.find((f) => f.type === 'console_log')?.path ?? null,
      networkLogPath: uploads.find((f) => f.type === 'network_log')?.path ?? null,
    };
  }

  /**
   * Verify uploaded files exist in storage
   *
   * @param recording - Recording with file paths
   * @param mode - Verification mode:
   *   - 'complete': All requested files must exist (video, thumbnail, and any optional logs)
   *   - 'minimal': Only video file must exist
   *   - 'none': Skip verification
   */
  private async verifyUploadedFiles(
    recording: {
      recordingVideoRef: string | null;
      recordingThumbnailRef: string | null;
      recordingConsoleLogRef: string | null;
      recordingNetworkLogsRef: string | null;
    },
    mode: 'complete' | 'minimal' | 'none'
  ): Promise<void> {
    if (mode === 'none') {
      return;
    }

    const errors: string[] = [];

    // Video is always required
    if (recording.recordingVideoRef) {
      const videoExists = await this.deps.videoStorage.head(recording.recordingVideoRef);
      if (!videoExists) {
        errors.push('Video file not found in storage');
      }
    } else {
      errors.push('Video file path not found');
    }

    // For complete mode, verify all requested files
    if (mode === 'complete') {
      // Thumbnail is required in complete mode
      if (recording.recordingThumbnailRef) {
        const thumbnailExists = await this.deps.thumbnailsStorage.head(
          recording.recordingThumbnailRef
        );
        if (!thumbnailExists) {
          errors.push('Thumbnail file not found in storage');
        }
      } else {
        errors.push('Thumbnail file path not found');
      }

      // Console log - if requested, must exist
      if (recording.recordingConsoleLogRef) {
        const consoleLogExists = await this.deps.consoleLogsStorage.head(
          recording.recordingConsoleLogRef
        );
        if (!consoleLogExists) {
          errors.push('Console log file not found in storage');
        }
      }

      // Network log - if requested, must exist
      if (recording.recordingNetworkLogsRef) {
        const networkLogExists = await this.deps.networkLogsStorage.head(
          recording.recordingNetworkLogsRef
        );
        if (!networkLogExists) {
          errors.push('Network log file not found in storage');
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationError("Couldn't verify files, try uploading again");
    }
  }
}
