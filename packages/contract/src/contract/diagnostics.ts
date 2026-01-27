import { oc } from '@orpc/contract';
import { z } from 'zod';

import {
  ApiResponseSchema,
  ClearCachePayloadSchema,
  DiagnosticActionSchema,
  DiagnosticsDataSchema,
  WorkspaceErrors,
  WorkspaceIdSchema,
} from '../schemas';

/**
 * Diagnostics contract
 * Endpoints for workspace diagnostics and maintenance operations
 * All endpoints require workspace membership
 */

/**
 * Diagnostics input schema
 */
const DiagnosticsInputSchema = z.object({
  body: z.object({
    action: DiagnosticActionSchema,
    payload: ClearCachePayloadSchema,
  }),
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
});

/**
 * POST /workspace/:workspaceId/diagnostics
 * Execute diagnostic actions on a workspace
 */
export const runDiagnostics = oc
  .route({
    method: 'POST',
    path: '/workspace/{workspaceId}/diagnostics',
    inputStructure: 'detailed',
    summary: 'Run diagnostics action',
    description: 'Execute diagnostic and maintenance actions on a workspace',
    tags: ['Diagnostics'],
  })
  .errors({
    UNAUTHORIZED: WorkspaceErrors.UNAUTHORIZED,
    FORBIDDEN: WorkspaceErrors.FORBIDDEN,
    WORKSPACE_ID_REQUIRED: WorkspaceErrors.WORKSPACE_ID_REQUIRED,
    WORKSPACE_NOT_FOUND: WorkspaceErrors.WORKSPACE_NOT_FOUND,
  })
  .input(DiagnosticsInputSchema)
  .output(ApiResponseSchema(DiagnosticsDataSchema));
