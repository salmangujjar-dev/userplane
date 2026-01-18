import { z } from 'zod';

import { URLSchema } from './common';

/**
 * Provisioner schemas
 */

/**
 * Create workspace request (detailed mode)
 */
export const CreateWorkspaceSchema = z.object({
  body: z.object({
    url: URLSchema.optional(),
    inviteToken: z.string().optional(),
  }),
});

/**
 * Workspace create response
 * Discriminated union based on 'created' flag:
 * - created: false (token invalid or workspace exists)
 * - created: true (workspace successfully created with required IDs)
 */
export const WorkspaceCreateDataSchema = z.discriminatedUnion('created', [
  z.object({
    created: z.literal(false),
  }),
  z.object({
    created: z.literal(true),
    workspaceId: z.string(),
    workspaceName: z.string(),
  }),
]);
