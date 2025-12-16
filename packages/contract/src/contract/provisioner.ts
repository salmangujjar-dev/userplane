import { oc } from '@orpc/contract';
import { CreateWorkspaceSchema, WorkspaceCreateDataSchema, ApiResponseSchema } from '../schemas';

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
    summary: 'Create workspace',
    description: 'Provision a new workspace with initial domain and project',
    tags: ['Provisioner'],
  })
  .input(CreateWorkspaceSchema)
  .output(ApiResponseSchema(WorkspaceCreateDataSchema));
