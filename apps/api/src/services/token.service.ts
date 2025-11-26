/**
 * TokenService - Infrastructure service for JWT token management
 * Handles generation and verification of JWT tokens for invites and workspace access
 */

import jwt from 'jsonwebtoken';
import { env } from '@/api/env';
import type { InviteTokenPayload, WorkspaceInviteTokenPayload } from '@/api/types';

export class TokenService {
  private jwtSecret: string;
  private appUrl: string;

  constructor(config: { jwtSecret: string; appUrl: string }) {
    this.jwtSecret = config.jwtSecret;
    this.appUrl = config.appUrl;
  }

  /**
   * Generate JWT invite URL for email invitations
   * Contains all data needed to render invite page
   */
  generateInviteUrl(payload: InviteTokenPayload): string {
    const token = jwt.sign(payload, this.jwtSecret, { expiresIn: '7d' });
    return `${this.appUrl}/invite?token=${token}`;
  }

  /**
   * Verify and decode invite JWT
   */
  verifyInviteToken(token: string): InviteTokenPayload | null {
    try {
      return jwt.verify(token, this.jwtSecret) as InviteTokenPayload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate workspace invite token (stored in DB)
   * Simpler token for workspace.workspaceInviteToken field
   */
  generateWorkspaceInviteToken(payload: WorkspaceInviteTokenPayload): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: '365d' });
  }
}

export const tokenService = new TokenService({
  jwtSecret: env.auth.secret,
  appUrl: env.auth.url,
});
