import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { userplaneGetProject, userplaneListProjects } from '@userplane/contract';

import { requireWorkspaceMember, textResult } from '../helpers';
import type { McpDeps } from '../types';

export function registerProjectTools(server: McpServer, deps: McpDeps, userId: string) {
  {
    const { name, ...config } = userplaneListProjects;
    server.registerTool(name, config, async ({ workspaceId, page, per_page }) => {
      await requireWorkspaceMember(deps, userId, workspaceId);
      const p = page ?? 1;
      const pp = per_page ?? 5;
      const { projects, total } = await deps.projectService.getProjectsByWorkspacePaginated(
        workspaceId,
        p,
        pp,
        'created_at',
        'desc'
      );
      return textResult({ workspaceId, projects, total, page: p, per_page: pp });
    });
  }

  {
    const { name, ...config } = userplaneGetProject;
    server.registerTool(name, config, async ({ workspaceId, projectId }) => {
      await requireWorkspaceMember(deps, userId, workspaceId);
      const project = await deps.projectService.getById(projectId);
      return textResult({ workspaceId, project });
    });
  }
}
