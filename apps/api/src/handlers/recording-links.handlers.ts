/**
 * Recording link handlers - HTTP request handlers for recording link operations
 * Handles listing, creating, and updating recording links
 */

import type { Context } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { RecordingLinkService } from '@/api/services/recording-link.service';
import { getErrorStatusCode, ValidationError } from '@/api/lib/errors';
import type {
  ApiResponse,
  ApiErrorResponse,
  RecordingLinksListData,
  RecordingLinkCreateData,
  RecordingLinkUpdateData,
  RecordingLinkFilters,
  RecordingLinkSortOptions,
  RecordingLinkSortField,
  SortDirection,
  LinkProviderType,
} from '@/api/types';
import { createPaginationMeta } from '@/api/types';
import { z } from 'zod';
import {
  listRecordingLinksQuerySchema,
  createRecordingLinkSchema,
  updateRecordingLinkSchema,
  RECORDING_LINK_SORT_FIELDS,
} from '@/api/schema';

/**
 * Handler factory for listing recording links
 * Returns paginated recording links with optional filters
 */
export function getRecordingLinksHandler(recordingLinkService: RecordingLinkService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to access recording links',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to access recording links',
        };
        return c.json(response, 403);
      }

      // Parse and validate query params
      const queryParams = c.req.query();
      const parsed = listRecordingLinksQuerySchema.parse(queryParams);

      // Build filters object from query params
      const filters: RecordingLinkFilters = {};

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

      // Build sort options from query params
      const sort: RecordingLinkSortOptions = {
        field: parsed.sort_by as RecordingLinkSortField,
        direction: parsed.sort_direction as SortDirection,
      };

      // Get paginated recording links with filters and sorting applied at DB level
      const { recordingLinks, total } = await recordingLinkService.getByWorkspaceIdPaginated(
        workspaceId,
        parsed.page,
        parsed.per_page,
        Object.keys(filters).length > 0 ? filters : undefined,
        sort
      );

      const response: ApiResponse<RecordingLinksListData> = {
        message: 'Recording links retrieved successfully',
        data: {
          workspaceId,
          recordingLinks,
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
 * Handler factory for creating a recording link
 * Parses linkReference to infer provider type, ID, and generate title
 */
export function createRecordingLinkHandler(recordingLinkService: RecordingLinkService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const workspaceMemberId = c.get('workspaceMemberId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to create recording links',
        };
        return c.json(response, 401);
      }

      if (!workspaceId || !workspaceMemberId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to create recording links',
        };
        return c.json(response, 403);
      }

      // Parse and validate request body
      const body = await c.req.json();
      const parsed = createRecordingLinkSchema.parse(body);

      // Create the recording link
      const created = await recordingLinkService.create({
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
          message: 'Failed to create recording link',
        };
        return c.json(response, 500);
      }

      const response: ApiResponse<RecordingLinkCreateData> = {
        message: 'Recording link created successfully',
        data: {
          workspaceId,
          recordingLink: {
            id: created.id,
            linkGUID: created.linkGUID,
            linkTitle: created.linkTitle,
            linkReusable: created.linkReusable,
            linkProvider: {
              type: created.linkProviderType,
              id: created.linkProviderId,
              reference: created.linkProviderRef,
            },
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
 * Handler factory for updating a recording link
 * Updates title, reusable flag, and provider info
 * Note: linkGUID is immutable and cannot be updated
 */
export function updateRecordingLinkHandler(recordingLinkService: RecordingLinkService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const recordingLinkId = c.req.param('recordingLinkId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to update recording links',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to update recording links',
        };
        return c.json(response, 403);
      }

      if (!recordingLinkId) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Recording link ID is required',
        };
        return c.json(response, 400);
      }

      // Parse and validate request body
      const body = await c.req.json();
      const parsed = updateRecordingLinkSchema.parse(body);

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
      const updated = await recordingLinkService.update(recordingLinkId, workspaceId, {
        linkTitle: parsed.linkTitle,
        linkReusable: parsed.linkReusable,
        linkProviderType: parsed.linkProviderType,
        linkProviderId: parsed.linkProviderId,
        linkProviderRef: parsed.linkProviderRef,
      });

      const response: ApiResponse<RecordingLinkUpdateData> = {
        message: 'Recording link updated successfully',
        data: {
          workspaceId,
          recordingLink: {
            id: updated.id,
            linkTitle: updated.linkTitle,
            linkReusable: updated.linkReusable,
            linkProvider: {
              type: updated.linkProviderType,
              id: updated.linkProviderId,
              reference: updated.linkProviderRef,
            },
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
 * Handler factory for deleting a recording link
 * Performs soft delete on the recording link
 */
export function deleteRecordingLinkHandler(recordingLinkService: RecordingLinkService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const recordingLinkId = c.req.param('recordingLinkId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to delete recording links',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to delete recording links',
        };
        return c.json(response, 403);
      }

      if (!recordingLinkId) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Recording link ID is required',
        };
        return c.json(response, 400);
      }

      // Perform soft delete
      await recordingLinkService.delete(recordingLinkId, workspaceId);

      const response: ApiResponse<{ workspaceId: string; recordingLinkId: string }> = {
        message: 'Recording link deleted successfully',
        data: {
          workspaceId,
          recordingLinkId,
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
