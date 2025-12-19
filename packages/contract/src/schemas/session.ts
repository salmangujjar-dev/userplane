import { z } from 'zod';
import { FileTypeSchema, UploadStatusSchema } from './common';
import { RECORDING_DURATION_LIMITS } from '../constants/session';

/**
 * Session schemas
 */

/**
 * Get session query parameters (detailed mode)
 */
export const GetSessionQuerySchema = z.object({
  query: z.object({
    token: z.string().min(1),
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
  name: z.string().min(1),
  size: z.number().int().nonnegative(),
  mime_type: z.string().min(1),
});

/**
 * System metadata
 */
export const SessionSystemMetadataSchema = z.object({
  date: z.string().min(1),
  time: z.string().min(1),
  browser: z.string().min(1),
  os: z.string().min(1),
  windowSize: z.object({
    width: z.number().int().nonnegative(),
    height: z.number().int().nonnegative(),
  }),
});

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
  recordingId: z.string(),
  uploadToken: z.string(),
  presignedUrls: z.array(PresignedUrlSchema),
});

/**
 * Mark upload as available request (detailed mode)
 */
export const CompleteUploadSchema = z.object({
  body: z.object({
    recording_id: z.string().min(1),
  }),
});

/**
 * Upload complete response
 */
export const UploadCompleteDataSchema = z.object({
  success: z.boolean(),
  recordingId: z.string(),
  status: UploadStatusSchema,
});
