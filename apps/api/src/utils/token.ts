/**
 * Token parsing utilities
 * Utilities for parsing and validating JWT token payloads
 */

import type { PlanId } from '@workspace/pricing';

import type { TokenService } from '@/api/services/token.service';
import type { WorkspaceCreateInviteTokenPayload } from '@/api/types';

/**
 * Parse workspace create invite token
 * Returns parsed payload if valid, null otherwise
 */
export function parseWorkspaceCreateInviteToken(
  tokenService: TokenService,
  token: string
): WorkspaceCreateInviteTokenPayload | null {
  return tokenService.verifyWorkspaceCreateInviteToken(token);
}

/**
 * Extract workspace details from invite token
 * Returns workspace details if token is valid, null otherwise
 */
export function extractWorkspaceDetailsFromInviteToken(
  tokenService: TokenService,
  token: string
): {
  workspaceId: string;
  workspaceUrl: string;
  workspacePlan: PlanId;
} | null {
  const payload = parseWorkspaceCreateInviteToken(tokenService, token);

  if (!payload) {
    return null;
  }

  return {
    workspaceId: payload.wi,
    workspaceUrl: payload.wu,
    workspacePlan: payload.wp,
  };
}
