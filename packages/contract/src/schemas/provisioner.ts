import { z } from 'zod';

/**
 * Provisioner schemas
 */

/**
 * Create workspace request (detailed mode)
 */
export const CreateWorkspaceSchema = z.object({
  body: z.object({
    url: z.string().url(),
  }),
});

/**
 * Workspace create response
 */
export const WorkspaceCreateDataSchema = z.object({
  workspaceId: z.string(),
});
