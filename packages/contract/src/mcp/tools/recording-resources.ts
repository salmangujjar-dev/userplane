import { z } from 'zod';

import {
  LinkIdSchema,
  ProjectIdSchema,
  RecordingIdSchema,
  UploadStatusSchema,
  WorkspaceIdSchema,
} from '../../schemas/common';
import type { McpToolDefinition } from '../types';
import { READ_ONLY_ANNOTATIONS } from '../types';

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
  annotations: READ_ONLY_ANNOTATIONS,
} as const satisfies McpToolDefinition;

export const userplaneGetRecThumb = {
  name: 'userplane_get_rec_thumb',
  title: 'Get recording thumbnail',
  description: "Retrieve the screen recording's thumbnail preview as an inline base64 data URI.",
  inputSchema: resourceInput,
  annotations: READ_ONLY_ANNOTATIONS,
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

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

/**
 * Flat recording detail. Drops the `meta.*` wrapper, arbitrary JSONB
 * (`systemMeta`/`customMeta`/`notes`), integration plumbing
 * (`providerType`/`providerId`/`providerRef`/`providerData`), and
 * `updatedAt`/`workspaceMemberId`/`domainId` that agents can't act on.
 */
export const McpRecordingDetailSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  recordingId: RecordingIdSchema,
  durationMs: z.number().int(),
  startedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  expiresAt: z.coerce.date().nullable(),
  status: UploadStatusSchema,
  linkId: LinkIdSchema,
  linkTitle: z.string().nullable(),
  projectId: ProjectIdSchema.nullable(),
  projectTitle: z.string().nullable(),
  domainUrl: z.string(),
  creatorName: z.string(),
  playerUrl: z.string().url(),
});

export const McpRecVideoSchema = z.object({
  recordingId: RecordingIdSchema,
  url: z.string().url().nullable(),
  durationMs: z.number().int().nullable(),
});

/**
 * Thumbnail is a presigned URL — never inlined base64. Violates
 * `no_video_proxy_mcp` guidance otherwise.
 */
export const McpRecThumbSchema = z.object({
  recordingId: RecordingIdSchema,
  url: z.string().url().nullable(),
});

/**
 * Shared shape for the three log-entry tools (console/network/actions).
 * Entries are upstream JSON blobs; agents analyze them directly.
 */
export const McpLogEntriesSchema = z.object({
  recordingId: RecordingIdSchema,
  entries: z.array(z.unknown()),
});

export type McpRecordingDetail = z.infer<typeof McpRecordingDetailSchema>;
export type McpRecVideo = z.infer<typeof McpRecVideoSchema>;
export type McpRecThumb = z.infer<typeof McpRecThumbSchema>;
export type McpLogEntries = z.infer<typeof McpLogEntriesSchema>;
