/**
 * ApiKeyService - Manages personal API keys and identities via Unkey
 *
 * Each user gets one Unkey identity (created at signup, lazily if needed)
 * with rate limits. API keys are linked to identities via externalId = userId.
 *
 * Uses @unkey/api v2 SDK — methods return response bodies directly and throw
 * typed error classes (UnkeyError, NotFoundErrorResponse, ConflictErrorResponse).
 */

import { Unkey } from '@unkey/api';
import { ConflictErrorResponse, NotFoundErrorResponse } from '@unkey/api/models/errors';
import { API_KEY_LIMITS, apiKeyError } from '@userplane/contract';

import { createLogger } from '@/api/lib/logger';

const logger = createLogger('api-key-service');

const KEY_PREFIX = 'up';

export interface ApiKeyServiceDeps {
  rootKey: string;
  apiId: string;
  rateLimitPerMinute: number;
  rateLimitPerDay: number;
}

export class ApiKeyService {
  private client: Unkey;
  private apiId: string;
  private identityRateLimits: Array<{
    name: string;
    limit: number;
    duration: number;
    autoApply: boolean;
  }>;

  constructor(private deps: ApiKeyServiceDeps) {
    this.client = new Unkey({ rootKey: deps.rootKey });
    this.apiId = deps.apiId;
    this.identityRateLimits = [
      { name: 'requests', limit: deps.rateLimitPerMinute, duration: 60_000, autoApply: true },
      { name: 'daily', limit: deps.rateLimitPerDay, duration: 86_400_000, autoApply: true },
    ];
  }

  // ---------------------------------------------------------------------------
  // Identity methods
  // ---------------------------------------------------------------------------

  /**
   * Create an Unkey identity for a user with rate limit config.
   * Handles 409 (already exists) gracefully.
   */
  async createIdentity(userId: string): Promise<string> {
    try {
      const response = await this.client.identities.createIdentity({
        externalId: userId,
        ratelimits: this.identityRateLimits,
      });
      return response.data.identityId;
    } catch (err) {
      if (err instanceof ConflictErrorResponse) {
        logger.debug({ userId }, 'Identity already exists');
        const existing = await this.getIdentity(userId);
        if (existing) return existing.id;
        throw new Error(`Identity conflict but not found for userId=${userId}`);
      }
      throw err;
    }
  }

  /**
   * Get an identity by userId (externalId).
   * Returns null if not found.
   */
  async getIdentity(userId: string): Promise<{ id: string; externalId: string } | null> {
    try {
      const response = await this.client.identities.getIdentity({
        identity: userId,
      });
      return {
        id: response.data.id,
        externalId: response.data.externalId,
      };
    } catch (err) {
      if (err instanceof NotFoundErrorResponse) return null;
      throw err;
    }
  }

  /**
   * Ensure an identity exists for the user. Get-or-create pattern.
   * Used before key creation to handle lazy identity provisioning.
   * The 409 handler in createIdentity covers concurrent calls gracefully.
   */
  async ensureIdentity(userId: string): Promise<string> {
    const existing = await this.getIdentity(userId);
    if (existing) return existing.id;
    return this.createIdentity(userId);
  }

  /**
   * Delete an identity. Called on account deletion.
   */
  async deleteIdentity(userId: string): Promise<void> {
    try {
      await this.client.identities.deleteIdentity({
        identity: userId,
      });
    } catch (err) {
      if (err instanceof NotFoundErrorResponse) return;
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // Key methods
  // ---------------------------------------------------------------------------

  /**
   * Verify an API key. Returns auth + rate limit result in one call.
   * verifyKey always returns HTTP 200 — check `valid` field in response data.
   * Infrastructure errors (network, SDK) return code: 'SERVICE_ERROR'.
   */
  async verifyKey(key: string): Promise<{
    valid: boolean;
    code: string;
    keyId?: string;
    externalId?: string;
    name?: string;
    meta?: Record<string, unknown>;
    expires?: number;
  }> {
    try {
      const response = await this.client.keys.verifyKey({ key });
      const data = response.data;

      return {
        valid: data.valid,
        code: data.code ?? 'VALID',
        keyId: data.keyId,
        externalId: data.identity?.externalId,
        name: data.name ?? undefined,
        meta: data.identity?.meta as Record<string, unknown> | undefined,
        expires: data.expires ?? undefined,
      };
    } catch (err) {
      logger.error({ err, keyPrefix: key.slice(0, 6) }, 'Unkey verifyKey error');
      return { valid: false, code: 'SERVICE_ERROR' };
    }
  }

  /**
   * Create a new API key for a user.
   * Enforces MAX_KEYS_PER_USER limit at the service level.
   * Ensures identity exists first (lazy creation).
   * No key-level rate limits — inherited from identity.
   */
  async createKey(params: {
    userId: string;
    name?: string;
    expiresIn?: number; // seconds
  }): Promise<{ key: string; keyId: string; expiresAt?: number }> {
    // Enforce per-user key limit
    const existingKeys = await this.listKeysByExternalId(params.userId);
    if (existingKeys.length >= API_KEY_LIMITS.MAX_KEYS_PER_USER) {
      throw apiKeyError.API_KEY_ALREADY_EXISTS();
    }

    await this.ensureIdentity(params.userId);

    const expires = params.expiresIn ? Date.now() + params.expiresIn * 1000 : undefined;

    const response = await this.client.keys.createKey({
      apiId: this.apiId,
      externalId: params.userId,
      prefix: KEY_PREFIX,
      name: params.name,
      expires,
    });

    return {
      key: response.data.key,
      keyId: response.data.keyId,
      expiresAt: expires,
    };
  }

  /**
   * Revoke (delete) a single key by ID.
   */
  async revokeKey(keyId: string): Promise<void> {
    try {
      await this.client.keys.deleteKey({ keyId });
    } catch (err) {
      if (err instanceof NotFoundErrorResponse) return;
      throw err;
    }
  }

  /**
   * List all keys for a user via the APIs endpoint.
   */
  async listKeysByExternalId(userId: string): Promise<
    Array<{
      keyId: string;
      start: string;
      name?: string;
      createdAt?: number;
      expires?: number;
      enabled: boolean;
    }>
  > {
    try {
      const response = await this.client.apis.listKeys({
        apiId: this.apiId,
        externalId: userId,
      });

      // @unkey/api v2.4 returns a PageIterator; the first page's keys live at
      // `response.result.data` (previously `response.data`).
      return (response.result.data ?? []).map((k) => ({
        keyId: k.keyId,
        start: k.start,
        name: k.name ?? undefined,
        createdAt: k.createdAt,
        expires: k.expires ?? undefined,
        enabled: k.enabled,
      }));
    } catch (err) {
      if (err instanceof NotFoundErrorResponse) return [];
      throw err;
    }
  }

  /**
   * Get a user's key for masked display.
   * Returns the first key found (users should have at most one).
   */
  async getKeyByExternalId(userId: string): Promise<{
    keyId: string;
    maskedKey: string;
    name?: string;
    createdAt?: number;
    expiresAt?: number;
    enabled: boolean;
  } | null> {
    const keys = await this.listKeysByExternalId(userId);
    const key = keys[0];
    if (!key) return null;

    if (keys.length > 1) {
      logger.warn(
        { userId, count: keys.length },
        'User has multiple API keys — expected at most 1'
      );
    }

    return {
      keyId: key.keyId,
      maskedKey: `${KEY_PREFIX}_${'•'.repeat(8)}${key.start.slice(-4)}`,
      name: key.name,
      createdAt: key.createdAt,
      expiresAt: key.expires,
      enabled: key.enabled,
    };
  }

  /**
   * Revoke all keys for a user.
   */
  async revokeAllKeys(userId: string): Promise<void> {
    const keys = await this.listKeysByExternalId(userId);
    await Promise.all(keys.map((k) => this.revokeKey(k.keyId)));
  }

  /**
   * Rotate a user's key: revoke existing + create new.
   */
  async rotateKey(params: {
    userId: string;
    name?: string;
    expiresIn?: number;
  }): Promise<{ key: string; keyId: string; expiresAt?: number }> {
    await this.revokeAllKeys(params.userId);
    return this.createKey(params);
  }

  /**
   * Disable all keys for a user (ban).
   * Uses updateKey({ enabled: false }) to preserve the key.
   */
  async disableKeysByExternalId(userId: string): Promise<void> {
    const keys = await this.listKeysByExternalId(userId);
    await Promise.all(
      keys.map((k) => this.client.keys.updateKey({ keyId: k.keyId, enabled: false }))
    );
  }

  /**
   * Re-enable all keys for a user (unban).
   */
  async enableKeysByExternalId(userId: string): Promise<void> {
    const keys = await this.listKeysByExternalId(userId);
    await Promise.all(
      keys.map((k) => this.client.keys.updateKey({ keyId: k.keyId, enabled: true }))
    );
  }

  /**
   * Full cleanup: revoke all keys + delete identity.
   * Called on account deletion.
   */
  async deleteIdentityAndKeys(userId: string): Promise<void> {
    await this.revokeAllKeys(userId);
    await this.deleteIdentity(userId);
  }
}
