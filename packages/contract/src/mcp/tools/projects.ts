import { z } from 'zod';

import type { McpToolDefinition } from '../types';
import { READ_ONLY_ANNOTATIONS } from '../types';

export const userplaneListProjects = {
  name: 'userplane_list_projects',
  title: 'List projects in workspace',
  description:
    'List projects in a Userplane workspace. Projects organize recordings and links, each with its own retention policy. Returns paginated results.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
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

export const userplaneGetProject = {
  name: 'userplane_get_project',
  title: 'Get project details',
  description:
    'Retrieve details for a specific project including title, retention policy, and whether it is the workspace default.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    projectId: z.string().describe('Project ID'),
  },
  annotations: READ_ONLY_ANNOTATIONS,
} as const satisfies McpToolDefinition;
