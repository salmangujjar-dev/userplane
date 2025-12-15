/**
 * Recording metadata schemas
 * Zod schemas for validating and transforming recording metadata
 */

import { z } from 'zod';

/**
 * Zod schema for recording system metadata
 */
export const recordingSystemMetadataSchema = z.object({
  date: z.string(),
  time: z.string(),
  browser: z.string(),
  os: z.string(),
  windowSize: z.object({
    width: z.number(),
    height: z.number(),
  }),
});

/**
 * Zod schema for recording custom metadata
 * Allows arbitrary key-value pairs
 */
export const recordingCustomMetadataSchema = z.record(z.unknown());

/**
 * Zod schema for tracking uploaded files in partial uploads
 */
export const uploadedFilesSchema = z.object({
  video: z.boolean(),
  thumbnail: z.boolean(),
  consoleLog: z.boolean().optional(),
  networkLog: z.boolean().optional(),
});

/**
 * Zod schema for internal metadata managed by the system
 * Used for operational tracking and should not be exposed to users
 */
export const recordingInternalMetadataSchema = z.object({
  uploadedFiles: uploadedFilesSchema.optional(),
  failureReason: z.string().optional(),
});

/**
 * Zod schema for recording metadata (version 1)
 * Versioned for backward compatibility
 */
export const recordingMetaSchemaV1 = z.object({
  version: z.literal(1),
  systemMetadata: recordingSystemMetadataSchema,
  customMetadata: recordingCustomMetadataSchema,
  internalMetadata: recordingInternalMetadataSchema.optional(),
});

/**
 * Zod schema for creating recording metadata (without version field)
 * Version is added automatically by the repository
 */
export const recordingMetaInputSchema = z.object({
  systemMetadata: recordingSystemMetadataSchema,
  customMetadata: recordingCustomMetadataSchema,
  internalMetadata: recordingInternalMetadataSchema.optional(),
});

/**
 * Schema for all supported recording metadata versions
 * Currently only v1 is supported. When v2 is added, change to:
 * export const recordingMetaSchema = z.union([recordingMetaSchemaV1, recordingMetaSchemaV2]);
 */
export const recordingMetaSchema = recordingMetaSchemaV1;

/**
 * System metadata captured during recording
 */
export type RecordingSystemMetadata = z.infer<typeof recordingSystemMetadataSchema>;

/**
 * Custom metadata - arbitrary key-value pairs
 */
export type RecordingCustomMetadata = z.infer<typeof recordingCustomMetadataSchema>;

/**
 * Uploaded files tracking for partial uploads
 */
export type UploadedFiles = z.infer<typeof uploadedFilesSchema>;

/**
 * Internal metadata for operational tracking
 */
export type RecordingInternalMetadata = z.infer<typeof recordingInternalMetadataSchema>;

/**
 * Recording metadata structure
 * Versioned for backward compatibility
 */
export type RecordingMeta = z.infer<typeof recordingMetaSchema>;

/**
 * Recording metadata input (without version)
 */
export type RecordingMetaInput = z.infer<typeof recordingMetaInputSchema>;
