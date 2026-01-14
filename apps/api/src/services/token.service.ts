/**
 * TokenService - Infrastructure service for JWT token management
 * Handles generation and verification of JWT tokens for invites, workspace access, and domain verification
 */

import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '@/api/env';
import type {
  InviteTokenPayload,
  DomainVerificationTokenPayload,
  AccessRequestTokenPayload,
} from '@/api/types';

export class TokenService {
  private jwtSecret: string;
  private appUrl: string;
  private expiresIn: number;
  private domainVerificationSecret: string;
  private jwtIssuer: string;

  constructor(config: {
    jwtSecret: string;
    appUrl: string;
    expiresIn: number;
    domainVerificationSecret: string;
    jwtIssuer: string;
  }) {
    this.jwtSecret = config.jwtSecret;
    this.appUrl = config.appUrl;
    this.expiresIn = config.expiresIn;
    this.domainVerificationSecret = config.domainVerificationSecret;
    this.jwtIssuer = config.jwtIssuer;
  }

  /**
   * Generate JWT invite URL for email invitations
   * Contains all data needed to render invite page
   */
  generateInviteUrl(payload: Omit<InviteTokenPayload, 'iss'>): string {
    const fullPayload: InviteTokenPayload = {
      iss: this.jwtIssuer,
      ...payload,
    };
    const options: SignOptions = { expiresIn: this.expiresIn };
    const token = jwt.sign(fullPayload, this.jwtSecret, options);
    return `${this.appUrl}/invite?token=${token}`;
  }

  /**
   * Verify and decode invite JWT
   */
  verifyInviteToken(token: string): InviteTokenPayload | null {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as InviteTokenPayload;
      // Verify issuer
      if (payload.iss !== this.jwtIssuer) {
        return null;
      }
      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate domain verification token for recorder script
   * Token expires in 5 minutes and contains workspace ID, domain ID, and domain URL
   */
  generateDomainVerificationToken(workspaceId: string, domainId: string, url: string): string {
    const payload: DomainVerificationTokenPayload = {
      iss: this.jwtIssuer,
      workspaceId,
      domainId,
      url,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes
    };
    return jwt.sign(payload, this.domainVerificationSecret, { algorithm: 'HS256' });
  }

  /**
   * Verify and decode domain verification JWT
   * Returns payload if valid, null if invalid or expired
   */
  verifyDomainToken(token: string): DomainVerificationTokenPayload | null {
    try {
      const payload = jwt.verify(token, this.domainVerificationSecret, {
        algorithms: ['HS256'],
      }) as DomainVerificationTokenPayload;
      // Verify issuer
      if (payload.iss !== this.jwtIssuer) {
        return null;
      }
      return payload;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate access request URL for workspace access requests
   * Token expires in 7 days and contains workspace ID, owner ID, user ID, and user email
   * Each owner gets a unique token that only they can use
   * URL points to dashboard app where owner can review and approve/decline
   */
  generateAccessRequestUrl(
    workspaceId: string,
    ownerId: string,
    userId: string,
    userEmail: string
  ): string {
    const payload: Omit<AccessRequestTokenPayload, 'iss' | 'iat' | 'exp'> = {
      wi: workspaceId,
      oi: ownerId,
      ui: userId,
      ue: userEmail,
    };

    const fullPayload: AccessRequestTokenPayload = {
      iss: this.jwtIssuer,
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    };

    const token = jwt.sign(fullPayload, this.jwtSecret, { algorithm: 'HS256' });

    return `${this.appUrl}/workspace/request?token=${token}`;
  }

  /**
   * Verify and decode access request JWT
   * Returns payload if valid, null if invalid or expired
   */
  verifyAccessRequestToken(token: string): AccessRequestTokenPayload | null {
    try {
      const payload = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'],
      }) as AccessRequestTokenPayload;
      // Verify issuer
      if (payload.iss !== this.jwtIssuer) {
        return null;
      }
      return payload;
    } catch (error) {
      return null;
    }
  }
}

export const tokenService = new TokenService({
  jwtSecret: env.invite.secret,
  appUrl: env.invite.appUrl,
  expiresIn: env.invite.expiresIn,
  domainVerificationSecret: env.recorder.secret,
  jwtIssuer: env.jwtIssuer,
});
