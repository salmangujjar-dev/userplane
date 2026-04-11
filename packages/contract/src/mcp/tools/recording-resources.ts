import { z } from 'zod';

import type { McpToolDefinition } from '../types';
import { EXTERNAL_RESOURCE_ANNOTATIONS, READ_ONLY_ANNOTATIONS } from '../types';

const resourceInput = {
  workspaceId: z.string().describe('Workspace ID'),
  recordingId: z.string().describe('Recording ID'),
};

export const userplaneGetRecInfo = {
  name: 'userplane_get_rec_info',
  title: 'Get recording details',
  description:
    'Retrieve complete details for a screen recording including duration, metadata, and upload status. Use the recording resource tools to access video, thumbnail, and log files.',
  inputSchema: resourceInput,
  annotations: READ_ONLY_ANNOTATIONS,
} as const satisfies McpToolDefinition;

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
  title: 'Get recording thumbnail',
  description: "Retrieve the screen recording's thumbnail preview as an inline base64 data URI.",
  inputSchema: resourceInput,
  annotations: EXTERNAL_RESOURCE_ANNOTATIONS,
} as const satisfies McpToolDefinition;

export const userplaneGetRecConsole = {
  name: 'userplane_get_rec_console',
  title: 'Get console logs',
  description:
    'Retrieve browser console log entries captured during the recording. Returns an array of log entries with level, message, timestamp, and optional stack traces. Useful for debugging errors and warnings.',
  inputSchema: resourceInput,
  annotations: READ_ONLY_ANNOTATIONS,
} as const satisfies McpToolDefinition;

export const userplaneGetRecNetwork = {
  name: 'userplane_get_rec_network',
  title: 'Get network logs',
  description:
    'Retrieve network request/response log entries captured during the recording. Returns an array of entries with URL, method, status, duration, headers, and bodies. Useful for diagnosing API issues.',
  inputSchema: resourceInput,
  annotations: READ_ONLY_ANNOTATIONS,
} as const satisfies McpToolDefinition;

export const userplaneGetRecActions = {
  name: 'userplane_get_rec_actions',
  title: 'Get user actions',
  description:
    'Retrieve user interaction events captured during the recording. Returns an array of actions including clicks, navigation, tab switches, and page lifecycle events.',
  inputSchema: resourceInput,
  annotations: READ_ONLY_ANNOTATIONS,
} as const satisfies McpToolDefinition;
