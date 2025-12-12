/**
 * Link handlers - HTTP request handlers for link operations
 * Handles listing, creating, and updating links
 */

import type { Context } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { LinkService } from '@/api/services/link.service';
import { getErrorStatusCode, ValidationError } from '@/api/lib/errors';
import type {
  ApiResponse,
  ApiErrorResponse,
  LinksListData,
  LinkCreateData,
  LinkUpdateData,
  LinkFilters,
  LinkSortOptions,
  LinkSortField,
  SortDirection,
  LinkProviderType,
  LinkType,
} from '@/api/types';
import { createPaginationMeta } from '@/api/types';
import { z } from 'zod';
import {
  listLinksQuerySchema,
  createLinkSchema,
  updateLinkSchema,
  LINK_SORT_FIELDS,
} from '@/api/schema';

/**
 * Handler factory for listing links
 * Returns paginated links with optional filters
 */
export function getLinksHandler(linkService: LinkService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to access links',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to access links',
        };
        return c.json(response, 403);
      }

      // Parse and validate query params
      const queryParams = c.req.query();
      const parsed = listLinksQuerySchema.parse(queryParams);

      // Build filters object from query params
      const filters: LinkFilters = {};

      if (parsed.created_by) {
        filters.createdBy = parsed.created_by;
      }

      if (parsed.project_id) {
        filters.projectId = parsed.project_id;
      }

      if (parsed.domain_id) {
        filters.domainId = parsed.domain_id;
      }

      if (parsed.link_provider_type) {
        filters.linkProviderType = parsed.link_provider_type as LinkProviderType;
      }

      // NOT DOCUMENTED - Reserved for future use. Only 'recording' is currently supported
      if (parsed.link_type) {
        filters.linkType = parsed.link_type as LinkType;
      }

      // Build sort options from query params
      const sort: LinkSortOptions = {
        field: parsed.sort_by as LinkSortField,
        direction: parsed.sort_direction as SortDirection,
      };

      // Get paginated links with filters and sorting applied at DB level
      const { links, total } = await linkService.getByWorkspaceIdPaginated(
        workspaceId,
        parsed.page,
        parsed.per_page,
        Object.keys(filters).length > 0 ? filters : undefined,
        sort
      );

      const response: ApiResponse<LinksListData> = {
        message: 'Links retrieved successfully',
        data: {
          workspaceId,
          links,
          pagination: createPaginationMeta(parsed.page, parsed.per_page, total),
        },
      };

      return c.json(response, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Invalid request parameters',
          details: error.errors,
        };
        return c.json(response, 400);
      }

      if (error instanceof ValidationError) {
        const response: ApiErrorResponse = {
          error: 'Validation Error',
          message: error.message,
        };
        return c.json(response, 400);
      }

      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

/**
 * Handler factory for creating a link
 * Parses linkReference to infer provider type, ID, and generate title
 */
export function createLinkHandler(linkService: LinkService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const workspaceMemberId = c.get('workspaceMemberId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to create links',
        };
        return c.json(response, 401);
      }

      if (!workspaceId || !workspaceMemberId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to create links',
        };
        return c.json(response, 403);
      }

      // Parse and validate request body
      const body = await c.req.json();
      const parsed = createLinkSchema.parse(body);

      // Create the link
      const created = await linkService.create({
        workspaceId,
        projectId: parsed.projectId,
        domainId: parsed.domainId,
        createdBy: workspaceMemberId,
        linkReference: parsed.linkReference,
        linkReusable: parsed.linkReusable,
      });

      if (!created) {
        const response: ApiErrorResponse = {
          error: 'Internal Server Error',
          message: 'Failed to create link',
        };
        return c.json(response, 500);
      }

      const response: ApiResponse<LinkCreateData> = {
        message: 'Link created successfully',
        data: {
          workspaceId,
          link: {
            id: created.id,
            linkTitle: created.linkTitle,
            linkType: created.linkType,
            linkReusable: created.linkReusable,
            linkProviderType: created.linkProviderType,
            linkProviderId: created.linkProviderId,
            linkProviderReference: created.linkProviderRef,
            createdAt: created.createdAt,
          },
        },
      };

      return c.json(response, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Invalid request body',
          details: error.errors,
        };
        return c.json(response, 400);
      }

      if (error instanceof ValidationError) {
        const response: ApiErrorResponse = {
          error: 'Validation Error',
          message: error.message,
        };
        return c.json(response, 400);
      }

      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

/**
 * Handler factory for updating a link
 * Updates title, reusable flag, and provider info
 */
export function updateLinkHandler(linkService: LinkService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const linkId = c.req.param('linkId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to update links',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to update links',
        };
        return c.json(response, 403);
      }

      if (!linkId) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Link ID is required',
        };
        return c.json(response, 400);
      }

      // Parse and validate request body
      const body = await c.req.json();
      const parsed = updateLinkSchema.parse(body);

      // Check if at least one field is being updated
      if (
        parsed.linkTitle === undefined &&
        parsed.linkReusable === undefined &&
        parsed.linkProviderType === undefined &&
        parsed.linkProviderId === undefined &&
        parsed.linkProviderRef === undefined
      ) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'At least one field must be provided for update',
        };
        return c.json(response, 400);
      }

      // Perform update
      const updated = await linkService.update(linkId, workspaceId, {
        linkTitle: parsed.linkTitle,
        linkReusable: parsed.linkReusable,
        linkProviderType: parsed.linkProviderType,
        linkProviderId: parsed.linkProviderId,
        linkProviderRef: parsed.linkProviderRef,
      });

      const response: ApiResponse<LinkUpdateData> = {
        message: 'Link updated successfully',
        data: {
          workspaceId,
          link: {
            id: updated.id,
            linkTitle: updated.linkTitle,
            linkReusable: updated.linkReusable,
            linkProviderType: updated.linkProviderType,
            linkProviderId: updated.linkProviderId,
            linkProviderReference: updated.linkProviderRef,
          },
        },
      };

      return c.json(response, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Invalid request body',
          details: error.errors,
        };
        return c.json(response, 400);
      }

      if (error instanceof ValidationError) {
        const response: ApiErrorResponse = {
          error: 'Validation Error',
          message: error.message,
        };
        return c.json(response, 400);
      }

      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}

/**
 * Handler factory for deleting a link
 * Performs soft delete on the link
 */
export function deleteLinkHandler(linkService: LinkService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const linkId = c.req.param('linkId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to delete links',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to delete links',
        };
        return c.json(response, 403);
      }

      if (!linkId) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Link ID is required',
        };
        return c.json(response, 400);
      }

      // Perform soft delete
      await linkService.delete(linkId, workspaceId);

      const response: ApiResponse<{ workspaceId: string; linkId: string }> = {
        message: 'Link deleted successfully',
        data: {
          workspaceId,
          linkId,
        },
      };

      return c.json(response, 200);
    } catch (error) {
      if (error instanceof ValidationError) {
        const response: ApiErrorResponse = {
          error: 'Validation Error',
          message: error.message,
        };
        return c.json(response, 400);
      }

      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}
