import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  userplaneGetRecActions,
  userplaneGetRecConsole,
  userplaneGetRecNetwork,
  userplaneGetRecThumb,
  userplaneGetRecVideo,
} from '@userplane/contract';

import { requireWorkspaceMember, textResult } from '../helpers';
import type { McpDeps } from '../types';

export function registerRecordingResourceTools(server: McpServer, deps: McpDeps, userId: string) {
  {
    const { name, ...config } = userplaneGetRecVideo;
    server.registerTool(name, config, async ({ workspaceId, recordingId }) => {
      await requireWorkspaceMember(deps, userId, workspaceId);
      const resource = await deps.recordingService.getVideoResource(recordingId, workspaceId);
      return textResult({ recordingId, resource });
    });
  }

  {
    const { name, ...config } = userplaneGetRecThumb;
    server.registerTool(name, config, async ({ workspaceId, recordingId }) => {
      await requireWorkspaceMember(deps, userId, workspaceId);
      const resource = await deps.recordingService.getThumbnailResource(recordingId, workspaceId);
      return textResult({ recordingId, resource });
    });
  }

  {
    const { name, ...config } = userplaneGetRecConsole;
    server.registerTool(name, config, async ({ workspaceId, recordingId }) => {
      await requireWorkspaceMember(deps, userId, workspaceId);
      const resource = await deps.recordingService.getConsoleLogResource(recordingId, workspaceId);
      return textResult({ recordingId, resource });
    });
  }

  {
    const { name, ...config } = userplaneGetRecNetwork;
    server.registerTool(name, config, async ({ workspaceId, recordingId }) => {
      await requireWorkspaceMember(deps, userId, workspaceId);
      const resource = await deps.recordingService.getNetworkLogResource(recordingId, workspaceId);
      return textResult({ recordingId, resource });
    });
  }

  {
    const { name, ...config } = userplaneGetRecActions;
    server.registerTool(name, config, async ({ workspaceId, recordingId }) => {
      await requireWorkspaceMember(deps, userId, workspaceId);
      const resource = await deps.recordingService.getActionResource(recordingId, workspaceId);
      return textResult({ recordingId, resource });
    });
  }
}
