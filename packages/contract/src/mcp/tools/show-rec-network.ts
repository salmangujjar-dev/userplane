import { z } from 'zod';

import type { McpToolDefinition } from '../types';
import { READ_ONLY_ANNOTATIONS } from '../types';

export const userplaneShowRecNetwork = {
  name: 'userplane_show_rec_network',
  title: 'Show network requests',
  description:
    'Display an interactive viewer for network requests captured during the recording. Shows requests with type filtering, search, status codes, durations, and expandable headers and bodies. Use this when the user wants to visually inspect network activity.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    recordingId: z.string().describe('Recording ID'),
  },
  annotations: READ_ONLY_ANNOTATIONS,
} as const satisfies McpToolDefinition;
