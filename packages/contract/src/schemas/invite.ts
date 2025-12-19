import { z } from 'zod';

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
    emails: z.array(z.string().email()).min(1).max(10),
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
    emails: z.array(z.string().email()).min(1).max(10),
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
 * Invite action query parameters (detailed mode)
 */
export const InviteActionQuerySchema = z.object({
  query: z.object({
    token: z.string().min(1),
    action: z.enum(['validate', 'accept']).optional().default('validate'),
  }),
});

/**
 * Invite action result response
 */
export const InviteActionResultSchema = z.object({
  workspaceId: z.string(),
  workspaceName: z.string(),
  invitedByName: z.string(),
  invitedByEmail: z.string(),
});
