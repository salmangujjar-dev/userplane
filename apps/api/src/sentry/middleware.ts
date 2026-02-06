/**
 * Sentry context enrichment middleware for oRPC procedures
 * Enriches Sentry events with user and workspace context from authenticated requests
 *
 * Usage:
 * - Import `enrichSentryContext` for authenticated routes
 * - Import `enrichSentryWorkspaceContext` for workspace-scoped routes
 */

import * as Sentry from '@sentry/node';
import {
  buildWorkspaceTags,
  TagNames,
  type WorkspaceContext as SentryWorkspaceContext,
} from '@workspace/sentry';

import type { AuthContext } from '@/api/middleware/auth.orpc';
import { base } from '@/api/middleware/auth.orpc';
import type { WorkspaceContext } from '@/api/middleware/workspace.orpc';

/**
 * Enriches Sentry events with user context from authenticated requests
 * Should be used after authMiddleware
 */
export const enrichSentryUserContext = base
  .$context<AuthContext>()
  .middleware(async ({ context, next }) => {
    // Set user context for Sentry
    Sentry.setUser({
      id: context.user.id,
      email: context.user.email,
      username: context.user.name,
    });

    // Add user metadata as tags for easier filtering
    Sentry.setTag(TagNames.USER_ID, context.user.id);

    try {
      return await next({ context });
    } finally {
      // Clear user context after request completes to avoid leaking between requests
      Sentry.setUser(null);
    }
  });

/**
 * Enriches Sentry events with workspace context
 * Should be used after workspace middleware
 */
export const enrichSentryWorkspaceContext = base
  .$context<AuthContext & WorkspaceContext>()
  .middleware(async ({ context, next }) => {
    // Set workspace context for Sentry
    const workspaceCtx: SentryWorkspaceContext = {
      workspace_id: context.workspaceId,
      workspace_role: context.workspaceRole,
      workspace_member_id: context.workspaceMemberId,
    };
    Sentry.setContext('workspace', workspaceCtx);

    // Add workspace tags for easier filtering
    const tags = buildWorkspaceTags({
      workspaceId: context.workspaceId,
      workspaceRole: context.workspaceRole,
    });
    Sentry.setTags(tags);

    try {
      return await next({ context });
    } finally {
      // Clear workspace context after request completes
      Sentry.setContext('workspace', null);
    }
  });

/**
 * Combined middleware that enriches both user and workspace context
 * Use this for workspace-scoped routes to get full context enrichment
 */
export const enrichSentryFullContext = base
  .$context<AuthContext & WorkspaceContext>()
  .middleware(async ({ context, next }) => {
    // Set user context
    Sentry.setUser({
      id: context.user.id,
      email: context.user.email,
      username: context.user.name,
    });

    // Set workspace context
    const workspaceCtx: SentryWorkspaceContext = {
      workspace_id: context.workspaceId,
      workspace_role: context.workspaceRole,
      workspace_member_id: context.workspaceMemberId,
    };
    Sentry.setContext('workspace', workspaceCtx);

    // Add tags for easier filtering
    Sentry.setTag(TagNames.USER_ID, context.user.id);
    const tags = buildWorkspaceTags({
      workspaceId: context.workspaceId,
      workspaceRole: context.workspaceRole,
    });
    Sentry.setTags(tags);

    try {
      return await next({ context });
    } finally {
      // Clear context after request completes
      Sentry.setUser(null);
      Sentry.setContext('workspace', null);
    }
  });
