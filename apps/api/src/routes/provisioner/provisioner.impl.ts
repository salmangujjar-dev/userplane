/**
 * Provisioner contract implementation using oRPC
 * Implements workspace creation and provisioning
 */

import { ORPCError } from '@orpc/server';
import { authorized } from '@/api/middleware/auth.orpc';
import type { ProvisionerService } from '@/api/services/provisioner.service';
import { ValidationError, ConflictError } from '@/api/lib/errors';

/**
 * POST /workspace - Create a new workspace
 * Requires authentication
 */
export const createWorkspaceImpl = (provisionerService: ProvisionerService) => {
  return authorized.provisioner.createWorkspace.handler(async ({ input, context }) => {
    try {
      const result = await provisionerService.createWorkspace({
        url: input.body.url,
        userId: context.user.id,
        userName: context.user.name,
      });

      return {
        message: 'Workspace created successfully',
        data: result,
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ORPCError('BAD_REQUEST', {
          message: error.message,
        });
      }
      if (error instanceof ConflictError) {
        throw new ORPCError('CONFLICT', {
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
 * Create the provisioner procedures object
 */
export const createProvisionerProcedures = (provisionerService: ProvisionerService) => {
  return {
    createWorkspace: createWorkspaceImpl(provisionerService),
  };
};
