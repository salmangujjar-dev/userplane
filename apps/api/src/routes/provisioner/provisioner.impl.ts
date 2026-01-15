/**
 * Provisioner contract implementation using oRPC
 * Implements workspace creation and provisioning
 */

import { authorized } from '@/api/middleware/auth.orpc';
import type { ProvisionerService } from '@/api/services/provisioner.service';

/**
 * POST /workspace - Create a new workspace
 * Requires authentication
 */
export const createWorkspaceImpl = (provisionerService: ProvisionerService) => {
  return authorized.provisioner.createWorkspace.handler(async ({ input, context }) => {
    const result = await provisionerService.createWorkspace({
      url: input.body.url,
      userId: context.user.id,
      userName: context.user.name,
      userEmail: context.user.email,
    });

    return {
      message: 'Workspace created successfully',
      data: result,
    };
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
