/**
 * oRPC API Router
 *
 * Combines all contract implementations for the v2 API.
 * As endpoints are migrated from v1 to v2, their implementations are added here.
 *
 * Structure:
 * - Each domain has its own implementation file (e.g., session.impl.ts)
 * - Implementation files export procedure creators that accept service dependencies
 * - This router assembles all implementations with proper dependency injection
 *
 * Usage:
 * The router is mounted at /api/v2 with OpenAPIHandler to respect REST paths
 * defined in the contract (e.g., GET /api/v2/session)
 */

import { implement } from '@orpc/server';
import { contract } from '@workspace/contract';

// Services
import { sessionService } from '@/api/services';

// Implementations
import { createSessionProcedures } from './session/session.impl';

/**
 * Initial context type required by all procedures
 * This is injected by the OpenAPIHandler from the HTTP request
 */
export type InitialContext = {
  headers: Headers;
};

/**
 * Create the base implementer with initial context
 * All implementations must use this to ensure consistent context handling
 */
const os = implement(contract).$context<InitialContext>();

/**
 * Implemented procedures
 * Add new implementations here as endpoints are migrated to v2
 */
const sessionProcedures = createSessionProcedures(sessionService);

/**
 * Partial router export
 *
 * Currently includes:
 * - session: Session initialization and upload management
 *
 * Pending implementation:
 * - status: API info and health check
 * - account: User account management
 * - provisioner: Workspace creation
 * - workspace: Workspace management, members, domains, settings
 * - invite: Workspace invitations
 * - project: Project management
 * - link: Recording link management
 * - recording: Recording management and resources
 * - domain: Domain verification
 *
 * Note: This is a partial implementation. The full contract includes all endpoints
 * but only implemented procedures are exposed here. Add new procedures as they
 * are implemented following the session.impl.ts pattern.
 */
export const apiRouter = {
  session: sessionProcedures,
};

export type ApiRouter = typeof apiRouter;
