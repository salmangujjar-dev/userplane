import { z } from 'zod';

import type { McpToolDefinition } from '../types';
import { READ_ONLY_ANNOTATIONS } from '../types';

export const userplaneAppFetchResource = {
  name: 'userplane_app_fetch_resource',
  title: 'Fetch recording app resource',
  description: 'Fetch recording log data (console, network, or actions) and return its content.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    recordingId: z.string().describe('Recording ID'),
    resourceType: z
      .enum(['consoleLog', 'networkLog', 'action'])
      .describe('Which log resource to fetch'),
  },
  annotations: READ_ONLY_ANNOTATIONS,
  _meta: { ui: { visibility: ['app'] } },
} as const satisfies McpToolDefinition;
