import { z } from 'zod';

import type { McpToolDefinition } from '../types';
import { READ_ONLY_ANNOTATIONS } from '../types';

export const userplaneShowRecActions = {
  name: 'userplane_show_rec_actions',
  title: 'Show user actions',
  description:
    'Display an interactive viewer for user interaction events captured during the recording. Shows clicks, navigation, tab switches, and page lifecycle events with type filtering, search, and expandable details. Use this when the user wants to visually inspect user behavior.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    recordingId: z.string().describe('Recording ID'),
  },
  annotations: READ_ONLY_ANNOTATIONS,
} as const satisfies McpToolDefinition;
