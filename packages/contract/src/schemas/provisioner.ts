import { z } from 'zod';

import { URLSchema } from './common';

/**
 * Provisioner schemas
 */

/**
 * Create workspace request (detailed mode)
 * Discriminated union between manual workspace creation (url) or invite token
 * Workspaces start on free plan - users upgrade via subscription
 */
export const CreateWorkspaceSchema = z.object({
  body: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('manual'),
      url: URLSchema,
    }),
    z.object({
      type: z.literal('invite'),
      inviteToken: z.string(),
    }),
  ]),
});

/**
 * Workspace create response
 * Discriminated union based on 'created' flag:
 * - created: false (token invalid or workspace exists, includes URL for manual flow fallback)
 * - created: true (workspace successfully created with required IDs)
 */
export const WorkspaceCreateDataSchema = z.discriminatedUnion('created', [
  z.object({
    created: z.literal(false),
    workspaceUrl: URLSchema.optional(),
  }),
  z.object({
    created: z.literal(true),
    workspaceId: z.string(),
    workspaceName: z.string(),
  }),
]);

/**
 * Intercom OAuth authorize response
 * Returns the authorization URL and state for CSRF protection
 */
export const IntercomAuthorizeResponseSchema = z.object({
  authorizationUrl: z.string().url(),
  state: z.string(),
});

/**
 * Intercom OAuth callback query parameters
 * Received from Intercom after user authorizes
 */
export const IntercomCallbackQuerySchema = z.object({
  code: z.string(),
  state: z.string(),
});
