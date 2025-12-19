import { z } from 'zod';

/**
 * Provisioner schemas
 */

/**
 * Create workspace request
 */
export const CreateWorkspaceSchema = z.object({
  url: z.string().url(),
});

/**
 * Workspace create response
 */
export const WorkspaceCreateDataSchema = z.object({
  workspaceId: z.string(),
});
