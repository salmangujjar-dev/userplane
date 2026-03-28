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
 * Intercom OAuth source
 * Identifies the origin of the OAuth flow for callback routing:
 * - inapp: user initiated from /workspace/create (onboarding)
 * - marketplace: user came from Intercom App Store
 */
export const IntercomOAuthSourceSchema = z
  .enum(['inapp', 'marketplace'])
  .optional()
  .default('inapp');

/**
 * Intercom OAuth authorize request
 * Optional source to identify the flow origin
 */
export const IntercomAuthorizeQuerySchema = z.object({
  source: IntercomOAuthSourceSchema,
});

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

/**
 * Slack OAuth authorize request
 * No parameters needed for Slack onboarding
 */
export const SlackAuthorizeQuerySchema = z.object({});

/**
 * Slack OAuth authorize response
 * Returns the authorization URL and state for CSRF protection
 */
export const SlackAuthorizeResponseSchema = z.object({
  authorizationUrl: z.string().url(),
  state: z.string(),
});

/**
 * Slack OAuth callback query parameters
 * Received from Slack after user authorizes
 */
export const SlackCallbackQuerySchema = z.object({
  code: z.string(),
  state: z.string(),
});
