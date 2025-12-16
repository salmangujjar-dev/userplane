import { z } from 'zod';
import { FileTypeSchema, UploadStateSchema, UploadStatusSchema } from './common';

/**
 * Session schemas
 */

/**
 * Get session query parameters
 */
export const GetSessionQuerySchema = z.object({
  token: z.string().min(1),
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
 * Init upload request
 */
export const InitUploadSchema = z.object({
  recording_duration: z.number().int().positive().max(180000),
  files: z.array(UploadFileSchema).min(1).max(4),
  metadata: SessionRecordingMetaSchema,
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
 * Complete upload request
 */
export const CompleteUploadSchema = z.object({
  recording_id: z.string().min(1),
  state: UploadStateSchema,
});

/**
 * Upload complete response
 */
export const UploadCompleteDataSchema = z.object({
  success: z.boolean(),
  recordingId: z.string(),
  status: UploadStatusSchema,
});
