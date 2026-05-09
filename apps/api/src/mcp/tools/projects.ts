import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { userplaneGetProject, userplaneListProjects } from '@userplane/contract';

import { requireWorkspaceMemberForMcp, textResult } from '../helpers';
import { toMcpListProjects, toMcpProjectDetail } from '../responses';
import { registerContractTool } from '../tool-registration';
import type { McpDeps } from '../types';

export function registerProjectTools(server: McpServer, deps: McpDeps, userId: string) {
  {
    const { name, ...config } = userplaneListProjects;
    registerContractTool(server, name, config, async ({ workspaceId, page, per_page }) => {
      await requireWorkspaceMemberForMcp(deps, userId, workspaceId);
      const p = page ?? 1;
      const pp = per_page ?? 5;
      const { projects, total } = await deps.projectService.getProjectsByWorkspacePaginatedForMcp(
        workspaceId,
        p,
        pp,
        'created_at',
        'desc'
      );
      return textResult(toMcpListProjects(workspaceId, projects, total));
    });
  }

  {
    const { name, ...config } = userplaneGetProject;
    registerContractTool(server, name, config, async ({ workspaceId, projectId }) => {
      await requireWorkspaceMemberForMcp(deps, userId, workspaceId);
      const project = await deps.projectService.getByIdForMcp(projectId, workspaceId);
      return textResult(toMcpProjectDetail(workspaceId, project));
    });
  }
}
