import { z } from 'zod';
import { UploadStatusSchema, SortDirectionSchema, PaginationMetaSchema } from './common';
import { RECORDING_DURATION_LIMITS } from '../constants/session';

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
  workspaceId: z.string(),
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
 * Recording creator information
 */
export const RecordingCreatorSchema = z.object({
  id: z.string(),
  name: z.string(),
});

/**
 * Recording item in list
 */
export const RecordingItemSchema = z.object({
  id: z.string(),
  recordingThumbnail: z.string().nullable(),
  recordingDurationMs: z.number().int().nullable(),
  createdAt: z.date(),
  creator: RecordingCreatorSchema,
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
  size: z.number().int().nullable().optional(),
  durationMs: z.number().int().nullable().optional(),
});

/**
 * Link reference in recording detail
 */
export const LinkRefSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  providerType: z.string().nullable(),
});

/**
 * Project reference in recording detail
 */
export const RecordingProjectRefSchema = z.object({
  id: z.string().nullable(),
  title: z.string().nullable(),
});

/**
 * Domain reference in recording detail
 */
export const RecordingDomainRefSchema = z.object({
  id: z.string(),
  url: z.string(),
});

/**
 * Recording meta information
 */
export const RecordingDetailMetaSchema = z.object({
  link: LinkRefSchema,
  creator: RecordingCreatorSchema,
  project: RecordingProjectRefSchema,
  domain: RecordingDomainRefSchema,
  workspaceId: z.string(),
  status: UploadStatusSchema,
  recordingMeta: RecordingMetadataSchema.nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Recording detail
 */
export const RecordingDetailSchema = z.object({
  id: z.string(),
  meta: RecordingDetailMetaSchema,
});

/**
 * Recording detail response
 */
export const RecordingDetailDataSchema = z.object({
  workspaceId: z.string(),
  recording: RecordingDetailSchema,
});

/**
 * Recording resource response
 */
export const RecordingResourceDataSchema = z.object({
  recordingId: z.string(),
  resource: RecordingResourceSchema,
});

/**
 * Recording by ID request
 */
export const RecordingByIdSchema = z.object({
  workspaceId: z.string(),
  recordingId: z.string(),
});

/**
 * Recording delete request
 */
export const DeleteRecordingSchema = z.object({
  workspaceId: z.string(),
  recordingId: z.string(),
});

/**
 * Recording delete response
 */
export const RecordingDeleteDataSchema = z.object({
  workspaceId: z.string(),
  recordingId: z.string(),
});
