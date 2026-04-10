/**
 * Link contract implementation using oRPC
 * Implements the link contract defined in @userplane/contract
 */

import { linkError } from '@userplane/contract';

import { authorizedRateLimited } from '@/api/middleware/rate-limit.orpc';
import { createWorkspaceMiddleware } from '@/api/middleware/workspace.orpc';
import type { LinkService } from '@/api/services/link.service';
import type { WorkspaceService } from '@/api/services/workspace.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import { createPaginationMeta, type LinkSortOptions } from '@/api/types';

/**
 * GET /workspace/:workspaceId/links - List links
 * Requires workspace member
 */
export const getLinksImpl = (
  linkService: LinkService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorizedRateLimited.link.list
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const filters = {
        createdBy: input.query.created_by,
        projectId: input.query.project_id,
        domainId: input.query.domain_id,
        linkProviderType: input.query.link_provider_type,
        linkType: input.query.link_type,
      };

      const sort: LinkSortOptions = {
        field: input.query.sort_by || 'created_at',
        direction: input.query.sort_direction || 'desc',
      };

      const { links, total } = await linkService.getByWorkspaceIdPaginated(
        input.params.workspaceId,
        input.query.page || 1,
        input.query.per_page || 10,
        filters,
        sort
      );

      return {
        message: 'Links retrieved successfully',
        data: {
          workspaceId: input.params.workspaceId,
          links,
          pagination: createPaginationMeta(
            input.query.page || 1,
            input.query.per_page || 10,
            total
          ),
        },
      };
    });
};

/**
 * POST /workspace/:workspaceId/links - Create link
 * Requires workspace member
 */
export const createLinkImpl = (
  linkService: LinkService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorizedRateLimited.link.create
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      const createdLink = await linkService.create({
        workspaceId: input.params.workspaceId,
        createdBy: context.workspaceMemberId,
        projectId: input.body.projectId,
        domainId: input.body.domainId,
        linkReference: input.body.linkReference,
        linkReusable: input.body.linkReusable,
        linkMeta: input.body.linkMeta,
      });

      const link = await linkService.getById(createdLink.linkId, input.params.workspaceId);

      return {
        message: 'Link created successfully',
        data: {
          workspaceId: input.params.workspaceId,
          link,
        },
      };
    });
};

/**
 * GET /workspace/:workspaceId/links/:linkId - Get link by ID
 * Requires workspace member
 */
export const getLinkByIdImpl = (
  linkService: LinkService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorizedRateLimited.link.getById
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const link = await linkService.getById(input.params.linkId, input.params.workspaceId);

      return {
        message: 'Link retrieved successfully',
        data: {
          workspaceId: input.params.workspaceId,
          link,
        },
      };
    });
};

/**
 * PUT /workspace/:workspaceId/links/:linkId - Update link
 * Requires workspace member
 */
export const updateLinkImpl = (
  linkService: LinkService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorizedRateLimited.link.update
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      await linkService.update(input.params.linkId, input.params.workspaceId, {
        linkTitle: input.body.linkTitle,
        linkReusable: input.body.linkReusable,
        linkProviderType: input.body.linkProviderType,
        linkProviderId: input.body.linkProviderId,
        linkProviderRef: input.body.linkProviderRef,
        linkMeta: input.body.linkMeta,
      });

      const link = await linkService.getById(input.params.linkId, input.params.workspaceId);

      return {
        message: 'Link updated successfully',
        data: {
          workspaceId: input.params.workspaceId,
          link,
        },
      };
    });
};

/**
 * DELETE /workspace/:workspaceId/links/:linkId - Delete link
 * Requires workspace member with admin/owner role OR creator of the link
 */
export const deleteLinkImpl = (
  linkService: LinkService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorizedRateLimited.link.delete
    .use(requireMember, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      // Fetch link to check creator
      const link = await linkService.getById(input.params.linkId, input.params.workspaceId);

      // Check permission: admin/owner OR creator
      const isAdminOrOwner = context.workspaceRole === 'admin' || context.workspaceRole === 'owner';
      const isCreator = link.creator.workspaceMemberId === context.workspaceMemberId;

      if (!isAdminOrOwner && !isCreator) {
        throw linkError.LINK_DELETE_FORBIDDEN();
      }

      await linkService.delete(input.params.linkId, input.params.workspaceId);

      return {
        message: 'Link deleted successfully',
        data: {
          workspaceId: input.params.workspaceId,
          linkId: input.params.linkId,
        },
      };
    });
};

/**
 * Create the link procedures object
 */
export const createLinkProcedures = (
  linkService: LinkService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  return {
    list: getLinksImpl(linkService, workspaceMemberService, workspaceService),
    create: createLinkImpl(linkService, workspaceMemberService, workspaceService),
    getById: getLinkByIdImpl(linkService, workspaceMemberService, workspaceService),
    update: updateLinkImpl(linkService, workspaceMemberService, workspaceService),
    delete: deleteLinkImpl(linkService, workspaceMemberService, workspaceService),
  };
};
