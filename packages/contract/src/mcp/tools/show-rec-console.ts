import { z } from 'zod';

import type { McpToolDefinition } from '../types';
import { READ_ONLY_ANNOTATIONS } from '../types';

export const userplaneShowRecConsole = {
  name: 'userplane_show_rec_console',
  title: 'Show console logs',
  description:
    'Display an interactive viewer for browser console logs captured during the recording. Shows log entries with level filtering, search, timestamps, and expandable details. Use this when the user wants to visually inspect console output.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    recordingId: z.string().describe('Recording ID'),
  },
  annotations: READ_ONLY_ANNOTATIONS,
} as const satisfies McpToolDefinition;
