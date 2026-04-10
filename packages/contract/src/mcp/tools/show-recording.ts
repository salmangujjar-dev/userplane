import { z } from 'zod';

import type { McpToolDefinition } from '../types';
import { READ_ONLY_ANNOTATIONS } from '../types';

export const userplaneShowRecording = {
  name: 'userplane_show_recording',
  title: 'Show recording',
  description:
    'Display an interactive recording viewer with video playback, session info, console logs, network requests, and user actions. Returns the complete recording experience in a single call.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    recordingId: z.string().describe('Recording ID'),
  },
  annotations: READ_ONLY_ANNOTATIONS,
} as const satisfies McpToolDefinition;
