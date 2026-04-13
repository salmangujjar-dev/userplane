import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { userplaneGetDomain, userplaneListDomains } from '@userplane/contract';

import { requireWorkspaceMemberForMcp, textResult } from '../helpers';
import { toMcpDomainDetail, toMcpListDomains } from '../responses';
import type { McpDeps } from '../types';

export function registerDomainTools(server: McpServer, deps: McpDeps, userId: string) {
  {
    const { name, ...config } = userplaneListDomains;
    server.registerTool(name, config, async ({ workspaceId, page, per_page, status }) => {
      await requireWorkspaceMemberForMcp(deps, userId, workspaceId);
      const p = page ?? 1;
      const pp = per_page ?? 10;
      const { domains, total } = await deps.domainService.getByWorkspaceIdPaginatedForMcp(
        workspaceId,
        p,
        pp,
        status ? { status } : undefined
      );
      return textResult(toMcpListDomains(workspaceId, domains, total));
    });
  }

  {
    const { name, ...config } = userplaneGetDomain;
    server.registerTool(name, config, async ({ workspaceId, domainId }) => {
      await requireWorkspaceMemberForMcp(deps, userId, workspaceId);
      const domain = await deps.domainService.getByIdForMcp(domainId, workspaceId);
      return textResult(toMcpDomainDetail(workspaceId, domain));
    });
  }
}
