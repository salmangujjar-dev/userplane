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
