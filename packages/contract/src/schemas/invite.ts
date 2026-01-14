import { z } from 'zod';
import { EmailSchema } from './common';

/**
 * Invite schemas
 */

/**
 * Send invites request (detailed mode)
 * Note: This schema is used by both /invite (standalone) and /workspace/:workspaceId/invite
 * For standalone, workspaceId is in body. For workspace route, it's in params.
 */
export const SendInvitesSchema = z.object({
  body: z.object({
    workspaceId: z.string(),
    emails: z.array(EmailSchema).min(1).max(10),
  }),
});

/**
 * Send workspace invites request (detailed mode) - used by workspace contract
 */
export const SendWorkspaceInvitesSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
  body: z.object({
    emails: z.array(EmailSchema).min(1).max(10),
  }),
});

/**
 * Invite result item
 */
export const InviteResultItemSchema = z.object({
  email: z.string().email(),
  success: z.boolean(),
  error: z.string().optional(),
});

/**
 * Send invites result response
 */
export const SendInvitesResultSchema = z.object({
  sent: z.array(InviteResultItemSchema),
  failed: z.array(InviteResultItemSchema),
});

/**
 * Validate invite request (detailed mode)
 * POST /invite/validate - public endpoint
 */
export const InviteActionQuerySchema = z.object({
  body: z.object({
    token: z.string().min(1),
  }),
});

/**
 * Validate invite result response
 */
export const InviteActionResultSchema = z.object({
  workspaceId: z.string(),
  workspaceName: z.string(),
  invitedByName: z.string(),
  invitedByEmail: z.string(),
});

/**
 * Accept invite request (detailed mode)
 * POST /workspace/{workspaceId}/accept - authenticated endpoint
 */
export const AcceptInviteSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
  body: z.object({
    token: z.string().min(1),
  }),
});

/**
 * Accept invite result response
 */
export const AcceptInviteDataSchema = z.object({
  workspaceId: z.string(),
  workspaceName: z.string(),
});
