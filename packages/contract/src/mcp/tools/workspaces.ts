import { z } from 'zod';

import { WorkspaceIdSchema } from '../../schemas/common';
import type { McpToolDefinition } from '../types';
import { READ_ONLY_ANNOTATIONS } from '../types';

export const userplaneListWorkspaces = {
  name: 'userplane_list_workspaces',
  title: 'List workspaces',
  description:
    'List Userplane workspaces the authenticated user belongs to. A workspace is a team-level container that holds projects, recordings, links, and members. Returns paginated results.',
  inputSchema: {
    page: z.number().int().positive().optional().describe('Page number (default: 1)'),
    per_page: z
      .number()
      .int()
      .positive()
      .max(50)
      .optional()
      .describe('Results per page (default: 5, max: 50)'),
  },
  annotations: READ_ONLY_ANNOTATIONS,
} as const satisfies McpToolDefinition;

export const userplaneGetWorkspace = {
  name: 'userplane_get_workspace',
  title: 'Get workspace details',
  description:
    'Retrieve details for a specific Userplane workspace. The authenticated user must be a member of the workspace.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID to retrieve'),
  },
  annotations: READ_ONLY_ANNOTATIONS,
} as const satisfies McpToolDefinition;

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

export const McpWorkspaceItemSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  workspaceName: z.string(),
});

export const McpWorkspaceDetailSchema = McpWorkspaceItemSchema.extend({
  createdAt: z.coerce.date(),
  dashboardUrl: z.string().url(),
});

export const McpListWorkspacesSchema = z.object({
  workspaces: z.array(McpWorkspaceItemSchema),
  total: z.number().int().nonnegative(),
});

export type McpWorkspaceItem = z.infer<typeof McpWorkspaceItemSchema>;
export type McpWorkspaceDetail = z.infer<typeof McpWorkspaceDetailSchema>;
export type McpListWorkspaces = z.infer<typeof McpListWorkspacesSchema>;
