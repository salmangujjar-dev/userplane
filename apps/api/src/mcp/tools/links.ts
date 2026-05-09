import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  userplaneCreateLink,
  userplaneGetLink,
  userplaneListLinks,
  userplaneUpdateLink,
} from '@userplane/contract';

import { requireWorkspaceMemberForMcp, textResult } from '../helpers';
import { toMcpLinkResponse, toMcpListLinks } from '../responses';
import { registerContractTool } from '../tool-registration';
import type { McpDeps } from '../types';

export function registerLinkTools(server: McpServer, deps: McpDeps, userId: string) {
  {
    const { name, ...config } = userplaneListLinks;
    registerContractTool(
      server,
      name,
      config,
      async ({ workspaceId, page, per_page, project_id, domain_id, created_by }) => {
        await requireWorkspaceMemberForMcp(deps, userId, workspaceId);
        const p = page ?? 1;
        const pp = per_page ?? 10;
        const { links, total } = await deps.linkService.getByWorkspaceIdPaginatedForMcp(
          workspaceId,
          p,
          pp,
          {
            projectId: project_id ? [project_id] : undefined,
            domainId: domain_id ? [domain_id] : undefined,
            createdBy: created_by ? [created_by] : undefined,
          },
          { field: 'created_at', direction: 'desc' }
        );
        return textResult(toMcpListLinks(workspaceId, links, total));
      }
    );
  }

  {
    const { name, ...config } = userplaneCreateLink;
    registerContractTool(
      server,
      name,
      config,
      async ({ workspaceId, domainId, projectId, linkReference, linkReusable, linkMeta }) => {
        const { member } = await requireWorkspaceMemberForMcp(deps, userId, workspaceId);
        const createdLink = await deps.linkService.create({
          workspaceId,
          createdBy: member.workspaceMemberId,
          domainId,
          projectId,
          linkReference,
          linkReusable,
          linkMeta,
        });
        const link = await deps.linkService.getByIdForMcp(createdLink.linkId, workspaceId);
        return textResult(toMcpLinkResponse(workspaceId, link));
      }
    );
  }

  {
    const { name, ...config } = userplaneGetLink;
    registerContractTool(server, name, config, async ({ workspaceId, linkId }) => {
      await requireWorkspaceMemberForMcp(deps, userId, workspaceId);
      const link = await deps.linkService.getByIdForMcp(linkId, workspaceId);
      return textResult(toMcpLinkResponse(workspaceId, link));
    });
  }

  {
    const { name, ...config } = userplaneUpdateLink;
    registerContractTool(
      server,
      name,
      config,
      async ({
        workspaceId,
        linkId,
        linkTitle,
        linkReusable,
        linkProviderType,
        linkProviderId,
        linkProviderRef,
        linkMeta,
      }) => {
        await requireWorkspaceMemberForMcp(deps, userId, workspaceId);
        await deps.linkService.update(linkId, workspaceId, {
          linkTitle,
          linkReusable,
          linkProviderType: linkProviderType as Parameters<
            typeof deps.linkService.update
          >[2]['linkProviderType'],
          linkProviderId,
          linkProviderRef,
          linkMeta,
        });
        const link = await deps.linkService.getByIdForMcp(linkId, workspaceId);
        return textResult(toMcpLinkResponse(workspaceId, link));
      }
    );
  }
}
