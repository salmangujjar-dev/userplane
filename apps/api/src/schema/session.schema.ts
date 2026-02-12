/**
 * Session schema - Zod schemas for session/upload API validation
 */

import { RecordingNotesSchema, SESSION_CONSTANTS } from '@workspace/contract';
import { z } from 'zod';

import { env } from '@/api/env';

/**
 * File type enum for uploads
 */
export const fileTypeSchema = z.enum([
  'video',
  'thumbnail',
  'console_log',
  'network_log',
  'action',
]);

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
 * System metadata - arbitrary key-value pairs captured by client during recording
 */
export const systemMetadataSchema = z.record(z.string(), z.unknown());

/**
 * Custom metadata - arbitrary key-value pairs from client
 */
export const customMetadataSchema = z.record(z.string(), z.unknown()).optional();

/**
 * Recording metadata from client
 */
export const recordingMetaInputSchema = z.object({
  systemMetadata: systemMetadataSchema,
  customMetadata: customMetadataSchema,
  notes: RecordingNotesSchema.optional(),
});

/**
 * POST /api/v1/session request body
 */
export const initUploadSchema = z.object({
  recording_duration: z
    .number()
    .int()
    .min(
      SESSION_CONSTANTS.MIN_DURATION_MS,
      `Recording duration must be at least ${SESSION_CONSTANTS.MIN_DURATION_MS}ms`
    )
    .max(
      SESSION_CONSTANTS.DEFAULT_MAX_DURATION_MS,
      `Recording duration cannot exceed ${SESSION_CONSTANTS.DEFAULT_MAX_DURATION_MS}ms`
    ),
  files: z
    .array(uploadFileSchema)
    .min(1, 'At least one file is required')
    .max(5, 'Maximum 5 files allowed'),
  metadata: recordingMetaInputSchema,
});

/**
 * PATCH /api/v1/session request body
 */
export const completeUploadSchema = z.object({
  recording_id: z.string().min(1, 'Recording ID is required'),
});

/**
 * Inferred types from schemas
 */
export type GetSessionQuery = z.infer<typeof getSessionQuerySchema>;
export type UploadFile = z.infer<typeof uploadFileSchema>;
export type InitUploadBody = z.infer<typeof initUploadSchema>;
export type CompleteUploadBody = z.infer<typeof completeUploadSchema>;
export type SystemMetadata = z.infer<typeof systemMetadataSchema>;
export type RecordingMetaInput = z.infer<typeof recordingMetaInputSchema>;

/**
 * Terminal states - once in these states, no further transitions allowed
 */
export const TERMINAL_UPLOAD_STATES = ['available', 'expired', 'purged'] as const;

/**
 * Terminal upload state type derived from constant
 */
export type TerminalUploadState = (typeof TERMINAL_UPLOAD_STATES)[number];

/**
 * Non-terminal states that allow transitions
 */
export const ACTIVE_UPLOAD_STATES = ['pending'] as const;

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
 * Combines shared constants from contract with environment-specific token expiry times
 */
export const SESSION_CONSTRAINTS = {
  // Token expiry times in seconds from environment
  SESSION_TOKEN_EXPIRY: env.session.tokenExpiry,
  UPLOAD_TOKEN_EXPIRY: env.session.uploadTokenExpiry,
  PRESIGNED_URL_EXPIRY: env.session.presignedUrlExpiry,

  // Shared constants from contract package
  ...SESSION_CONSTANTS,
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
        SESSION_CONSTRAINTS.VIDEO_MIME_TYPES.includes(
          mimeType as (typeof SESSION_CONSTRAINTS.VIDEO_MIME_TYPES)[number]
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
    case 'action':
      return SESSION_CONSTRAINTS.ALLOWED_ACTION_TYPES.includes(
        mimeType as (typeof SESSION_CONSTRAINTS.ALLOWED_ACTION_TYPES)[number]
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
    case 'action':
      return SESSION_CONSTRAINTS.MAX_LOG_SIZE;
    default:
      return SESSION_CONSTRAINTS.MAX_FILE_SIZE;
  }
}
