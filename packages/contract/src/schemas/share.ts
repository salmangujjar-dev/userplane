import { z } from 'zod';

import { SHARE_MAX_DURATION_SECONDS } from '../constants/share';
import { RecordingIdSchema, WorkspaceIdSchema, WorkspaceMemberIdSchema } from './common';
import { RecordingDetailSchema, RecordingResourceSchema } from './recording';

/**
 * Share token JWT payload schema
 * Short keys used to minimize JWT token length
 */
export const ShareTokenPayloadSchema = z.object({
  iss: z.string(), // Issuer
  rid: RecordingIdSchema, // Recording ID
  wid: WorkspaceIdSchema, // Workspace ID
  wmid: WorkspaceMemberIdSchema, // Workspace Member ID (who shared)
  iat: z.number(), // Issued at
  exp: z.number(), // Expiry
});

/**
 * Generate share token request
 */
export const GenerateShareTokenSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    recordingId: RecordingIdSchema,
  }),
  body: z.object({
    expiresInSeconds: z.number().int().positive().max(SHARE_MAX_DURATION_SECONDS).optional(),
  }),
});

/**
 * Generate share token response
 */
export const GenerateShareTokenDataSchema = z.object({
  shareUrl: z.string(),
  expiresAt: z.coerce.date(),
});

/**
 * View shared recording request
 */
export const ViewSharedRecordingSchema = z.object({
  query: z.object({
    token: z.string(),
  }),
});

/**
 * Shared recording resource URLs
 */
export const SharedRecordingResourcesSchema = z.object({
  video: RecordingResourceSchema,
  thumbnail: RecordingResourceSchema,
  consoleLog: RecordingResourceSchema,
  networkLog: RecordingResourceSchema,
  action: RecordingResourceSchema,
});

/**
 * Shared by information
 */
export const SharedBySchema = z.object({
  name: z.string(),
});

/**
 * View shared recording response
 */
export const ViewSharedRecordingDataSchema = z.object({
  recording: RecordingDetailSchema,
  resources: SharedRecordingResourcesSchema,
  sharedBy: SharedBySchema,
  expiresAt: z.coerce.date(),
});

// Type exports
export type ShareTokenPayload = z.infer<typeof ShareTokenPayloadSchema>;
export type GenerateShareTokenData = z.infer<typeof GenerateShareTokenDataSchema>;
export type ViewSharedRecordingData = z.infer<typeof ViewSharedRecordingDataSchema>;
