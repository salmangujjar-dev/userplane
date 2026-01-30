import { z } from 'zod';

import {
  DomainIdSchema,
  DomainStatusSchema,
  LinkIdSchema,
  LinkTypeSchema,
  ProjectIdSchema,
  WorkspaceIdSchema,
} from './common';
import { DomainRecordingPreferencesSchema } from './domain';
import { WorkspacePreferencesSchema } from './workspace';

/**
 * Cache schemas
 * Types for cached data - derived from existing schemas where possible
 */

// ============================================================
// Usage/entitlement cache
// ============================================================

const ResourceUsageSchema = z.object({
  consumed: z.number(),
  limit: z.number(),
  percentUsed: z.number(),
});

export const UsageSummarySchema = z.object({
  planId: z.string(),
  planName: z.string(),
  resources: z.record(z.string(), ResourceUsageSchema),
});
export type UsageSummary = z.infer<typeof UsageSummarySchema>;

// ============================================================
// Recording preferences cache (normalized architecture)
// ============================================================

/**
 * Workspace recording preferences for cache
 * Uses WorkspacePreferencesSchema but omits recordingSlug (not needed for session init)
 */
export const WorkspaceRecordingPrefsSchema = WorkspacePreferencesSchema.omit({
  recordingSlug: true,
});
export type WorkspaceRecordingPrefs = z.infer<typeof WorkspaceRecordingPrefsSchema>;

/**
 * Domain recording preferences for cache
 * Extends DomainRecordingPreferencesSchema with workspaceId and domainStatus for lookups
 */
export const DomainRecordingPrefsSchema = DomainRecordingPreferencesSchema.extend({
  workspaceId: WorkspaceIdSchema,
  domainStatus: DomainStatusSchema,
});
export type DomainRecordingPrefs = z.infer<typeof DomainRecordingPrefsSchema>;

/**
 * Link core data for cache
 * Minimal link data needed for session initialization
 */
export const LinkCoreSchema = z.object({
  linkId: LinkIdSchema,
  linkType: LinkTypeSchema,
  linkReusable: z.boolean(),
  workspaceId: WorkspaceIdSchema,
  projectId: ProjectIdSchema,
  domainId: DomainIdSchema,
  createdBy: z.string(),
  createdByName: z.string().nullable(),
});
export type LinkCore = z.infer<typeof LinkCoreSchema>;
