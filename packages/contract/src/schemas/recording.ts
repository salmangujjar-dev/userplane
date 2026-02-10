import { z } from 'zod';

import { RECORDING_PAGINATION } from '../constants';
import {
  DomainIdSchema,
  LinkIdSchema,
  LinkProviderTypeSchema,
  PaginationMetaSchema,
  ProjectIdSchema,
  RecordingIdSchema,
  SortDirectionSchema,
  UploadStatusSchema,
  WorkspaceIdSchema,
  WorkspaceMemberIdSchema,
} from './common';
import type { LinkProviderData } from './link-provider';

/**
 * Recording schemas
 */

/**
 * Recording sort fields
 */
export const RecordingSortFieldSchema = z.enum(['created_at', 'recording_duration']);

/**
 * List recordings query parameters (detailed mode)
 */
export const ListRecordingsQuerySchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    per_page: z.coerce
      .number()
      .int()
      .min(RECORDING_PAGINATION.MIN_PER_PAGE)
      .max(RECORDING_PAGINATION.MAX_PER_PAGE)
      .optional()
      .default(RECORDING_PAGINATION.DEFAULT_PER_PAGE),
    created_by: z.array(WorkspaceMemberIdSchema).optional(),
    project_id: z.array(ProjectIdSchema).optional(),
    link_id: z.array(LinkIdSchema).optional(),
    sort_by: RecordingSortFieldSchema.optional().default('created_at'),
    sort_direction: SortDirectionSchema.optional().default('desc'),
  }),
});

/**
 * System metadata - arbitrary key-value pairs
 */
export const SystemMetaSchema = z.record(z.string(), z.unknown());

/**
 * Custom metadata - arbitrary key-value pairs
 */
export const CustomMetaSchema = z.record(z.string(), z.unknown());

/**
 * Recording creator information
 */
export const RecordingCreatorSchema = z.object({
  workspaceMemberId: WorkspaceMemberIdSchema,
  name: z.string(),
});

/**
 * Recording item in list
 */
export const RecordingItemSchema = z.object({
  recordingId: RecordingIdSchema,
  recordingThumbnail: z.string().nullable(),
  recordingDurationMs: z.number().int().nullable(),
  expiresAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  creator: RecordingCreatorSchema,
});

/**
 * Recordings list response
 */
export const RecordingsListDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  recordings: z.array(RecordingItemSchema),
  pagination: PaginationMetaSchema,
});

/**
 * Video source with URL and MIME type
 */
export const VideoSourceSchema = z.object({
  url: z.string(),
  type: z.string(),
});

/**
 * Recording resource
 */
export const RecordingResourceSchema = z.object({
  url: z.string().nullable(),
  message: z.string(),
  type: z.string().nullable().optional(),
  sources: z.array(VideoSourceSchema).optional(),
  size: z.number().int().nullable().optional(),
  durationMs: z.number().int().nullable().optional(),
});

/**
 * Link reference in recording detail
 *
 * providerType uses the LinkProviderType enum for compile-time safety.
 * providerData is validated as a JSON object at the schema level; for
 * provider-specific narrowing use parseLinkProviderData from link-provider.ts.
 */
export const LinkRefSchema = z.object({
  linkId: LinkIdSchema,
  title: z.string().nullable(),
  providerType: LinkProviderTypeSchema.nullable(),
  providerId: z.string().nullable(),
  providerRef: z.string().nullable(),
  providerData: z
    .record(z.string(), z.unknown())
    .nullable()
    .transform((v) => v as LinkProviderData | null),
  createdAt: z.coerce.date(),
});

/**
 * Project reference in recording detail
 */
export const RecordingProjectRefSchema = z.object({
  projectId: ProjectIdSchema.nullable(),
  title: z.string().nullable(),
});

/**
 * Domain reference in recording detail
 */
export const RecordingDomainRefSchema = z.object({
  domainId: DomainIdSchema,
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
  workspaceId: WorkspaceIdSchema,
  status: UploadStatusSchema,
  systemMeta: SystemMetaSchema.nullable(),
  customMeta: CustomMetaSchema.nullable(),
  expiresAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Recording detail
 */
export const RecordingDetailSchema = z.object({
  recordingId: RecordingIdSchema,
  recordingDurationMs: z.number().int(),
  meta: RecordingDetailMetaSchema,
});

/**
 * Recording detail response
 */
export const RecordingDetailDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  recording: RecordingDetailSchema,
});

/**
 * Recording resource response
 */
export const RecordingResourceDataSchema = z.object({
  recordingId: RecordingIdSchema,
  resource: RecordingResourceSchema,
});

/**
 * Recording by ID request (detailed mode)
 */
export const RecordingByIdSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    recordingId: RecordingIdSchema,
  }),
});

/**
 * Recording delete request (detailed mode)
 */
export const DeleteRecordingSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    recordingId: RecordingIdSchema,
  }),
});

/**
 * Update recording request (PATCH)
 */
export const UpdateRecordingSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    recordingId: RecordingIdSchema,
  }),
  body: z.object({
    expiresAt: z.coerce.date().nullable().optional(),
  }),
});

/**
 * Recording update response
 */
export const RecordingUpdateDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  recordingId: RecordingIdSchema,
  expiresAt: z.coerce.date().nullable(),
});

/**
 * Recording delete response
 */
export const RecordingDeleteDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  recordingId: RecordingIdSchema,
});

// Type exports
export type LinkRef = z.infer<typeof LinkRefSchema>;
export type RecordingCreator = z.infer<typeof RecordingCreatorSchema>;
export type RecordingDetailMeta = z.infer<typeof RecordingDetailMetaSchema>;
export type RecordingDetail = z.infer<typeof RecordingDetailSchema>;
export type RecordingItem = z.infer<typeof RecordingItemSchema>;
export type RecordingsListData = z.infer<typeof RecordingsListDataSchema>;
export type RecordingResourceData = z.infer<typeof RecordingResourceDataSchema>;
