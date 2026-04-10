import { z } from 'zod';

import type { McpToolDefinition } from '../types';
import { EXTERNAL_RESOURCE_ANNOTATIONS } from '../types';

const resourceInput = {
  workspaceId: z.string().describe('Workspace ID'),
  recordingId: z.string().describe('Recording ID'),
};

export const userplaneGetRecVideo = {
  name: 'userplane_get_rec_video',
  title: 'Get recording video URL',
  description:
    'Retrieve a time-limited presigned URL to download or stream the screen recording video file.',
  inputSchema: resourceInput,
  annotations: EXTERNAL_RESOURCE_ANNOTATIONS,
} as const satisfies McpToolDefinition;

export const userplaneGetRecThumb = {
  name: 'userplane_get_rec_thumb',
  title: 'Get recording thumbnail URL',
  description: "Retrieve a presigned URL for the screen recording's thumbnail preview image.",
  inputSchema: resourceInput,
  annotations: EXTERNAL_RESOURCE_ANNOTATIONS,
} as const satisfies McpToolDefinition;

export const userplaneGetRecConsole = {
  name: 'userplane_get_rec_console',
  title: 'Get console log URL',
  description:
    "Retrieve a presigned URL for the recording's browser console log. Contains console output captured during the recording, useful for debugging.",
  inputSchema: resourceInput,
  annotations: EXTERNAL_RESOURCE_ANNOTATIONS,
} as const satisfies McpToolDefinition;

export const userplaneGetRecNetwork = {
  name: 'userplane_get_rec_network',
  title: 'Get network log URL',
  description:
    "Retrieve a presigned URL for the recording's network activity log. Contains HTTP requests/responses, useful for diagnosing API issues.",
  inputSchema: resourceInput,
  annotations: EXTERNAL_RESOURCE_ANNOTATIONS,
} as const satisfies McpToolDefinition;

export const userplaneGetRecActions = {
  name: 'userplane_get_rec_actions',
  title: 'Get action replay URL',
  description:
    "Retrieve a presigned URL for the recording's action replay log containing user interactions (clicks, scrolls, inputs).",
  inputSchema: resourceInput,
  annotations: EXTERNAL_RESOURCE_ANNOTATIONS,
} as const satisfies McpToolDefinition;
