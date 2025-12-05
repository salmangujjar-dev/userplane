/**
 * TokenService - Infrastructure service for JWT token management
 * Handles generation and verification of JWT tokens for invites and workspace access
 */

import jwt from 'jsonwebtoken';
import { env } from '@/api/env';
import type { InviteTokenPayload } from '@/api/types';

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
   * Token expires in 30 days
   */
  generateInviteUrl(payload: InviteTokenPayload): string {
    const token = jwt.sign(payload, this.jwtSecret, { expiresIn: '30d' });
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
}

export const tokenService = new TokenService({
  jwtSecret: env.invite.secret,
  appUrl: env.invite.appUrl,
});
