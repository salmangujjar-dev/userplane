/**
 * Provisioner handlers - HTTP request handlers for workspace provisioning
 * Handles workspace creation and setup
 */

import type { Context } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import type { ApiResponse, ApiErrorResponse, WorkspaceCreateData } from '@/api/types';
import { ProvisionerService } from '@/api/services/provisioner.service';
import { z } from 'zod';
import { getErrorStatusCode } from '@/api/lib/errors';
import { createWorkspaceSchema } from '@/api/schema';

export function createWorkspaceHandler(provisionerService: ProvisionerService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');

      if (!user) {
        const response: ApiErrorResponse = {
          error: 'Unauthorized',
          message: 'You must be logged in to create a workspace',
        };
        return c.json(response, 401);
      }

      const body = await c.req.json();
      const { url } = createWorkspaceSchema.parse(body);

      const result = await provisionerService.createWorkspace({
        url,
        userId: user.id,
        userName: user.name,
      });

      const response: ApiResponse<WorkspaceCreateData> = {
        message: 'Workspace created successfully',
        data: result,
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
