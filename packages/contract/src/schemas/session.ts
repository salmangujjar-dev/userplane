import { z } from 'zod';
import { FileTypeSchema, UploadStatusSchema, TokenSchema, RecordingIdSchema } from './common';
import { RECORDING_DURATION_LIMITS } from '../constants/session';

/**
 * Session schemas
 */

/**
 * Get session query parameters (detailed mode)
 */
export const GetSessionQuerySchema = z.object({
  query: z.object({
    'userplane-token': TokenSchema,
  }),
});

/**
 * Session init response
 */
export const SessionInitDataSchema = z.object({
  sessionToken: z.string(),
  expiresIn: z.number().int().positive(),
});

/**
 * Upload file info
 */
export const UploadFileSchema = z.object({
  type: FileTypeSchema,
  name: z.string().min(1, 'File name is required'),
  size: z.number().int().nonnegative(),
  mime_type: z.string().min(1, 'MIME type is required'),
});

/**
 * System metadata - arbitrary key-value pairs
 */
export const SessionSystemMetadataSchema = z.record(z.string(), z.unknown());

/**
 * Recording metadata
 */
export const SessionRecordingMetaSchema = z.object({
  systemMetadata: SessionSystemMetadataSchema,
  customMetadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Init upload request (detailed mode)
 */
export const InitUploadSchema = z.object({
  body: z.object({
    recording_duration: z
      .number()
      .int()
      .min(RECORDING_DURATION_LIMITS.MIN_DURATION_MS)
      .max(RECORDING_DURATION_LIMITS.DEFAULT_MAX_DURATION_MS),
    files: z.array(UploadFileSchema).min(1).max(4),
    metadata: SessionRecordingMetaSchema,
  }),
});

/**
 * Presigned URL item
 */
export const PresignedUrlSchema = z.object({
  type: FileTypeSchema,
  url: z.string().url(),
});

/**
 * Init upload response
 */
export const UploadInitDataSchema = z.object({
  recordingId: RecordingIdSchema,
  uploadToken: z.string(),
  presignedUrls: z.array(PresignedUrlSchema),
});

/**
 * Mark upload as available request (detailed mode)
 */
export const CompleteUploadSchema = z.object({
  body: z.object({
    recording_id: RecordingIdSchema,
  }),
});

/**
 * Upload complete response
 */
export const UploadCompleteDataSchema = z.object({
  success: z.boolean(),
  recordingId: RecordingIdSchema,
  status: UploadStatusSchema,
});
