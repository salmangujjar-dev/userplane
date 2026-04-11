import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { EXTERNAL_RESOURCE_ANNOTATIONS, userplaneShowRecording } from '@userplane/contract';
import { z } from 'zod';

import { env } from '@/api/env';

import { APP_RESOURCE_URIS } from '../app-resources';
import { fetchThumbnailDataUri, requireWorkspaceMember, textResult } from '../helpers';
import type { McpDeps } from '../types';

/**
 * Derive CSP origins from environment config so the MCP App iframe
 * can load resources from presigned R2 URLs.
 *
 * NOTE: Claude.ai currently ignores these CSP fields (anthropics/claude-ai-mcp#40).
 * We still declare them so the app works correctly on hosts that do respect them
 * (ChatGPT, GitHub Copilot, MCP-Jam, etc.) and on Claude.ai once they fix the bug.
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
  // Returns recording detail + resource URLs + inline thumbnail data URI.
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
          resourceUri: APP_RESOURCE_URIS.preview,
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

      // Inline the thumbnail as a base64 data URI so the MCP App can
      // render it immediately without a separate fetch.
      // Thumbnails are small (~50-100KB) so this is fine to include in the result.
      const thumbnailDataUri = await fetchThumbnailDataUri(thumbnail.url, thumbnail.format ?? null);

      const dashboardUrl = `${env.dashboard.baseUrl}/workspace/${workspaceId}/recordings/${recordingId}`;

      return textResult({
        workspaceId,
        recording,
        resources: { video, thumbnail, consoleLog, networkLog, action },
        thumbnailDataUri,
        dashboardUrl,
      });
    }
  );

  // -----------------------------------------------------------------------
  // Private app-only tool: fetch log data via the server.
  // Workaround for Claude.ai CSP blocking connect-src to R2 domains
  // (anthropics/claude-ai-mcp#40). The MCP App calls this tool instead of
  // using fetch() directly, since postMessage bypasses CSP entirely.
  //
  // Only handles JSON log resources (console, network, actions).
  // Thumbnails are inlined in the main tool result. Video is not proxied —
  // the app links to the dashboard instead.
  // -----------------------------------------------------------------------
  server.registerTool(
    'userplane_app_fetch_resource',
    {
      description:
        'Fetch recording log data (console, network, or actions) and return its content.',
      inputSchema: {
        workspaceId: z.string().describe('Workspace ID'),
        recordingId: z.string().describe('Recording ID'),
        resourceType: z
          .enum(['consoleLog', 'networkLog', 'action'])
          .describe('Which log resource to fetch'),
      },
      annotations: EXTERNAL_RESOURCE_ANNOTATIONS,
      _meta: { visibility: ['app'] },
    },
    async ({ workspaceId, recordingId, resourceType }) => {
      await requireWorkspaceMember(deps, userId, workspaceId);

      const getters = {
        consoleLog: deps.recordingService.getConsoleLogResource.bind(deps.recordingService),
        networkLog: deps.recordingService.getNetworkLogResource.bind(deps.recordingService),
        action: deps.recordingService.getActionResource.bind(deps.recordingService),
      } as const;

      const resource = await getters[resourceType](recordingId, workspaceId);
      if (!resource.url) {
        return textResult({ error: 'Resource not available', resourceType });
      }

      let response: Response;
      try {
        response = await fetch(resource.url);
      } catch (err) {
        return textResult({ error: `Network error fetching resource: ${err}`, resourceType });
      }

      if (!response.ok) {
        return textResult({
          error: `Failed to fetch resource: HTTP ${response.status}`,
          resourceType,
        });
      }

      try {
        const json = await response.json();
        return textResult({ resourceType, json });
      } catch (err) {
        return textResult({ error: `Error parsing JSON: ${err}`, resourceType });
      }
    }
  );
}
