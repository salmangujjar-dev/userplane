/**
 * Session schema - Zod schemas for session/upload API validation
 */

import { z } from 'zod';
import { env } from '@/api/env';

/**
 * File type enum for uploads
 */
export const fileTypeSchema = z.enum(['video', 'thumbnail', 'console_log', 'network_log']);

/**
 * GET /api/v1/session query params
 */
export const getSessionQuerySchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

/**
 * File info in POST request
 * For optional files (console_log, network_log), size can be 0 to skip upload
 */
export const uploadFileSchema = z.object({
  type: fileTypeSchema,
  name: z.string().min(1, 'File name is required'),
  size: z.number().int().nonnegative('File size must be non-negative'),
  mime_type: z.string().min(1, 'MIME type is required'),
});

/**
 * System metadata captured by client during recording
 */
export const systemMetadataSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  browser: z.string().min(1, 'Browser info is required'),
  os: z.string().min(1, 'OS info is required'),
  windowSize: z.object({
    width: z.number().int().nonnegative(),
    height: z.number().int().nonnegative(),
  }),
});

/**
 * Custom metadata - arbitrary key-value pairs from client
 */
export const customMetadataSchema = z.record(z.string(), z.unknown()).optional();

/**
 * Recording metadata from client
 */
export const recordingMetaSchema = z.object({
  systemMetadata: systemMetadataSchema,
  customMetadata: customMetadataSchema,
});

/**
 * POST /api/v1/session request body
 */
export const initUploadSchema = z.object({
  recording_duration: z
    .number()
    .int()
    .positive('Recording duration must be positive')
    .max(180000, 'Recording duration must be less than 3 minutes'),
  files: z
    .array(uploadFileSchema)
    .min(1, 'At least one file is required')
    .max(4, 'Maximum 4 files allowed'),
  metadata: recordingMetaSchema,
});

/**
 * Upload state enum
 * - complete: All files uploaded successfully
 * - partial: Video uploaded, some secondary files missing
 * - failed: Upload failed entirely
 */
export const uploadStateSchema = z.enum(['complete', 'partial', 'failed']);

/**
 * PATCH /api/v1/session request body
 */
export const completeUploadSchema = z.object({
  recording_id: z.string().min(1, 'Recording ID is required'),
  state: uploadStateSchema,
});

/**
 * Inferred types from schemas
 */
export type GetSessionQuery = z.infer<typeof getSessionQuerySchema>;
export type UploadFile = z.infer<typeof uploadFileSchema>;
export type InitUploadBody = z.infer<typeof initUploadSchema>;
export type CompleteUploadBody = z.infer<typeof completeUploadSchema>;
export type SystemMetadata = z.infer<typeof systemMetadataSchema>;
export type RecordingMetaInput = z.infer<typeof recordingMetaSchema>;

/**
 * Terminal states - once in these states, no further transitions allowed
 */
export const TERMINAL_UPLOAD_STATES = ['available', 'failed', 'expired', 'purged'] as const;

/**
 * Terminal upload state type derived from constant
 */
export type TerminalUploadState = (typeof TERMINAL_UPLOAD_STATES)[number];

/**
 * Non-terminal states that allow transitions
 */
export const ACTIVE_UPLOAD_STATES = ['pending', 'partial'] as const;

/**
 * Active upload state type derived from constant
 */
export type ActiveUploadState = (typeof ACTIVE_UPLOAD_STATES)[number];

/**
 * Check if upload status is terminal
 */
export function isTerminalState(status: string): boolean {
  return TERMINAL_UPLOAD_STATES.includes(status as TerminalUploadState);
}

/**
 * Validation constraints
 * Expiry times are loaded from environment variables with fallbacks
 */
export const SESSION_CONSTRAINTS = {
  // Token expiry times in seconds from environment
  SESSION_TOKEN_EXPIRY: env.session.tokenExpiry,
  UPLOAD_TOKEN_EXPIRY: env.session.uploadTokenExpiry,
  PRESIGNED_URL_EXPIRY: env.session.presignedUrlExpiry,

  // File size limits in bytes
  MAX_FILE_SIZE: 500 * 1024 * 1024, // 500MB
  MAX_VIDEO_SIZE: 500 * 1024 * 1024, // 500MB
  MAX_THUMBNAIL_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_LOG_SIZE: 50 * 1024 * 1024, // 50MB

  // Allowed MIME types per file type
  // Video: Support base container formats and common codec specifications
  ALLOWED_VIDEO_TYPES: [
    'video/webm',
    'video/webm;codecs=vp8',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8.0',
    'video/webm;codecs=vp9.0',
    'video/webm;codecs=h264',
    'video/webm;codecs=avc1',
    'video/webm;codecs=av1',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=h264,opus',
    'video/webm;codecs=avc1,opus',
    'video/mp4',
    'video/mp4;codecs=avc1',
    'video/mp4;codecs=h264',
    'video/x-matroska',
    'video/x-matroska;codecs=avc1',
    'video/ogg',
  ] as const,

  ALLOWED_THUMBNAIL_TYPES: ['image/png', 'image/jpeg', 'image/webp'] as const,
  ALLOWED_CONSOLE_LOG_TYPES: ['application/x-ndjson', 'application/ndjson'] as const,
  ALLOWED_NETWORK_LOG_TYPES: ['application/json'] as const,

  // Base container formats for flexible validation
  ALLOWED_VIDEO_CONTAINERS: ['video/webm', 'video/mp4', 'video/x-matroska', 'video/ogg'] as const,
} as const;

/**
 * Validate file type against allowed MIME types
 * For video, accepts both exact matches and any codec variant of allowed containers
 */
export function validateFileMimeType(
  fileType: z.infer<typeof fileTypeSchema>,
  mimeType: string
): boolean {
  switch (fileType) {
    case 'video': {
      // Check exact match first
      if (
        SESSION_CONSTRAINTS.ALLOWED_VIDEO_TYPES.includes(
          mimeType as (typeof SESSION_CONSTRAINTS.ALLOWED_VIDEO_TYPES)[number]
        )
      ) {
        return true;
      }

      // Check if base container format is allowed (for codec variants)
      const baseFormat = mimeType.split(';')[0]?.trim();
      return SESSION_CONSTRAINTS.ALLOWED_VIDEO_CONTAINERS.includes(
        baseFormat as (typeof SESSION_CONSTRAINTS.ALLOWED_VIDEO_CONTAINERS)[number]
      );
    }
    case 'thumbnail':
      return SESSION_CONSTRAINTS.ALLOWED_THUMBNAIL_TYPES.includes(
        mimeType as (typeof SESSION_CONSTRAINTS.ALLOWED_THUMBNAIL_TYPES)[number]
      );
    case 'console_log':
      return SESSION_CONSTRAINTS.ALLOWED_CONSOLE_LOG_TYPES.includes(
        mimeType as (typeof SESSION_CONSTRAINTS.ALLOWED_CONSOLE_LOG_TYPES)[number]
      );
    case 'network_log':
      return SESSION_CONSTRAINTS.ALLOWED_NETWORK_LOG_TYPES.includes(
        mimeType as (typeof SESSION_CONSTRAINTS.ALLOWED_NETWORK_LOG_TYPES)[number]
      );
    default:
      return false;
  }
}

/**
 * Get max file size for a given file type
 */
export function getMaxFileSize(fileType: z.infer<typeof fileTypeSchema>): number {
  switch (fileType) {
    case 'video':
      return SESSION_CONSTRAINTS.MAX_VIDEO_SIZE;
    case 'thumbnail':
      return SESSION_CONSTRAINTS.MAX_THUMBNAIL_SIZE;
    case 'console_log':
    case 'network_log':
      return SESSION_CONSTRAINTS.MAX_LOG_SIZE;
    default:
      return SESSION_CONSTRAINTS.MAX_FILE_SIZE;
  }
}
