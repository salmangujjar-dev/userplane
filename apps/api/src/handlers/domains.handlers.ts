/**
 * Domain handlers - HTTP request handlers for domain operations
 * Handles domain verification and management
 */

import type { Context } from 'hono';
import { z } from 'zod';
import type { AppEnv } from '@/api/lib/types';
import { DomainService } from '@/api/services/domain.service';
import { getErrorStatusCode, ValidationError } from '@/api/lib/errors';
import type {
  ApiResponse,
  ApiErrorResponse,
  DomainVerificationData,
  DomainRecordingPreferencesData,
  DomainRecordingPreferencesUpdateData,
} from '@/api/types';
import { verifyDomainSchema, updateDomainRecordingPreferencesSchema } from '@/api/schema';

/**
 * Handler for domain verification endpoint
 * Validates JWT token from recorder script and marks domain as verified
 */
export function verifyDomainHandler(domainService: DomainService) {
  return async (c: Context<AppEnv>) => {
    try {
      // Check Origin header
      const origin = c.req.header('Origin');
      if (!origin) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Origin header is required',
        };
        return c.json(response, 400);
      }

      // Extract hostname from origin
      let originHostname: string;
      try {
        const originUrl = new URL(origin);
        originHostname = originUrl.hostname;
      } catch {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Invalid Origin header',
        };
        return c.json(response, 400);
      }

      // Parse and validate request body
      const body = await c.req.json();
      const validation = verifyDomainSchema.safeParse(body);

      if (!validation.success) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Verification token is required',
        };
        return c.json(response, 400);
      }

      const { token } = validation.data;

      // Verify domain
      const domain = await domainService.verifyDomain(token, originHostname);

      const response: ApiResponse<DomainVerificationData> = {
        message: 'Domain verified successfully',
        data: {
          domainStatus: domain.domainStatus,
          workspaceId: domain.workspaceId,
          domainId: domain.id,
          domainUrl: domain.domainUrl,
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
 * Handler for getting domain recording preferences
 * Returns the recording toggle settings for a specific domain
 */
export function getDomainRecordingPreferencesHandler(domainService: DomainService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const domainId = c.req.param('domainId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to view domain preferences',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to view domain preferences',
        };
        return c.json(response, 403);
      }

      if (!domainId) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Domain ID is required',
        };
        return c.json(response, 400);
      }

      const domain = await domainService.getByIdWithPreferences(domainId, workspaceId);

      const response: ApiResponse<DomainRecordingPreferencesData> = {
        message: 'Domain recording preferences retrieved successfully',
        data: {
          domainId: domain.id,
          workspaceId: domain.workspaceId,
          recordingHideSensitive: domain.recordingHideSensitive,
          recordingCaptureClientLog: domain.recordingCaptureClientLog,
          recordingCaptureServerLog: domain.recordingCaptureServerLog,
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
 * Handler for updating domain recording preferences (PATCH)
 * Partially updates the recording toggle settings for a specific domain
 * Only allows updates if domain is verified
 */
export function updateDomainRecordingPreferencesHandler(domainService: DomainService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const domainId = c.req.param('domainId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to update domain preferences',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to update domain preferences',
        };
        return c.json(response, 403);
      }

      if (!domainId) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Domain ID is required',
        };
        return c.json(response, 400);
      }

      const body = await c.req.json();
      const updates = updateDomainRecordingPreferencesSchema.parse(body);

      await domainService.updateRecordingPreferences(domainId, workspaceId, updates);

      const response: ApiResponse<DomainRecordingPreferencesUpdateData> = {
        message: 'Domain recording preferences updated successfully',
        data: { domainId, workspaceId },
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
 * Handler for replacing domain recording preferences (PUT)
 * Replaces all recording toggle settings for a specific domain
 * Only allows updates if domain is verified
 * All fields are required
 */
export function replaceDomainRecordingPreferencesHandler(domainService: DomainService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');
      const workspaceId = c.get('workspaceId');
      const domainId = c.req.param('domainId');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to replace domain preferences',
        };
        return c.json(response, 401);
      }

      if (!workspaceId) {
        const response: ApiErrorResponse = {
          error: 'Forbidden',
          message: 'You must be a workspace member to replace domain preferences',
        };
        return c.json(response, 403);
      }

      if (!domainId) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Domain ID is required',
        };
        return c.json(response, 400);
      }

      const body = await c.req.json();

      // For PUT, all fields are required
      const replaceSchema = z.object({
        recordingHideSensitive: z.boolean(),
        recordingCaptureClientLog: z.boolean(),
        recordingCaptureServerLog: z.boolean(),
      });

      const preferences = replaceSchema.parse(body);

      await domainService.replaceRecordingPreferences(domainId, workspaceId, preferences);

      const response: ApiResponse<DomainRecordingPreferencesUpdateData> = {
        message: 'Domain recording preferences replaced successfully',
        data: { domainId, workspaceId },
      };

      return c.json(response, 200);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Invalid request body. All fields are required for PUT.',
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
