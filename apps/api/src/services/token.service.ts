/**
 * TokenService - Infrastructure service for JWT token management
 * Handles generation and verification of all JWT tokens in the application.
 * This is the sole owner of jsonwebtoken -- no other service should import jwt directly.
 */

import jwt, { type SignOptions } from 'jsonwebtoken';
import { nanoid } from 'nanoid';

import { env } from '@/api/env';
import type {
  AccessRequestTokenPayload,
  DomainVerificationTokenPayload,
  IntercomOAuthSource,
  IntercomOAuthStatePayload,
  InviteTokenPayload,
  SessionTokenPayload,
  UploadTokenPayload,
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
  private recordingLinkSecret: string;
  private recordingLinkExpiresIn: number;
  private sessionSecret: string;
  private sessionExpiresIn: number;
  private uploadSecret: string;
  private uploadExpiresIn: number;

  constructor(config: {
    jwtSecret: string;
    dashboardUrl: string;
    expiresIn: number;
    domainVerificationSecret: string;
    jwtIssuer: string;
    domainVerificationExpiresIn: number;
    accessRequestExpiresIn: number;
    workspaceCreateInviteExpiresIn: number;
    recordingLinkSecret: string;
    recordingLinkExpiresIn: number;
    sessionSecret: string;
    sessionExpiresIn: number;
    uploadSecret: string;
    uploadExpiresIn: number;
  }) {
    this.jwtSecret = config.jwtSecret;
    this.dashboardUrl = config.dashboardUrl;
    this.expiresIn = config.expiresIn;
    this.domainVerificationSecret = config.domainVerificationSecret;
    this.jwtIssuer = config.jwtIssuer;
    this.domainVerificationExpiresIn = config.domainVerificationExpiresIn;
    this.accessRequestExpiresIn = config.accessRequestExpiresIn;
    this.workspaceCreateInviteExpiresIn = config.workspaceCreateInviteExpiresIn;
    this.recordingLinkSecret = config.recordingLinkSecret;
    this.recordingLinkExpiresIn = config.recordingLinkExpiresIn;
    this.sessionSecret = config.sessionSecret;
    this.sessionExpiresIn = config.sessionExpiresIn;
    this.uploadSecret = config.uploadSecret;
    this.uploadExpiresIn = config.uploadExpiresIn;
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
   * @param source - Origin of the OAuth flow for callback routing
   */
  signIntercomOAuthState(
    userId: string,
    workspaceId?: string,
    source?: IntercomOAuthSource
  ): string {
    const now = Math.floor(Date.now() / 1000);
    const payload: IntercomOAuthStatePayload = {
      iss: this.jwtIssuer,
      userId,
      ...(workspaceId && { workspaceId }),
      ...(source && { source }),
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

  // ---------------------------------------------------------------------------
  // Recording link tokens
  // Used by LinkService to generate shareable recording URLs
  // ---------------------------------------------------------------------------

  /**
   * Sign a recording link token containing the link ID
   * Token expires based on recordingLinkExpiresIn config (default 180 days)
   */
  signLinkToken(linkId: string): string {
    const payload = { lid: linkId };
    const options: SignOptions = { expiresIn: this.recordingLinkExpiresIn };
    return jwt.sign(payload, this.recordingLinkSecret, options);
  }

  /**
   * Verify and decode a recording link token
   * Returns the decoded payload with lid (link ID) if valid
   * Throws jwt.TokenExpiredError if token has expired
   * Throws jwt.JsonWebTokenError if token is invalid
   */
  verifyLinkToken(token: string): { lid: string } {
    const decoded = jwt.verify(token, this.recordingLinkSecret) as { lid: string };
    return decoded;
  }

  // ---------------------------------------------------------------------------
  // Session tokens
  // Used by SessionService to manage recording session lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Sign a session token for an active recording session
   * Token expires based on sessionExpiresIn config
   * Adds iss (issuer) claim automatically
   */
  signSessionToken(payload: Omit<SessionTokenPayload, 'iat' | 'exp' | 'iss'>): string {
    const fullPayload = { iss: this.jwtIssuer, ...payload };
    return jwt.sign(fullPayload, this.sessionSecret, {
      expiresIn: this.sessionExpiresIn,
    });
  }

  /**
   * Verify and decode a session token
   * Returns payload if valid and issuer matches, null otherwise
   */
  verifySessionToken(token: string): SessionTokenPayload | null {
    try {
      const payload = jwt.verify(token, this.sessionSecret) as SessionTokenPayload;
      if (payload.iss !== this.jwtIssuer) {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Upload tokens
  // Used by SessionService to authorize recording uploads
  // ---------------------------------------------------------------------------

  /**
   * Sign an upload token for a recording upload
   * Token expires based on uploadExpiresIn config
   * Adds iss (issuer) claim automatically
   */
  signUploadToken(payload: Omit<UploadTokenPayload, 'iat' | 'exp' | 'iss'>): string {
    const fullPayload = { iss: this.jwtIssuer, ...payload };
    return jwt.sign(fullPayload, this.uploadSecret, {
      expiresIn: this.uploadExpiresIn,
    });
  }

  /**
   * Verify and decode an upload token
   * Returns payload if valid and issuer matches, null otherwise
   */
  verifyUploadToken(token: string): UploadTokenPayload | null {
    try {
      const payload = jwt.verify(token, this.uploadSecret) as UploadTokenPayload;
      if (payload.iss !== this.jwtIssuer) {
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
  domainVerificationSecret: env.token.domainVerificationSecret,
  jwtIssuer: env.auth.jwtIssuer,
  domainVerificationExpiresIn: env.token.domainVerificationExpiresIn,
  accessRequestExpiresIn: env.token.accessRequestExpiresIn,
  workspaceCreateInviteExpiresIn: env.token.workspaceCreateInviteExpiresIn,
  recordingLinkSecret: env.token.recordingSecret,
  recordingLinkExpiresIn: env.token.recordingTokenExpiresIn,
  sessionSecret: env.session.tokenSecret,
  sessionExpiresIn: env.session.tokenExpiry,
  uploadSecret: env.session.uploadTokenSecret,
  uploadExpiresIn: env.session.uploadTokenExpiry,
});
