import { oc } from '@orpc/contract';
import {
  CreateWorkspaceSchema,
  WorkspaceCreateDataSchema,
  ApiResponseSchema,
  ProvisionerErrors,
} from '../schemas';

/**
 * Provisioner contract
 * Endpoints for workspace provisioning
 */

/**
 * POST /workspace
 * Create a new workspace
 */
export const createWorkspace = oc
  .route({
    method: 'POST',
    path: '/workspace',
    inputStructure: 'detailed',
    summary: 'Create workspace',
    description: 'Provision a new workspace with initial domain and project',
    tags: ['Provisioner'],
  })
  .errors({
    UNAUTHORIZED: ProvisionerErrors.UNAUTHORIZED,
    PROVISIONER_WORKSPACE_CREATE_FAILED: ProvisionerErrors.PROVISIONER_WORKSPACE_CREATE_FAILED,
    PROVISIONER_TRANSACTION_FAILED: ProvisionerErrors.PROVISIONER_TRANSACTION_FAILED,
  })
  .input(CreateWorkspaceSchema)
  .output(ApiResponseSchema(WorkspaceCreateDataSchema));
