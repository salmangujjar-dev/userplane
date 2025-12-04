/**
 * Provisioner handlers - HTTP request handlers for workspace provisioning
 * Handles workspace creation and setup
 */

import type { Context } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { ProvisionerService } from '@/api/services/provisioner.service';
import { urlSchema } from '@/api/lib/validation';
import { z } from 'zod';

export const createWorkspaceSchema = z.object({
  url: urlSchema,
});

export function createWorkspaceHandler(provisionerService: ProvisionerService) {
  return async (c: Context<AppEnv>) => {
    try {
      const user = c.get('user');

      if (!user) {
        return c.json(
          {
            error: 'Unauthorized',
            message: 'You must be logged in to create a workspace',
          },
          401
        );
      }

      const body = await c.req.json();
      const { url } = createWorkspaceSchema.parse(body);

      const result = await provisionerService.createWorkspace({
        url,
        userId: user.id,
        userName: user.name,
      });

      return c.json(result, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: 'Bad Request',
            message: 'Invalid request body',
            details: error.errors,
          },
          400
        );
      }

      if (error instanceof Error) {
        const statusCode = 'statusCode' in error ? (error.statusCode as number) : 500;
        return c.json(
          {
            error: error.name,
            message: error.message,
          },
          statusCode as 500
        );
      }

      return c.json(
        {
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        },
        500
      );
    }
  };
}
