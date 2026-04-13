import { z } from 'zod';

import { RecordingIdSchema, WorkspaceIdSchema } from '../../schemas/common';
import type { McpToolDefinition } from '../types';
import { READ_ONLY_ANNOTATIONS } from '../types';

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

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

/**
 * Recording row for list responses. No thumbnail (agents can't render it),
 * no linkId (the list row's JOIN doesn't return it; use get_rec_info to fetch
 * the full link). `playerUrl` is built from `workspaceId + recordingId`.
 */
export const McpRecordingItemSchema = z.object({
  recordingId: RecordingIdSchema,
  durationMs: z.number().int().nullable(),
  createdAt: z.coerce.date(),
  expiresAt: z.coerce.date().nullable(),
  creatorName: z.string(),
  linkTitle: z.string().nullable(),
  playerUrl: z.string().url(),
});

export const McpListRecordingsSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  recordings: z.array(McpRecordingItemSchema),
  total: z.number().int().nonnegative(),
});

export type McpRecordingItem = z.infer<typeof McpRecordingItemSchema>;
export type McpListRecordings = z.infer<typeof McpListRecordingsSchema>;
