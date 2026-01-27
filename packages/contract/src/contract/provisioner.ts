import { oc } from '@orpc/contract';
import { z } from 'zod';

import {
  ApiResponseSchema,
  CreateWorkspaceSchema,
  IntercomAuthorizeResponseSchema,
  IntercomCallbackQuerySchema,
  ProvisionerErrors,
  WorkspaceCreateDataSchema,
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
    PROVISIONER_INVITE_TOKEN_INVALID: ProvisionerErrors.PROVISIONER_INVITE_TOKEN_INVALID,
    PROVISIONER_WORKSPACE_EXISTS: ProvisionerErrors.PROVISIONER_WORKSPACE_EXISTS,
    PROVISIONER_URL_REQUIRED: ProvisionerErrors.PROVISIONER_URL_REQUIRED,
  })
  .input(CreateWorkspaceSchema)
  .output(ApiResponseSchema(WorkspaceCreateDataSchema));

/**
 * GET /provisioner/intercom/authorize
 * Initiate Intercom OAuth flow
 */
export const intercomAuthorize = oc
  .route({
    method: 'GET',
    path: '/provisioner/intercom/authorize',
    summary: 'Initiate Intercom OAuth',
    description: 'Generate Intercom OAuth authorization URL with CSRF state token',
    tags: ['Provisioner', 'Intercom'],
  })
  .errors({
    UNAUTHORIZED: ProvisionerErrors.UNAUTHORIZED,
  })
  .input(z.object({}))
  .output(ApiResponseSchema(IntercomAuthorizeResponseSchema));

/**
 * GET /provisioner/intercom/callback
 * Handle Intercom OAuth callback
 */
export const intercomCallback = oc
  .route({
    method: 'GET',
    path: '/provisioner/intercom/callback',
    inputStructure: 'detailed',
    summary: 'Handle Intercom OAuth callback',
    description: 'Exchange authorization code for access token and create workspace',
    tags: ['Provisioner', 'Intercom'],
  })
  .errors({
    UNAUTHORIZED: ProvisionerErrors.UNAUTHORIZED,
    INTERCOM_OAUTH_STATE_INVALID: ProvisionerErrors.INTERCOM_OAUTH_STATE_INVALID,
    INTERCOM_OAUTH_CODE_MISSING: ProvisionerErrors.INTERCOM_OAUTH_CODE_MISSING,
    INTERCOM_TOKEN_EXCHANGE_FAILED: ProvisionerErrors.INTERCOM_TOKEN_EXCHANGE_FAILED,
    INTERCOM_USER_INFO_FAILED: ProvisionerErrors.INTERCOM_USER_INFO_FAILED,
    INTERCOM_WORKSPACE_ALREADY_CONNECTED: ProvisionerErrors.INTERCOM_WORKSPACE_ALREADY_CONNECTED,
    INTERCOM_EMAIL_NOT_VERIFIED: ProvisionerErrors.INTERCOM_EMAIL_NOT_VERIFIED,
    PROVISIONER_WORKSPACE_CREATE_FAILED: ProvisionerErrors.PROVISIONER_WORKSPACE_CREATE_FAILED,
    PROVISIONER_TRANSACTION_FAILED: ProvisionerErrors.PROVISIONER_TRANSACTION_FAILED,
    WORKSPACE_CREATION_LIMIT_EXCEEDED: ProvisionerErrors.WORKSPACE_CREATION_LIMIT_EXCEEDED,
  })
  .input(z.object({ query: IntercomCallbackQuerySchema }))
  .output(ApiResponseSchema(WorkspaceCreateDataSchema));
