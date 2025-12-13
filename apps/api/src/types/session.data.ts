/**
 * Session and upload types for recording workflow
 * Contains token payloads and API response types
 */

import type { LinkType } from './link.service';

/**
 * Recording preferences embedded in session token
 * Abbreviated field names to minimize token size
 */
export interface SessionPreferences {
  rcl: boolean; // recording_customize_link
  rhs: boolean; // recording_hide_sensitive
  rccl: boolean; // recording_capture_client_log
  rcsl: boolean; // recording_capture_server_log
  rcn: string | null; // recording_company_name
  rclp: string | null; // recording_company_logo_path
  rh: string | null; // recording_header
  rf: string | null; // recording_footnote
  rpc: string | null; // recording_primary_color
  rmd: number | null; // recording_max_duration (seconds)
}

/**
 * Session token payload
 * Issued on GET /api/v1/session
 * Lifetime: 180 minutes
 */
export interface SessionTokenPayload {
  iss: string; // Issuer (JWT standard) - always 'userplane'
  lid: string; // Link ID
  lt: LinkType; // Link Type
  wid: string; // Workspace ID
  sid: string; // Session ID (for tracking)
  prefs: SessionPreferences;
  iat: number; // Issued At (JWT standard)
  exp: number; // Expiry (JWT standard)
}

/**
 * Upload token payload
 * Issued on POST /api/v1/session
 * Lifetime: 120 minutes
 */
export interface UploadTokenPayload {
  iss: string; // Issuer (JWT standard) - always 'userplane'
  rid: string; // Recording ID
  lid: string; // Link ID
  lt: LinkType; // Link Type
  iat: number; // Issued At
  exp: number; // Expiry
}

/**
 * File types that can be uploaded
 */
export type UploadFileType = 'video' | 'thumbnail' | 'console_log' | 'network_log';

/**
 * File metadata in upload request
 */
export interface UploadFileInfo {
  type: UploadFileType;
  name: string;
  size: number;
  mimeType: string;
}

/**
 * Presigned URL response for a file
 */
export interface PresignedUrlInfo {
  type: UploadFileType;
  url: string;
  expiresIn: number;
}

/**
 * Recording file paths stored in database
 */
export interface RecordingFilePaths {
  videoPath: string | null;
  thumbnailPath: string | null;
  consoleLogPath: string | null;
  networkLogPath: string | null;
}

/**
 * Recording file sizes stored in database
 */
export interface RecordingFileSizes {
  videoSize: number | null;
  thumbnailSize: number | null;
  consoleLogSize: number | null;
  networkLogSize: number | null;
}

/**
 * GET /api/v1/session response
 */
export interface SessionInitData {
  sessionToken: string;
  expiresIn: number;
}

/**
 * POST /api/v1/session response
 */
export interface UploadInitData {
  recordingId: string;
  uploadToken: string;
  presignedUrls: PresignedUrlInfo[];
}

/**
 * File upload status for partial uploads
 */
export interface FileUploadStatus {
  video: boolean;
  thumbnail: boolean;
  consoleLog?: boolean;
  networkLog?: boolean;
}

/**
 * PATCH /api/v1/session response
 */
export interface UploadCompleteData {
  success: boolean;
  recordingId: string;
  status: 'available' | 'partial' | 'failed';
  uploadedFiles?: FileUploadStatus;
  missingFiles?: string[];
}

/**
 * Upload completion state
 */
export type UploadState = 'complete' | 'partial' | 'failed';

/**
 * Link with workspace preferences for session initialization
 */
export interface LinkWithWorkspacePrefs {
  linkId: string;
  linkType: LinkType;
  workspaceId: string;
  projectId: string;
  domainId: string;
  createdBy: string;
  preferences: {
    recordingCustomizeLink: boolean;
    recordingHideSensitive: boolean;
    recordingCaptureClientLog: boolean;
    recordingCaptureServerLog: boolean;
    recordingCompanyName: string | null;
    recordingCompanyLogoPath: string | null;
    recordingHeader: string | null;
    recordingFootnote: string | null;
    recordingPrimaryColor: string | null;
    recordingMaxDuration: number | null;
  };
}
