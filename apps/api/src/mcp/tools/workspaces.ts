import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { userplaneGetWorkspace, userplaneListWorkspaces } from '@userplane/contract';

import { requireWorkspaceMemberForMcp, textResult } from '../helpers';
import { toMcpListWorkspaces, toMcpWorkspaceDetail } from '../responses';
import type { McpDeps } from '../types';

export function registerWorkspaceTools(server: McpServer, deps: McpDeps, userId: string) {
  {
    const { name, ...config } = userplaneListWorkspaces;
    server.registerTool(name, config, async ({ page, per_page }) => {
      const p = page ?? 1;
      const pp = per_page ?? 5;
      const { workspaces, total } = await deps.workspaceService.getByUserIdPaginatedForMcp(
        userId,
        p,
        pp
      );
      return textResult(toMcpListWorkspaces(workspaces, total));
    });
  }

  {
    const { name, ...config } = userplaneGetWorkspace;
    server.registerTool(name, config, async ({ workspaceId }) => {
      const { workspace } = await requireWorkspaceMemberForMcp(deps, userId, workspaceId);
      return textResult(toMcpWorkspaceDetail(workspace));
    });
  }
}
