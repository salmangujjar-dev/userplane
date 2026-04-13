import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  userplaneGetRecActions,
  userplaneGetRecConsole,
  userplaneGetRecInfo,
  userplaneGetRecNetwork,
  userplaneGetRecThumb,
  userplaneGetRecVideo,
} from '@userplane/contract';

import { requireWorkspaceMemberForMcp, textResult } from '../helpers';
import { toMcpRecordingDetail, toMcpRecThumb, toMcpRecVideo } from '../responses';
import type { McpDeps } from '../types';

/**
 * Fetch log resource data server-side. Returns the parsed JSON array,
 * or an empty array if the resource is unavailable or the fetch fails.
 */
async function fetchResourceData(
  deps: McpDeps,
  recordingId: string,
  workspaceId: string,
  resourceType: 'consoleLog' | 'networkLog' | 'action'
): Promise<unknown[]> {
  const getters = {
    consoleLog: deps.recordingService.getConsoleLogResource.bind(deps.recordingService),
    networkLog: deps.recordingService.getNetworkLogResource.bind(deps.recordingService),
    action: deps.recordingService.getActionResource.bind(deps.recordingService),
  } as const;

  const resource = await getters[resourceType](recordingId, workspaceId);
  if (!resource.url) return [];

  try {
    const response = await fetch(resource.url);
    if (!response.ok) return [];
    const json = await response.json();
    return Array.isArray(json) ? json : [];
  } catch {
    return [];
  }
}

export function registerRecordingResourceTools(server: McpServer, deps: McpDeps, userId: string) {
  // -----------------------------------------------------------------------
  // userplane_get_rec_info — recording metadata
  // -----------------------------------------------------------------------
  {
    const { name, ...config } = userplaneGetRecInfo;
    server.registerTool(name, config, async ({ workspaceId, recordingId }) => {
      await requireWorkspaceMemberForMcp(deps, userId, workspaceId);
      const recording = await deps.recordingService.getByIdForMcp(recordingId, workspaceId);
      return textResult(toMcpRecordingDetail(workspaceId, recording));
    });
  }

  // -----------------------------------------------------------------------
  // userplane_get_rec_video — presigned URL for video file
  // -----------------------------------------------------------------------
  {
    const { name, ...config } = userplaneGetRecVideo;
    server.registerTool(name, config, async ({ workspaceId, recordingId }) => {
      await requireWorkspaceMemberForMcp(deps, userId, workspaceId);
      const resource = await deps.recordingService.getVideoResource(recordingId, workspaceId);
      return textResult(toMcpRecVideo(recordingId, resource));
    });
  }

  // -----------------------------------------------------------------------
  // userplane_get_rec_thumb — presigned URL for thumbnail image
  // -----------------------------------------------------------------------
  {
    const { name, ...config } = userplaneGetRecThumb;
    server.registerTool(name, config, async ({ workspaceId, recordingId }) => {
      await requireWorkspaceMemberForMcp(deps, userId, workspaceId);
      const resource = await deps.recordingService.getThumbnailResource(recordingId, workspaceId);
      return textResult(toMcpRecThumb(recordingId, resource));
    });
  }

  // -----------------------------------------------------------------------
  // userplane_get_rec_console — browser console log entries
  //
  // Plain tool (no MCP App UI). Fetches data server-side and returns the
  // log entries directly to Claude for analysis.
  // -----------------------------------------------------------------------
  {
    const { name, ...config } = userplaneGetRecConsole;
    server.registerTool(name, config, async ({ workspaceId, recordingId }) => {
      await requireWorkspaceMemberForMcp(deps, userId, workspaceId);
      const entries = await fetchResourceData(deps, recordingId, workspaceId, 'consoleLog');
      return textResult({ recordingId, entries });
    });
  }

  // -----------------------------------------------------------------------
  // userplane_get_rec_network — network request/response log entries
  // -----------------------------------------------------------------------
  {
    const { name, ...config } = userplaneGetRecNetwork;
    server.registerTool(name, config, async ({ workspaceId, recordingId }) => {
      await requireWorkspaceMemberForMcp(deps, userId, workspaceId);
      const entries = await fetchResourceData(deps, recordingId, workspaceId, 'networkLog');
      return textResult({ recordingId, entries });
    });
  }

  // -----------------------------------------------------------------------
  // userplane_get_rec_actions — user interaction events
  // -----------------------------------------------------------------------
  {
    const { name, ...config } = userplaneGetRecActions;
    server.registerTool(name, config, async ({ workspaceId, recordingId }) => {
      await requireWorkspaceMemberForMcp(deps, userId, workspaceId);
      const entries = await fetchResourceData(deps, recordingId, workspaceId, 'action');
      return textResult({ recordingId, entries });
    });
  }
}
