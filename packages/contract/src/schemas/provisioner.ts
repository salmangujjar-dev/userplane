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
 * Zendesk OAuth source
 * Identifies the origin of the OAuth flow for callback routing:
 * - inapp: user initiated from /workspace/create (onboarding)
 * - marketplace: user came from Zendesk Marketplace
 */
export const ZendeskOAuthSourceSchema = z
  .enum(['inapp', 'marketplace'])
  .optional()
  .default('inapp');

/**
 * Zendesk OAuth authorize request
 * Source and subdomain required (Zendesk needs subdomain for OAuth URL)
 */
export const ZendeskAuthorizeQuerySchema = z.object({
  source: ZendeskOAuthSourceSchema,
  subdomain: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/, 'Invalid Zendesk subdomain'),
  /** Zendesk app installation ID — passed from ZAF iframe for jwt_secret provisioning */
  installationId: z.coerce.number().optional(),
});

/**
 * Zendesk OAuth authorize response
 * Returns the authorization URL and state for CSRF protection
 */
export const ZendeskAuthorizeResponseSchema = z.object({
  authorizationUrl: z.string().url(),
  state: z.string(),
});

/**
 * Zendesk OAuth callback query parameters
 * Received from Zendesk after user authorizes
 */
export const ZendeskCallbackQuerySchema = z.object({
  code: z.string(),
  state: z.string(),
});
