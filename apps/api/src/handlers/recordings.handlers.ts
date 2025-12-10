/**
 * Recording handlers - HTTP request handlers for recording operations
 * Handles listing and deleting recordings
 */

import type { Context } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { RecordingService } from '@/api/services/recording.service';
import { getErrorStatusCode, ValidationError } from '@/api/lib/errors';
import type {
  ApiResponse,
  ApiErrorResponse,
  RecordingsListData,
  RecordingFilters,
  RecordingSortOptions,
  RecordingSortField,
  RecordingDetailData,
  RecordingResourceData,
} from '@/api/types';
import { createPaginationMeta } from '@/api/types';
import { z } from 'zod';

/**
 * Sortable fields for recordings
 */
const SORT_FIELDS = ['created_at', 'recording_duration'] as const;

/**
 * Sort directions
 */
const SORT_DIRECTIONS = ['asc', 'desc'] as const;

/**
 * Schema for recordings list query params
 * Validates pagination, filter, and sort parameters
 */
const listRecordingsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1, { message: 'Page must be at least 1' }),
  per_page: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1 && val <= 20, { message: 'Per page must be between 1 and 20' }),
  created_by: z.string().optional(),
  project_id: z.string().optional(),
  sort_by: z.enum(SORT_FIELDS).optional().default('created_at'),
  sort_direction: z.enum(SORT_DIRECTIONS).optional().default('desc'),
});

/**
 * Handler factory for listing recordings
 * Returns paginated recordings with optional filters
 */
export function getRecordingsHandler(recordingService: RecordingService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to access recordings',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to access recordings',
        };
        return c.json(response, 403);
      }

      // Parse and validate query params
      const queryParams = c.req.query();
      const parsed = listRecordingsQuerySchema.parse(queryParams);

      // Build filters object from query params
      const filters: RecordingFilters = {};

      if (parsed.created_by) {
        filters.createdBy = parsed.created_by;
      }

      if (parsed.project_id) {
        filters.projectId = parsed.project_id;
      }

      // Build sort options from query params
      const sort: RecordingSortOptions = {
        field: parsed.sort_by as RecordingSortField,
        direction: parsed.sort_direction as 'asc' | 'desc',
      };

      // Get paginated recordings with filters and sorting applied at DB level
      const { recordings, total } = await recordingService.getByWorkspaceIdPaginated(
        workspaceId,
        parsed.page,
        parsed.per_page,
        Object.keys(filters).length > 0 ? filters : undefined,
        sort
      );

      const response: ApiResponse<RecordingsListData> = {
        message: 'Recordings retrieved successfully',
        data: {
          workspaceId,
          recordings,
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
 * Handler factory for getting a recording by ID
 * Returns full recording details with presigned URLs
 */
export function getRecordingByIdHandler(recordingService: RecordingService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const recordingId = c.req.param('recordingId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to access recordings',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to access recordings',
        };
        return c.json(response, 403);
      }

      if (!recordingId) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Recording ID is required',
        };
        return c.json(response, 400);
      }

      // Get recording details
      const recording = await recordingService.getById(recordingId, workspaceId);

      const response: ApiResponse<RecordingDetailData> = {
        message: 'Recording retrieved successfully',
        data: {
          workspaceId,
          recording,
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

/**
 * Handler factory for deleting a recording
 * Performs soft delete on the recording
 */
export function deleteRecordingHandler(recordingService: RecordingService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const recordingId = c.req.param('recordingId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to delete recordings',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to delete recordings',
        };
        return c.json(response, 403);
      }

      if (!recordingId) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Recording ID is required',
        };
        return c.json(response, 400);
      }

      // Perform soft delete
      await recordingService.delete(recordingId, workspaceId);

      const response: ApiResponse<{ workspaceId: string; recordingId: string }> = {
        message: 'Recording deleted successfully',
        data: {
          workspaceId,
          recordingId,
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

/**
 * Generic handler for recording resource endpoints
 */
function createResourceHandler(
  recordingService: RecordingService,
  resourceFetcher: (
    service: RecordingService,
    recordingId: string,
    workspaceId: string
  ) => Promise<{ url: string | null; message: string }>,
  resourceName: string
) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const recordingId = c.req.param('recordingId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: `You must be logged in to access recording ${resourceName}`,
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: `You must be a workspace member to access recording ${resourceName}`,
        };
        return c.json(response, 403);
      }

      if (!recordingId) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Recording ID is required',
        };
        return c.json(response, 400);
      }

      const resource = await resourceFetcher(recordingService, recordingId, workspaceId);

      const response: ApiResponse<RecordingResourceData> = {
        message: resource.message,
        data: {
          recordingId,
          resource,
        },
      };

      return c.json(response, 200);
    } catch (error) {
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
 * Handler factory for getting recording media
 */
export function getRecordingMediaHandler(recordingService: RecordingService) {
  return createResourceHandler(
    recordingService,
    (service, recordingId, workspaceId) => service.getMediaResource(recordingId, workspaceId),
    'media'
  );
}

/**
 * Handler factory for getting recording thumbnail
 */
export function getRecordingThumbnailHandler(recordingService: RecordingService) {
  return createResourceHandler(
    recordingService,
    (service, recordingId, workspaceId) => service.getThumbnailResource(recordingId, workspaceId),
    'thumbnail'
  );
}

/**
 * Handler factory for getting recording console logs
 */
export function getRecordingConsoleLogHandler(recordingService: RecordingService) {
  return createResourceHandler(
    recordingService,
    (service, recordingId, workspaceId) => service.getConsoleLogResource(recordingId, workspaceId),
    'console log'
  );
}

/**
 * Handler factory for getting recording network logs
 */
export function getRecordingNetworkLogHandler(recordingService: RecordingService) {
  return createResourceHandler(
    recordingService,
    (service, recordingId, workspaceId) => service.getNetworkLogResource(recordingId, workspaceId),
    'network log'
  );
}
