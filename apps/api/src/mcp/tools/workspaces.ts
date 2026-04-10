import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { userplaneGetWorkspace, userplaneListWorkspaces } from '@userplane/contract';

import { requireWorkspaceMember, textResult } from '../helpers';
import type { McpDeps } from '../types';

export function registerWorkspaceTools(server: McpServer, deps: McpDeps, userId: string) {
  {
    const { name, ...config } = userplaneListWorkspaces;
    server.registerTool(name, config, async ({ page, per_page }) => {
      const p = page ?? 1;
      const pp = per_page ?? 5;
      const { workspaces, total } = await deps.workspaceService.getByUserIdPaginated(userId, p, pp);
      return textResult({ workspaces, total, page: p, per_page: pp });
    });
  }

  {
    const { name, ...config } = userplaneGetWorkspace;
    server.registerTool(name, config, async ({ workspaceId }) => {
      const { workspace } = await requireWorkspaceMember(deps, userId, workspaceId);
      return textResult({ workspace });
    });
  }
}
