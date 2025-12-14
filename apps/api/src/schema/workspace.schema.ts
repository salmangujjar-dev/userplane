/**
 * Workspace validation schemas
 * Schemas for workspace operations, domains, members, and settings
 */

import { z } from 'zod';
import { workspaceRoleEnum } from '@workspace/db';
import type { WorkspaceRole } from '@workspace/db';

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
 * Note: Recording toggle settings (hideSensitive, captureClientLog, captureServerLog) moved to domain level
 */
export const updateWorkspacePreferencesSchema = z.object({
  recordingCustomizeLink: z.boolean().optional(),
});

/**
 * Update link settings schema
 * Schema for link branding and customization settings
 */
export const updateLinkSettingsSchema = z.object({
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

/**
 * Count workspaces query schema
 * Schema for filtering workspace count by role
 * Accepts comma-separated role values: admin,member,owner
 * Empty or undefined defaults to all roles
 */
export const countWorkspacesQuerySchema = z.object({
  roles: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === '') {
        return ['member', 'admin', 'owner'] as WorkspaceRole[];
      }
      const roles = val.split(',').map((r) => r.trim().toLowerCase());
      const validRoles = roles.filter((r) => WORKSPACE_ROLES.includes(r as WorkspaceRole));
      return validRoles as WorkspaceRole[];
    }),
});

/**
 * Workspace search query schema
 * Schema for unified workspace search across members, projects, domains, and links
 */
export const workspaceSearchQuerySchema = z.object({
  q: z.string().min(1, 'Search term is required').max(100, 'Search term too long'),
  type: z.enum(['members', 'projects', 'domains', 'links'], {
    errorMap: () => ({ message: 'Type must be one of: members, projects, domains, links' }),
  }),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return 5;
      const num = parseInt(val, 10);
      if (isNaN(num) || num < 1) return 5;
      // Links have higher limit (20) due to FTS optimization
      return Math.min(num, 20);
    }),
});
