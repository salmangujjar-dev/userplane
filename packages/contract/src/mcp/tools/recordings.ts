import { z } from 'zod';

import type { McpToolDefinition } from '../types';
import { DESTRUCTIVE_ANNOTATIONS, READ_ONLY_ANNOTATIONS } from '../types';

export const userplaneListRecordings = {
  name: 'userplane_list_recordings',
  title: 'List screen recordings',
  description:
    'List screen recordings in a workspace. Recordings are screen captures from end users. Filter by project, link, or creator. Returns paginated results newest first.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    page: z.number().int().positive().optional().describe('Page number (default: 1)'),
    per_page: z
      .number()
      .int()
      .positive()
      .max(50)
      .optional()
      .describe('Results per page (default: 10, max: 50)'),
    project_id: z.string().optional().describe('Filter by project ID'),
    link_id: z.string().optional().describe('Filter by link ID'),
    created_by: z.string().optional().describe('Filter by creator workspace member ID'),
  },
  annotations: READ_ONLY_ANNOTATIONS,
} as const satisfies McpToolDefinition;

export const userplaneGetRecording = {
  name: 'userplane_get_recording',
  title: 'Get recording details',
  description:
    'Retrieve complete details for a screen recording including duration, metadata, and upload status. Use the recording resource tools to access video, thumbnail, and log files.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    recordingId: z.string().describe('Recording ID'),
  },
  annotations: READ_ONLY_ANNOTATIONS,
} as const satisfies McpToolDefinition;

export const userplaneDeleteRecording = {
  name: 'userplane_delete_recording',
  title: 'Delete a recording',
  description:
    'Soft-delete a screen recording. Only workspace admins, owners, or the recording creator can delete.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    recordingId: z.string().describe('Recording ID'),
  },
  annotations: DESTRUCTIVE_ANNOTATIONS,
} as const satisfies McpToolDefinition;
