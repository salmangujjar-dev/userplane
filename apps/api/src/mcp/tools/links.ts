import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  userplaneCreateLink,
  userplaneDeleteLink,
  userplaneGetLink,
  userplaneListLinks,
  userplaneUpdateLink,
} from '@userplane/contract';

import { requireWorkspaceMember, textResult } from '../helpers';
import type { McpDeps } from '../types';

export function registerLinkTools(server: McpServer, deps: McpDeps, userId: string) {
  {
    const { name, ...config } = userplaneListLinks;
    server.registerTool(
      name,
      config,
      async ({ workspaceId, page, per_page, project_id, domain_id, created_by }) => {
        await requireWorkspaceMember(deps, userId, workspaceId);
        const p = page ?? 1;
        const pp = per_page ?? 10;
        const { links, total } = await deps.linkService.getByWorkspaceIdPaginated(
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
        return textResult({ workspaceId, links, total, page: p, per_page: pp });
      }
    );
  }

  {
    const { name, ...config } = userplaneCreateLink;
    server.registerTool(
      name,
      config,
      async ({ workspaceId, domainId, projectId, linkReference, linkReusable, linkMeta }) => {
        const { member } = await requireWorkspaceMember(deps, userId, workspaceId);
        const createdLink = await deps.linkService.create({
          workspaceId,
          createdBy: member.workspaceMemberId,
          domainId,
          projectId,
          linkReference,
          linkReusable,
          linkMeta,
        });
        const link = await deps.linkService.getById(createdLink.linkId, workspaceId);
        return textResult({ workspaceId, link });
      }
    );
  }

  {
    const { name, ...config } = userplaneGetLink;
    server.registerTool(name, config, async ({ workspaceId, linkId }) => {
      await requireWorkspaceMember(deps, userId, workspaceId);
      const link = await deps.linkService.getById(linkId, workspaceId);
      return textResult({ workspaceId, link });
    });
  }

  {
    const { name, ...config } = userplaneUpdateLink;
    server.registerTool(
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
        await requireWorkspaceMember(deps, userId, workspaceId);
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
        const link = await deps.linkService.getById(linkId, workspaceId);
        return textResult({ workspaceId, link });
      }
    );
  }

  {
    const { name, ...config } = userplaneDeleteLink;
    server.registerTool(name, config, async ({ workspaceId, linkId }) => {
      const { member } = await requireWorkspaceMember(deps, userId, workspaceId);
      const link = await deps.linkService.getById(linkId, workspaceId);
      const isAdminOrOwner = member.workspaceRole === 'admin' || member.workspaceRole === 'owner';
      const isCreator = link.creator.workspaceMemberId === member.workspaceMemberId;
      if (!isAdminOrOwner && !isCreator) {
        throw new Error('You do not have permission to delete this link.');
      }
      await deps.linkService.delete(linkId, workspaceId);
      return textResult({ deleted: true, workspaceId, linkId });
    });
  }
}
