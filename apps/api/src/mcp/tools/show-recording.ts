import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { EXTERNAL_RESOURCE_ANNOTATIONS, userplaneShowRecording } from '@userplane/contract';
import { z } from 'zod';

import { env } from '@/api/env';

import { APP_RESOURCE_URIS } from '../app-resources';
import { requireWorkspaceMember, textResult } from '../helpers';
import type { McpDeps } from '../types';

/**
 * Derive CSP origins from environment config so the MCP App iframe
 * can load thumbnails, video, and log data from presigned R2 URLs.
 *
 * Format: full origins like `https://cdn.example.com` or
 * wildcard subdomains like `https://*.r2.cloudflarestorage.com`.
 *
 * All origins are derived from env — nothing hardcoded.
 */
function getCspDomains(): { connectDomains: string[]; resourceDomains: string[] } {
  const connectOrigins = new Set<string>();
  const resourceOrigins = new Set<string>();

  // Custom domains (CDN proxy in front of R2)
  for (const url of [env.storage.assetsDomain, env.storage.cdnDomain]) {
    try {
      const parsed = new URL(url);
      const origin = `${parsed.protocol}//${parsed.hostname}`;
      connectOrigins.add(origin);
      resourceOrigins.add(origin);
    } catch {
      // skip invalid URLs
    }
  }

  // Direct R2 presigned URL origins — derived from R2 account IDs in env.
  // Presigned URLs resolve to https://{accountId}.r2.cloudflarestorage.com
  const r2AccountIds = new Set([
    env.storage.assets.accountId,
    env.storage.cdn.accountId,
    env.storage.reports.accountId,
  ]);
  for (const accountId of r2AccountIds) {
    const origin = `https://${accountId}.r2.cloudflarestorage.com`;
    connectOrigins.add(origin);
    resourceOrigins.add(origin);
  }

  return {
    connectDomains: [...connectOrigins],
    resourceDomains: [...resourceOrigins],
  };
}

export function registerShowRecordingTools(server: McpServer, deps: McpDeps, userId: string) {
  const { title, description, inputSchema, annotations } = userplaneShowRecording;
  const csp = getCspDomains();

  // -----------------------------------------------------------------------
  // Main tool: userplane_show_recording
  // Returns recording detail + all resource URLs, with an interactive UI.
  // -----------------------------------------------------------------------
  registerAppTool(
    server,
    userplaneShowRecording.name,
    {
      title,
      description,
      inputSchema,
      annotations,
      _meta: {
        ui: {
          resourceUri: APP_RESOURCE_URIS.showRecording,
          csp,
        },
      },
    },
    async ({ workspaceId, recordingId }) => {
      await requireWorkspaceMember(deps, userId, workspaceId);

      // Fetch recording detail + all 5 resource URLs in parallel
      const [recording, video, thumbnail, consoleLog, networkLog, action] = await Promise.all([
        deps.recordingService.getById(recordingId, workspaceId),
        deps.recordingService.getVideoResource(recordingId, workspaceId),
        deps.recordingService.getThumbnailResource(recordingId, workspaceId),
        deps.recordingService.getConsoleLogResource(recordingId, workspaceId),
        deps.recordingService.getNetworkLogResource(recordingId, workspaceId),
        deps.recordingService.getActionResource(recordingId, workspaceId),
      ]);

      return textResult({
        workspaceId,
        recording,
        resources: { video, thumbnail, consoleLog, networkLog, action },
      });
    }
  );

  // -----------------------------------------------------------------------
  // Private app-only tool: refresh presigned URLs for expired resources
  // Hidden from LLM, only callable by the MCP App iframe UI.
  // -----------------------------------------------------------------------
  server.registerTool(
    'userplane_app_refresh_recording_urls',
    {
      description: 'Refresh presigned resource URLs for a recording (video, thumbnail, logs).',
      inputSchema: {
        workspaceId: z.string().describe('Workspace ID'),
        recordingId: z.string().describe('Recording ID'),
      },
      annotations: EXTERNAL_RESOURCE_ANNOTATIONS,
      _meta: { visibility: ['app'] },
    },
    async ({ workspaceId, recordingId }) => {
      await requireWorkspaceMember(deps, userId, workspaceId);

      const [video, thumbnail, consoleLog, networkLog, action] = await Promise.all([
        deps.recordingService.getVideoResource(recordingId, workspaceId),
        deps.recordingService.getThumbnailResource(recordingId, workspaceId),
        deps.recordingService.getConsoleLogResource(recordingId, workspaceId),
        deps.recordingService.getNetworkLogResource(recordingId, workspaceId),
        deps.recordingService.getActionResource(recordingId, workspaceId),
      ]);

      return textResult({ video, thumbnail, consoleLog, networkLog, action });
    }
  );
}
