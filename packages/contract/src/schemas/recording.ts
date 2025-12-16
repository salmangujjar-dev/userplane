import { z } from 'zod';
import { UploadStatusSchema, SortDirectionSchema, PaginationMetaSchema } from './common';

/**
 * Recording schemas
 */

/**
 * Recording sort fields
 */
export const RecordingSortFieldSchema = z.enum(['created_at', 'recording_duration']);

/**
 * List recordings query parameters
 */
export const ListRecordingsQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  per_page: z.number().int().min(1).max(20).optional().default(10),
  created_by: z.array(z.string()).optional(),
  project_id: z.array(z.string()).optional(),
  link_id: z.array(z.string()).optional(),
  sort_by: RecordingSortFieldSchema.optional().default('created_at'),
  sort_direction: SortDirectionSchema.optional().default('desc'),
});

/**
 * System metadata
 */
export const SystemMetadataSchema = z.object({
  date: z.string(),
  time: z.string(),
  browser: z.string(),
  os: z.string(),
  windowSize: z.object({
    width: z.number().int().nonnegative(),
    height: z.number().int().nonnegative(),
  }),
});

/**
 * Recording metadata
 */
export const RecordingMetadataSchema = z.object({
  systemMetadata: SystemMetadataSchema,
  customMetadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Recording item in list
 */
export const RecordingItemSchema = z.object({
  id: z.string(),
  linkId: z.string(),
  linkTitle: z.string(),
  projectId: z.string().nullable(),
  projectTitle: z.string().nullable(),
  createdBy: z.string(),
  creatorName: z.string(),
  creatorEmail: z.string(),
  uploadStatus: UploadStatusSchema,
  recordingDurationMs: z.number().int().nonnegative().max(180000), // 3 minutes
  recordingMetadata: RecordingMetadataSchema,
  createdAt: z.string(),
});

/**
 * Recordings list response
 */
export const RecordingsListDataSchema = z.object({
  workspaceId: z.string(),
  recordings: z.array(RecordingItemSchema),
  pagination: PaginationMetaSchema,
});

/**
 * Recording resource
 */
export const RecordingResourceSchema = z.object({
  url: z.string().nullable(),
  message: z.string(),
});

/**
 * Recording detail response
 */
export const RecordingDetailDataSchema = z.object({
  workspaceId: z.string(),
  recording: RecordingItemSchema.extend({
    videoUrl: z.string().nullable(),
    thumbnailUrl: z.string().nullable(),
    consoleLogUrl: z.string().nullable(),
    networkLogUrl: z.string().nullable(),
  }),
});

/**
 * Recording resource response
 */
export const RecordingResourceDataSchema = z.object({
  recordingId: z.string(),
  resource: RecordingResourceSchema,
});

/**
 * Recording delete response
 */
export const RecordingDeleteDataSchema = z.object({
  workspaceId: z.string(),
  recordingId: z.string(),
});
