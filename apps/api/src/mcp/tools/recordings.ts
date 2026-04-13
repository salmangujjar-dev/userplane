import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { userplaneListRecordings } from '@userplane/contract';

import { requireWorkspaceMemberForMcp, textResult } from '../helpers';
import { toMcpListRecordings } from '../responses';
import type { McpDeps } from '../types';

export function registerRecordingTools(server: McpServer, deps: McpDeps, userId: string) {
  const { name, ...config } = userplaneListRecordings;
  server.registerTool(
    name,
    config,
    async ({ workspaceId, page, per_page, project_id, link_id, created_by }) => {
      await requireWorkspaceMemberForMcp(deps, userId, workspaceId);
      const p = page ?? 1;
      const pp = per_page ?? 10;
      const { recordings, total } = await deps.recordingService.getByWorkspaceIdPaginatedForMcp(
        workspaceId,
        p,
        pp,
        {
          projectId: project_id ? [project_id] : undefined,
          linkId: link_id ? [link_id] : undefined,
          createdBy: created_by ? [created_by] : undefined,
        },
        { field: 'created_at', direction: 'desc' }
      );
      return textResult(toMcpListRecordings(workspaceId, recordings, total));
    }
  );
}
