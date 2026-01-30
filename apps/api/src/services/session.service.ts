/**
 * SessionService - Business logic for recording session and upload operations
 * Handles token generation, validation, and upload workflow
 *
 * Caching Architecture:
 * Uses normalized caching with three separate cache types:
 * - workspace:recording-prefs:{workspaceId} - Workspace branding/limits
 * - domain:recording-prefs:{domainId} - Domain capture settings
 * - link:core:{workspaceId}:{linkId} - Link-specific data
 *
 * This allows O(1) invalidation when workspace/domain preferences change,
 * instead of invalidating all link caches (O(N)).
 */

import { tasks } from '@trigger.dev/sdk/v3';
import type {
  CacheService,
  DomainRecordingPrefs,
  LinkCore,
  WorkspaceRecordingPrefs,
} from '@workspace/cache';
import { domainRecordingKeys, linkKeys, workspaceRecordingKeys } from '@workspace/cache';
import { sessionError } from '@workspace/contract';
import type {
  ClientActionsStorageClient,
  ConsoleLogsStorageClient,
  NetworkLogsStorageClient,
  ThumbnailsStorageClient,
  VideoStorageClient,
} from '@workspace/storage';
import jwt from 'jsonwebtoken';

import { env } from '@/api/env';
import { generateRecordingId, generateSessionId } from '@/api/lib/id';
import { DomainRepository } from '@/api/repositories/domains.repository';
import {
  LinkRepository,
  type LinkWithWorkspacePrefsRow,
} from '@/api/repositories/links.repository';
import { ProjectRepository } from '@/api/repositories/projects.repository';
import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import {
  getMaxFileSize,
  type RecordingMetaInput,
  SESSION_CONSTRAINTS,
  type UploadFile,
  validateFileMimeType,
} from '@/api/schema/session.schema';
import type { EntitlementService } from '@/api/services/entitlement.service';
import type { LinkService } from '@/api/services/link.service';
import { TASK_IDS } from '@/api/trigger/constants';
import { buildStaleRecordingCheckKey } from '@/api/trigger/idempotency';
import type {
  PresignedUrlInfo,
  SessionPreferences,
  SessionTokenPayload,
  UploadFileType,
  UploadTokenPayload,
} from '@/api/types';

import { getPurgeDelay } from '../trigger/delay-calculator';

export interface SessionServiceDeps {
  linkRepo: LinkRepository;
  recordingRepo: RecordingRepository;
  projectRepo: ProjectRepository;
  workspaceRepo: WorkspaceRepository;
  domainRepo: DomainRepository;
  videoStorage: VideoStorageClient;
  thumbnailsStorage: ThumbnailsStorageClient;
  consoleLogsStorage: ConsoleLogsStorageClient;
  networkLogsStorage: NetworkLogsStorageClient;
  clientActionsStorage: ClientActionsStorageClient;
  linkService: LinkService;
  entitlementService: EntitlementService;
  cacheService: CacheService;
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
   * Fetch link with workspace preferences using TRUE cache-first pattern
   *
   * Flow:
   * 1. Try to get workspaceId from link:ws:{linkId} mapping cache
   * 2. If found, try to assemble from normalized caches
   * 3. On any cache miss, fetch from DB and populate all caches
   *
   * This ensures we only hit the database on true cache misses,
   * not on every request like the previous broken implementation.
   */
  private async getLinkWithPreferences(linkId: string): Promise<LinkWithWorkspacePrefsRow | null> {
    // Step 1: Try to get workspaceId from mapping cache
    const cachedWorkspaceId = await this.deps.cacheService.getLinkWorkspaceMapping(linkId);

    if (cachedWorkspaceId) {
      // Step 2: Try to assemble from normalized caches
      const assembled = await this.tryAssembleFromCaches(linkId, cachedWorkspaceId);
      if (assembled) {
        return assembled;
      }
    }

    // Step 3: Cache miss - fetch from database
    const linkData = await this.deps.linkRepo.findByIdWithWorkspacePrefs(linkId);

    if (!linkData) {
      return null;
    }

    // Step 4: Cache all components for future requests
    await this.cacheAllComponents(linkData);

    return linkData;
  }

  /**
   * Try to assemble link data from normalized caches
   * Uses mget for efficient batch fetching (2 round trips instead of 3)
   * Returns null if any cache component is missing
   */
  private async tryAssembleFromCaches(
    linkId: string,
    workspaceId: string
  ): Promise<LinkWithWorkspacePrefsRow | null> {
    // Step 1: Batch fetch linkCore + workspacePrefs (we have workspaceId)
    const linkCoreKey = linkKeys.core(workspaceId, linkId);
    const workspacePrefsKey = workspaceRecordingKeys.preferences(workspaceId);

    const [linkCore, workspacePrefs] = (await this.deps.cacheService.mget<
      LinkCore | WorkspaceRecordingPrefs
    >([linkCoreKey, workspacePrefsKey])) as [LinkCore | null, WorkspaceRecordingPrefs | null];

    // If linkCore or workspacePrefs missing, cache miss
    if (!linkCore || !workspacePrefs) return null;

    // Step 2: Now fetch domainPrefs (we have domainId from linkCore)
    const domainPrefs = await this.deps.cacheService.getDomainRecordingPrefs(linkCore.domainId);
    if (!domainPrefs) return null;

    // Assemble the full object from cached components
    return {
      linkId: linkCore.linkId,
      linkType: linkCore.linkType as LinkWithWorkspacePrefsRow['linkType'],
      linkReusable: linkCore.linkReusable,
      workspaceId: linkCore.workspaceId,
      projectId: linkCore.projectId,
      domainId: linkCore.domainId,
      createdBy: linkCore.createdBy,
      createdByName: linkCore.createdByName,
      recordingCustomizeLink: workspacePrefs.recordingCustomizeLink,
      recordingHideSensitive: domainPrefs.recordingHideSensitive,
      recordingCaptureClientLog: domainPrefs.recordingCaptureClientLog,
      recordingCaptureClientAction: domainPrefs.recordingCaptureClientAction,
      recordingCaptureServerLog: domainPrefs.recordingCaptureServerLog,
      recordingCaptureNetworkLog: domainPrefs.recordingCaptureNetworkLog,
      recordingCompanyName: workspacePrefs.recordingCompanyName,
      recordingCompanyLogoPath: workspacePrefs.recordingCompanyLogoPath,
      recordingHeader: workspacePrefs.recordingHeader,
      recordingFootnote: workspacePrefs.recordingFootnote,
      recordingPrimaryColor: workspacePrefs.recordingPrimaryColor,
      recordingMaxDurationMs: workspacePrefs.recordingMaxDurationMs,
    };
  }

  /**
   * Cache all components for a link
   * Called on cache miss to populate all cache types including workspace mapping
   */
  private async cacheAllComponents(linkData: LinkWithWorkspacePrefsRow): Promise<void> {
    // Build the normalized cache objects
    const linkCore: LinkCore = {
      linkId: linkData.linkId,
      linkType: linkData.linkType,
      linkReusable: linkData.linkReusable,
      workspaceId: linkData.workspaceId,
      projectId: linkData.projectId,
      domainId: linkData.domainId,
      createdBy: linkData.createdBy,
      createdByName: linkData.createdByName,
    };

    const workspacePrefs: WorkspaceRecordingPrefs = {
      recordingCustomizeLink: linkData.recordingCustomizeLink,
      recordingCompanyName: linkData.recordingCompanyName,
      recordingCompanyLogoPath: linkData.recordingCompanyLogoPath,
      recordingHeader: linkData.recordingHeader,
      recordingFootnote: linkData.recordingFootnote,
      recordingPrimaryColor: linkData.recordingPrimaryColor,
      recordingMaxDurationMs: linkData.recordingMaxDurationMs,
    };

    const domainPrefs: DomainRecordingPrefs = {
      workspaceId: linkData.workspaceId,
      domainStatus: 'verified', // If we have the data, domain must be verified
      recordingHideSensitive: linkData.recordingHideSensitive,
      recordingCaptureClientLog: linkData.recordingCaptureClientLog,
      recordingCaptureClientAction: linkData.recordingCaptureClientAction,
      recordingCaptureServerLog: linkData.recordingCaptureServerLog,
      recordingCaptureNetworkLog: linkData.recordingCaptureNetworkLog,
    };

    // Cache all components in parallel (including workspace mapping)
    await Promise.all([
      this.deps.cacheService.setLinkWorkspaceMapping(linkData.linkId, linkData.workspaceId),
      this.deps.cacheService.setLinkCore(linkData.workspaceId, linkData.linkId, linkCore),
      this.deps.cacheService.setWorkspaceRecordingPrefs(linkData.workspaceId, workspacePrefs),
      this.deps.cacheService.setDomainRecordingPrefs(linkData.domainId, domainPrefs),
    ]);
  }

  /**
   * Initialize a recording session for a link
   * GET /api/v1/session
   * Validates the link token and extracts the link ID before proceeding
   */
  async initSession(linkToken: string): Promise<SessionInitResult> {
    // Verify link token and extract link ID
    const linkId = this.deps.linkService.verifyLinkToken(linkToken);

    // Fetch link with workspace preferences (cached)
    const linkData = await this.getLinkWithPreferences(linkId);

    if (!linkData) {
      // Check if link was deleted
      const isSoftDeleted = await this.deps.linkRepo.isSoftDeleted(linkId);
      if (isSoftDeleted === true) {
        throw sessionError.SESSION_LINK_GONE();
      }
      throw sessionError.SESSION_LINK_NOT_FOUND();
    }

    // Guard rails: Check if related resources are deleted
    // Note: The query findByIdWithWorkspacePrefs already filters for non-deleted workspace and domain
    // via the JOIN conditions with eq(workspaces.isDeleted, false) and eq(domains.isDeleted, false)
    // So if we reach here, workspace and domain are valid

    // Validate link type - only recording links allowed
    if (linkData.linkType !== 'recording') {
      throw sessionError.SESSION_LINK_INVALID_TYPE();
    }

    // Check reusability - if not reusable, ensure no terminal state recordings
    // Non-terminal state (pending) is allowed to retry
    if (!linkData.linkReusable) {
      const terminalCount = await this.deps.linkRepo.countTerminalRecordingsForLink(linkId);
      if (terminalCount > 0) {
        throw sessionError.SESSION_LINK_ALREADY_USED();
      }
    }

    // Check recording entitlement before initializing session
    const canRecord = await this.deps.entitlementService.canConsumeRecordings(linkData.workspaceId);
    if (!canRecord.allowed) {
      throw sessionError.SESSION_RECORDING_LIMIT_EXCEEDED({
        current: canRecord.current,
        limit: canRecord.limit,
        reason: canRecord.reason,
      });
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
      throw sessionError.SESSION_TOKEN_EXPIRED();
    }

    // Re-validate link state (may have been deleted since session init, cached)
    const linkData = await this.getLinkWithPreferences(sessionPayload.lid);
    if (!linkData) {
      const isSoftDeleted = await this.deps.linkRepo.isSoftDeleted(sessionPayload.lid);
      if (isSoftDeleted === true) {
        throw sessionError.SESSION_LINK_GONE();
      }
      throw sessionError.SESSION_LINK_NOT_FOUND();
    }

    // Validate link type again
    if (linkData.linkType !== 'recording') {
      throw sessionError.SESSION_LINK_INVALID_TYPE();
    }

    // Check reusability again - only block if terminal state recordings exist
    // Allows users to retry if previous upload was in non-terminal state (pending)
    if (!linkData.linkReusable) {
      const terminalCount = await this.deps.linkRepo.countTerminalRecordingsForLink(
        sessionPayload.lid
      );
      if (terminalCount > 0) {
        throw sessionError.SESSION_LINK_ALREADY_USED();
      }
    }

    // Validate recording duration
    if (recordingDurationMs < SESSION_CONSTRAINTS.MIN_DURATION_MS) {
      throw sessionError.SESSION_DURATION_TOO_SHORT();
    }

    // Validate against workspace-specific limit (if set)
    if (sessionPayload.prefs.rmd !== null && recordingDurationMs > sessionPayload.prefs.rmd) {
      throw sessionError.SESSION_DURATION_TOO_LONG();
    }

    // Validate against absolute maximum
    if (recordingDurationMs > SESSION_CONSTRAINTS.DEFAULT_MAX_DURATION_MS) {
      throw sessionError.SESSION_DURATION_TOO_LONG();
    }

    // Check recording entitlement before creating
    const canRecord = await this.deps.entitlementService.canConsumeRecordings(sessionPayload.wid);
    if (!canRecord.allowed) {
      throw sessionError.SESSION_RECORDING_LIMIT_EXCEEDED({
        current: canRecord.current,
        limit: canRecord.limit,
        reason: canRecord.reason,
      });
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

    console.log('custom metadata :', metadata.customMetadata ?? 'None');

    // Create recording record in database
    try {
      await this.deps.recordingRepo.create({
        recordingId: recordingId,
        recordingLinkId: sessionPayload.lid,
        workspaceId: sessionPayload.wid,
        projectId: linkData.projectId,
        createdBy: linkData.createdBy,
        recordingDurationMs,
        recordingVideoRef: filePaths.videoPath,
        recordingThumbnailRef: filePaths.thumbnailPath,
        recordingConsoleLogRef: filePaths.consoleLogPath,
        recordingNetworkLogsRef: filePaths.networkLogPath,
        recordingActionRef: filePaths.actionPath,
        systemMeta: metadata.systemMetadata,
        customMeta: {
          ...metadata.customMetadata,
        },
      });
    } catch {
      throw sessionError.SESSION_DATABASE_ERROR();
    }

    // Schedule stale recording check
    // Delays execution by presignedUrlExpiry to check if recording is still pending
    // If so, marks it deleted and triggers cleanup
    // Note: Trigger.dev failures are non-blocking - recording can still proceed
    try {
      await tasks.trigger(
        TASK_IDS.CHECK_STALE_RECORDING,
        { recordingId },
        {
          idempotencyKey: buildStaleRecordingCheckKey(recordingId),
          delay: getPurgeDelay('pending'),
        }
      );
    } catch (error) {
      // Log but don't fail the request - stale check is a background task
      // The recording will still be created and can be uploaded
      console.error('Error scheduling stale recording check:', error);
    }

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
      throw sessionError.SESSION_UPLOAD_TOKEN_EXPIRED();
    }

    // Validate recording ID matches token
    if (uploadPayload.rid !== recordingId) {
      throw sessionError.SESSION_UPLOAD_TOKEN_MISMATCH();
    }

    // Check if link still exists
    const linkExists = await this.deps.linkRepo.findById(uploadPayload.lid);
    if (!linkExists) {
      const isSoftDeleted = await this.deps.linkRepo.isSoftDeleted(uploadPayload.lid);
      if (isSoftDeleted === true) {
        throw sessionError.SESSION_LINK_GONE();
      }
      throw sessionError.SESSION_LINK_NOT_FOUND();
    }

    // Get pending recording by ID with file paths
    const recording =
      await this.deps.recordingRepo.findPendingRecordingByIdWithFilePaths(recordingId);
    if (!recording) {
      // Check if soft deleted
      const isSoftDeleted = await this.deps.recordingRepo.isSoftDeleted(recordingId);
      if (isSoftDeleted === true) {
        throw sessionError.SESSION_RECORDING_GONE();
      }
      throw sessionError.SESSION_RECORDING_NOT_FOUND();
    }

    // Verify recording belongs to token's link
    if (recording.recordingLinkId !== uploadPayload.lid) {
      throw sessionError.SESSION_UPLOAD_TOKEN_MISMATCH();
    }

    // Verify all requested files are uploaded and mark as available
    await this.verifyUploadedFiles(recording, 'minimal');

    // Mark recording as available
    const updated = await this.deps.recordingRepo.markAsAvailable(recording.recordingId);
    if (!updated) {
      throw sessionError.SESSION_UPLOAD_FAILED();
    }

    // Track recording consumption after successful upload
    // Note: We consume when recording becomes available, not when pending
    try {
      await this.deps.entitlementService.consumeRecordings(recording.workspaceId);
    } catch (error) {
      // Log but don't fail - recording is already created
      // Consumption tracking failure shouldn't block the upload
      console.error('Failed to track recording consumption:', error);
    }

    return {
      success: true,
      recordingId: recording.recordingId,
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
      rcca: linkData.recordingCaptureClientAction,
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

    if (!videoFile) {
      throw sessionError.SESSION_VIDEO_MISSING();
    }
    if (videoFile.size <= 0) {
      throw sessionError.SESSION_VIDEO_EMPTY();
    }

    // Process each file
    for (const file of files) {
      // Skip validation for optional files with size <= 0 (they won't be uploaded)
      if (
        (file.type === 'console_log' ||
          file.type === 'network_log' ||
          file.type === 'action' ||
          file.type === 'thumbnail') &&
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

      if (file.type === 'action' && file.size > 0 && !prefs.rcca) {
        excludedFiles.push({
          type: 'action',
          reason: 'Client action capture is not enabled for this workspace',
        });
        continue;
      }

      // Validate MIME type
      if (!validateFileMimeType(file.type, file.mime_type)) {
        // MIME type errors are always thrown (not silently excluded)
        throw sessionError.SESSION_FILE_FORMAT_UNSUPPORTED();
      }

      // Validate file size
      const maxSize = getMaxFileSize(file.type);
      if (file.size > maxSize) {
        // Size limit errors are always thrown (not silently excluded)
        throw sessionError.SESSION_FILE_TOO_LARGE();
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
   * Wraps storage operations to convert infrastructure errors to ORPC errors
   */
  private async getPresignedUrlForFile(
    recordingId: string,
    file: UploadFile
  ): Promise<{ url: string; path: string }> {
    const expiresIn = SESSION_CONSTRAINTS.PRESIGNED_URL_EXPIRY;

    try {
      switch (file.type) {
        case 'video':
          return await this.deps.videoStorage.getRecordingUploadUrl(recordingId, file.mime_type, {
            contentLength: file.size,
            expiresIn,
          });

        case 'thumbnail':
          return await this.deps.thumbnailsStorage.getThumbnailUploadUrl(
            recordingId,
            file.mime_type,
            {
              contentLength: file.size,
              expiresIn,
            }
          );

        case 'console_log':
          return await this.deps.consoleLogsStorage.getUploadUrl(recordingId, {
            contentLength: file.size,
            expiresIn,
          });

        case 'network_log':
          return await this.deps.networkLogsStorage.getUploadUrl(recordingId, {
            contentLength: file.size,
            expiresIn,
          });

        case 'action':
          return await this.deps.clientActionsStorage.getUploadUrl(recordingId, {
            contentLength: file.size,
            expiresIn,
          });

        default:
          throw sessionError.SESSION_FILE_FORMAT_UNSUPPORTED();
      }
    } catch {
      // Convert storage/S3 errors to typed error
      throw sessionError.SESSION_STORAGE_ERROR();
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
    actionPath: string | null;
  } {
    return {
      videoPath: uploads.find((f) => f.type === 'video')?.path ?? null,
      thumbnailPath: uploads.find((f) => f.type === 'thumbnail')?.path ?? null,
      consoleLogPath: uploads.find((f) => f.type === 'console_log')?.path ?? null,
      networkLogPath: uploads.find((f) => f.type === 'network_log')?.path ?? null,
      actionPath: uploads.find((f) => f.type === 'action')?.path ?? null,
    };
  }

  /**
   * Verify uploaded files exist in storage
   * Wraps storage operations to convert infrastructure errors to ORPC errors
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
      recordingActionRef: string | null;
    },
    mode: 'complete' | 'minimal' | 'none'
  ): Promise<void> {
    if (mode === 'none') {
      return;
    }

    try {
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

        // Client action - if requested, must exist
        if (recording.recordingActionRef) {
          const actionExists = await this.deps.clientActionsStorage.head(
            recording.recordingActionRef
          );
          if (!actionExists) {
            errors.push('Client action file not found in storage');
          }
        }
      }

      if (errors.length > 0) {
        throw sessionError.SESSION_FILE_VERIFICATION_FAILED();
      }
    } catch {
      // Convert storage/S3 errors to typed error
      throw sessionError.SESSION_STORAGE_ERROR();
    }
  }
}
