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
  workspaceName: z.string(),
  domainId: z.string(),
  domainUrl: z.string(),
  domainVerificationUrl: z.string(),
  projectId: z.string(),
  projectTitle: z.string().nullable(),
});
