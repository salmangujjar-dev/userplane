/**
 * Workspace validation schemas
 * Schemas for workspace operations, domains, members, and settings
 */

import { z } from 'zod';
import { workspaceRoleEnum } from '@workspace/db';

/**
 * Workspace roles (from database enum)
 */
export const WORKSPACE_ROLES = workspaceRoleEnum.enumValues;

/**
 * Add domain schema
 */
export const addDomainSchema = z.object({
  url: z.string().url('Invalid URL format').min(1, 'URL is required'),
});

/**
 * Update domain schema
 */
export const updateDomainSchema = z.object({
  url: z.string().url('Invalid URL format').min(1, 'URL is required'),
});

/**
 * Update workspace preferences schema
 * Schema for toggling recording behavior preferences
 */
export const updateWorkspacePreferencesSchema = z.object({
  recordingCustomizeLink: z.boolean().optional(),
  recordingHideSensitive: z.boolean().optional(),
  recordingCaptureClientLog: z.boolean().optional(),
  recordingCaptureServerLog: z.boolean().optional(),
});

/**
 * Update recording link settings schema
 * Schema for recording link branding and customization settings
 */
export const updateRecordingLinkSettingsSchema = z.object({
  recordingCompanyName: z.string().nullable().optional(),
  recordingHeader: z.string().nullable().optional(),
  recordingFootnote: z.string().nullable().optional(),
  recordingPrimaryColor: z.string().nullable().optional(),
  recordingMaxDuration: z.number().int().positive().nullable().optional(),
});

/**
 * Update workspace name schema
 */
export const updateWorkspaceNameSchema = z.object({
  name: z
    .string()
    .min(1, 'Workspace name is required')
    .max(255, 'Workspace name must be less than 255 characters'),
});

/**
 * Update member role schema
 */
export const updateMemberRoleSchema = z.object({
  role: z.enum(WORKSPACE_ROLES),
});

/**
 * Update notification preferences schema
 */
export const updateNotificationPreferencesSchema = z.object({
  notifyOnLinkUsage: z.boolean().optional(),
  notifyOnQuotaReset: z.boolean().optional(),
  notifyOnQuotaLimit: z.boolean().optional(),
  notifyOnInviteAccepted: z.boolean().optional(),
  notifyOnMemberJoin: z.boolean().optional(),
});
