/**
 * Link contract implementation using oRPC
 * Implements the link contract defined in @workspace/contract
 */

import { ORPCError } from '@orpc/server';
import { authorized } from '@/api/middleware/auth.orpc';
import { createWorkspaceMiddleware } from '@/api/middleware/workspace.orpc';
import type { LinkService } from '@/api/services/link.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import type { WorkspaceService } from '@/api/services/workspace.service';
import { z } from 'zod';
import { ValidationError, NotFoundError, GoneError } from '@/api/lib/errors';
import { createPaginationMeta } from '@/api/types';

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

  return authorized.link.list
    .use(requireMember, (input) => ({ workspaceId: input.workspaceId }))
    .handler(async ({ input }) => {
      try {
        const filters = {
          createdBy: input.created_by,
          projectId: input.project_id,
          domainId: input.domain_id,
          linkProviderType: input.link_provider_type,
          linkType: input.link_type,
        };

        const sort = {
          field: input.sort_by || 'created_at',
          direction: input.sort_direction || 'desc',
        };

        const { links, total } = await linkService.getByWorkspaceIdPaginated(
          input.workspaceId,
          input.page || 1,
          input.per_page || 10,
          filters,
          sort as any
        );

        return {
          message: 'Links retrieved successfully',
          data: {
            workspaceId: input.workspaceId,
            links,
            pagination: createPaginationMeta(input.page || 1, input.per_page || 10, total),
          },
        };
      } catch (error) {
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
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

  return authorized.link.create
    .use(requireMember, (input) => ({ workspaceId: input.workspaceId }))
    .handler(async ({ input, context }) => {
      try {
        const createdLink = await linkService.create({
          workspaceId: input.workspaceId,
          createdBy: context.workspaceMemberId,
          projectId: input.projectId,
          domainId: input.domainId,
          linkReference: input.linkReference,
          linkReusable: input.linkReusable,
        });

        const link = await linkService.getById(createdLink.id, input.workspaceId);

        return {
          message: 'Link created successfully',
          data: {
            workspaceId: input.workspaceId,
            link,
          },
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ORPCError('BAD_REQUEST', {
            message: 'Invalid request body',
          });
        }
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
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

  return authorized.link.getById
    .use(requireMember, (input) => ({ workspaceId: input.workspaceId }))
    .handler(async ({ input }) => {
      try {
        const link = await linkService.getById(input.linkId, input.workspaceId);

        return {
          message: 'Link retrieved successfully',
          data: {
            workspaceId: input.workspaceId,
            link,
          },
        };
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof GoneError) {
          throw new ORPCError('GONE', {
            status: 410,
            message: error.message,
          });
        }
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
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

  return authorized.link.update
    .use(requireMember, (input) => ({ workspaceId: input.workspaceId }))
    .handler(async ({ input }) => {
      try {
        await linkService.update(input.linkId, input.workspaceId, {
          linkTitle: input.linkTitle,
          linkReusable: input.linkReusable,
          linkProviderType: input.linkProviderType,
          linkProviderId: input.linkProviderId,
          linkProviderRef: input.linkProviderRef,
        });

        const link = await linkService.getById(input.linkId, input.workspaceId);

        return {
          message: 'Link updated successfully',
          data: {
            workspaceId: input.workspaceId,
            link,
          },
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ORPCError('BAD_REQUEST', {
            message: 'Invalid request body',
          });
        }
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof GoneError) {
          throw new ORPCError('GONE', {
            status: 410,
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
    });
};

/**
 * DELETE /workspace/:workspaceId/links/:linkId - Delete link
 * Requires workspace member
 */
export const deleteLinkImpl = (
  linkService: LinkService,
  workspaceMemberService: WorkspaceMemberService,
  workspaceService: WorkspaceService
) => {
  const requireMember = createWorkspaceMiddleware(workspaceMemberService, workspaceService);

  return authorized.link.delete
    .use(requireMember, (input) => ({ workspaceId: input.workspaceId }))
    .handler(async ({ input, context }) => {
      try {
        await linkService.delete(input.linkId, input.workspaceId);

        return {
          message: 'Link deleted successfully',
          data: {
            workspaceId: input.workspaceId,
            linkId: input.linkId,
          },
        };
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new ORPCError('NOT_FOUND', {
            message: error.message,
          });
        }
        if (error instanceof GoneError) {
          throw new ORPCError('GONE', {
            status: 410,
            message: error.message,
          });
        }
        if (error instanceof ValidationError) {
          throw new ORPCError('BAD_REQUEST', {
            message: error.message,
          });
        }
        if (error instanceof Error) {
          throw new ORPCError('INTERNAL_SERVER_ERROR', {
            message: error.message,
          });
        }
        throw error;
      }
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
