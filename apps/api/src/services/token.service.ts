/**
 * TokenService - Infrastructure service for JWT token management
 * Handles generation and verification of JWT tokens for invites, workspace access, and domain verification
 */

import jwt, { type SignOptions } from 'jsonwebtoken';
import { nanoid } from 'nanoid';

import { env } from '@/api/env';
import type {
  AccessRequestTokenPayload,
  BillingEmailVerificationTokenPayload,
  DomainVerificationTokenPayload,
  IntercomOAuthStatePayload,
  InviteTokenPayload,
  WorkspaceCreateInviteTokenPayload,
} from '@/api/types';

// Intercom OAuth state expiry: 15 minutes
const INTERCOM_OAUTH_STATE_EXPIRES_IN = 15 * 60;

export class TokenService {
  private jwtSecret: string;
  private dashboardUrl: string;
  private expiresIn: number;
  private domainVerificationSecret: string;
  private jwtIssuer: string;
  private domainVerificationExpiresIn: number;
  private accessRequestExpiresIn: number;
  private workspaceCreateInviteExpiresIn: number;
  private billingEmailVerificationExpiresIn: number;

  constructor(config: {
    jwtSecret: string;
    dashboardUrl: string;
    expiresIn: number;
    domainVerificationSecret: string;
    jwtIssuer: string;
    domainVerificationExpiresIn: number;
    accessRequestExpiresIn: number;
    workspaceCreateInviteExpiresIn: number;
    billingEmailVerificationExpiresIn: number;
  }) {
    this.jwtSecret = config.jwtSecret;
    this.dashboardUrl = config.dashboardUrl;
    this.expiresIn = config.expiresIn;
    this.domainVerificationSecret = config.domainVerificationSecret;
    this.jwtIssuer = config.jwtIssuer;
    this.domainVerificationExpiresIn = config.domainVerificationExpiresIn;
    this.accessRequestExpiresIn = config.accessRequestExpiresIn;
    this.workspaceCreateInviteExpiresIn = config.workspaceCreateInviteExpiresIn;
    this.billingEmailVerificationExpiresIn = config.billingEmailVerificationExpiresIn;
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
    return `${this.dashboardUrl}/invite?token=${token}`;
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
    } catch {
      return null;
    }
  }

  /**
   * Generate domain verification token for recorder script
   * Token expires based on domainVerificationExpiresIn config (default 5 minutes)
   * Contains workspace ID, domain ID, and domain URL
   */
  generateDomainVerificationToken(workspaceId: string, domainId: string, url: string): string {
    const payload: DomainVerificationTokenPayload = {
      iss: this.jwtIssuer,
      workspaceId,
      domainId,
      url,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.domainVerificationExpiresIn,
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
    } catch {
      return null;
    }
  }

  /**
   * Generate access request URL for workspace access requests
   * Token expires based on accessRequestExpiresIn config (default 7 days)
   * Contains workspace ID, owner ID, user ID, and user email
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
      exp: Math.floor(Date.now() / 1000) + this.accessRequestExpiresIn,
    };

    const token = jwt.sign(fullPayload, this.jwtSecret, { algorithm: 'HS256' });

    return `${this.dashboardUrl}/workspace/request?token=${token}`;
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
    } catch {
      return null;
    }
  }

  /**
   * Generate workspace create invite URL for admin provisioning
   * Token expires based on workspaceCreateInviteExpiresIn config (default 7 days)
   * Contains predetermined workspace ID and URL
   * URL points to workspace creation flow with invite token
   * Workspaces start on free plan - no plan needed in token
   */
  generateWorkspaceCreateInviteUrl(params: { workspaceId: string; workspaceUrl: string }): string {
    const payload: Omit<WorkspaceCreateInviteTokenPayload, 'iss' | 'iat' | 'exp'> = {
      wi: params.workspaceId,
      wu: params.workspaceUrl,
    };

    const fullPayload: WorkspaceCreateInviteTokenPayload = {
      iss: this.jwtIssuer,
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.workspaceCreateInviteExpiresIn,
    };

    const token = jwt.sign(fullPayload, this.jwtSecret, { algorithm: 'HS256' });

    return `${this.dashboardUrl}/workspace/create?token=${token}`;
  }

  /**
   * Verify and decode workspace create invite JWT
   * Returns payload if valid, null if invalid or expired
   */
  verifyWorkspaceCreateInviteToken(token: string): WorkspaceCreateInviteTokenPayload | null {
    try {
      const payload = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'],
      }) as WorkspaceCreateInviteTokenPayload;
      // Verify issuer
      if (payload.iss !== this.jwtIssuer) {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Generate billing email verification URL
   * Token expires based on billingEmailVerificationExpiresIn config (default 10 minutes)
   * Contains workspace ID, member ID, and new billing email
   * URL points to dashboard app where the verification will be processed
   */
  generateBillingEmailVerificationUrl(
    workspaceId: string,
    memberId: string,
    billingEmail: string
  ): string {
    const payload: Omit<BillingEmailVerificationTokenPayload, 'iss' | 'iat' | 'exp'> = {
      wi: workspaceId,
      mi: memberId,
      be: billingEmail,
    };

    const fullPayload: BillingEmailVerificationTokenPayload = {
      iss: this.jwtIssuer,
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.billingEmailVerificationExpiresIn,
    };

    const token = jwt.sign(fullPayload, this.jwtSecret, { algorithm: 'HS256' });

    return `${this.dashboardUrl}/billing-email/verify?token=${token}`;
  }

  /**
   * Verify and decode billing email verification JWT
   * Returns payload if valid, null if invalid or expired
   */
  verifyBillingEmailVerificationToken(token: string): BillingEmailVerificationTokenPayload | null {
    try {
      const payload = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'],
      }) as BillingEmailVerificationTokenPayload;
      // Verify issuer
      if (payload.iss !== this.jwtIssuer) {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Get access request expiry duration in seconds
   */
  getAccessRequestExpiresIn(): number {
    return this.accessRequestExpiresIn;
  }

  /**
   * Generate signed Intercom OAuth state token
   * Used for CSRF protection during OAuth flow
   * Token expires in 15 minutes
   * @param userId - The user initiating the OAuth flow
   * @param workspaceId - Optional workspace ID for workspace integration flow (absent for onboarding)
   */
  signIntercomOAuthState(userId: string, workspaceId?: string): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: IntercomOAuthStatePayload = {
      iss: this.jwtIssuer,
      userId,
      ...(workspaceId && { workspaceId }),
      timestamp: now,
      nonce: nanoid(16),
      iat: now,
      exp: now + INTERCOM_OAUTH_STATE_EXPIRES_IN,
    };

    return jwt.sign(payload, this.jwtSecret, { algorithm: 'HS256' });
  }

  /**
   * Verify and decode Intercom OAuth state token
   * Returns payload if valid and user matches, null otherwise
   * @param token - The OAuth state token to verify
   * @param userId - The expected user ID
   * @param workspaceId - Optional expected workspace ID for workspace integration flow
   */
  verifyIntercomOAuthState(
    token: string,
    userId: string,
    workspaceId?: string
  ): IntercomOAuthStatePayload | null {
    try {
      const payload = jwt.verify(token, this.jwtSecret, {
        algorithms: ['HS256'],
      }) as IntercomOAuthStatePayload;

      // Verify issuer
      if (payload.iss !== this.jwtIssuer) {
        return null;
      }

      // Verify user ID matches (CSRF protection)
      if (payload.userId !== userId) {
        return null;
      }

      // If workspaceId is provided, verify it matches
      if (workspaceId !== undefined && payload.workspaceId !== workspaceId) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }
}

export const tokenService = new TokenService({
  jwtSecret: env.token.inviteSecret,
  dashboardUrl: env.dashboard.baseUrl,
  expiresIn: env.token.inviteExpiresIn,
  domainVerificationSecret: env.token.recordingSecret,
  jwtIssuer: env.jwtIssuer,
  domainVerificationExpiresIn: env.token.domainVerificationExpiresIn,
  accessRequestExpiresIn: env.token.accessRequestExpiresIn,
  workspaceCreateInviteExpiresIn: env.token.workspaceCreateInviteExpiresIn,
  billingEmailVerificationExpiresIn: env.token.billingEmailVerificationExpiresIn,
});
