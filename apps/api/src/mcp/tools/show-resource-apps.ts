import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  userplaneShowRecActions,
  userplaneShowRecConsole,
  userplaneShowRecNetwork,
} from '@userplane/contract';

import { APP_RESOURCE_URIS } from '../app-resources';
import { getRecordingStartTime, requireWorkspaceMember, textResult } from '../helpers';
import type { McpDeps } from '../types';

/**
 * Register focused MCP App tools for individual recording resources.
 *
 * Each tool returns lightweight recording metadata. The MCP App UI
 * then fetches the actual log data via `userplane_app_fetch_resource`
 * (registered by show-recording) to bypass Claude.ai's 25K token limit
 * on model-visible tool results.
 */
export function registerShowResourceAppTools(server: McpServer, deps: McpDeps, userId: string) {
  // Helper: fetch recording metadata and return the focused tool result
  async function handleFocusedTool(
    workspaceId: string,
    recordingId: string,
    resourceType: 'consoleLog' | 'networkLog' | 'action'
  ) {
    await requireWorkspaceMember(deps, userId, workspaceId);

    const recording = await deps.recordingService.getById(recordingId, workspaceId);
    const recordingStartTime = getRecordingStartTime(recording);

    // Check whether the specific resource was captured
    const resourceGetters = {
      consoleLog: deps.recordingService.getConsoleLogResource.bind(deps.recordingService),
      networkLog: deps.recordingService.getNetworkLogResource.bind(deps.recordingService),
      action: deps.recordingService.getActionResource.bind(deps.recordingService),
    } as const;

    const resource = await resourceGetters[resourceType](recordingId, workspaceId);

    return textResult({
      workspaceId,
      recordingId,
      recordingStartTime,
      resourceType,
      resourceAvailable: !!resource.url,
    });
  }

  // -----------------------------------------------------------------------
  // userplane_show_rec_console
  // -----------------------------------------------------------------------
  {
    const { title, description, inputSchema, annotations } = userplaneShowRecConsole;
    registerAppTool(
      server,
      userplaneShowRecConsole.name,
      {
        title,
        description,
        inputSchema,
        annotations,
        _meta: { ui: { resourceUri: APP_RESOURCE_URIS.console } },
      },
      async ({ workspaceId, recordingId }) =>
        handleFocusedTool(workspaceId, recordingId, 'consoleLog')
    );
  }

  // -----------------------------------------------------------------------
  // userplane_show_rec_network
  // -----------------------------------------------------------------------
  {
    const { title, description, inputSchema, annotations } = userplaneShowRecNetwork;
    registerAppTool(
      server,
      userplaneShowRecNetwork.name,
      {
        title,
        description,
        inputSchema,
        annotations,
        _meta: { ui: { resourceUri: APP_RESOURCE_URIS.network } },
      },
      async ({ workspaceId, recordingId }) =>
        handleFocusedTool(workspaceId, recordingId, 'networkLog')
    );
  }

  // -----------------------------------------------------------------------
  // userplane_show_rec_actions
  // -----------------------------------------------------------------------
  {
    const { title, description, inputSchema, annotations } = userplaneShowRecActions;
    registerAppTool(
      server,
      userplaneShowRecActions.name,
      {
        title,
        description,
        inputSchema,
        annotations,
        _meta: { ui: { resourceUri: APP_RESOURCE_URIS.actions } },
      },
      async ({ workspaceId, recordingId }) => handleFocusedTool(workspaceId, recordingId, 'action')
    );
  }
}
