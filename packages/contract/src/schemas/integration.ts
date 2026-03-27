import { z } from 'zod';

/**
 * Integration provider types
 * Add new providers here as they are implemented
 */
export const INTEGRATION_PROVIDERS = ['intercom', 'zendesk', 'slack'] as const;
export const IntegrationProviderSchema = z.enum(INTEGRATION_PROVIDERS);
export type IntegrationProvider = z.infer<typeof IntegrationProviderSchema>;

/**
 * Provider-specific token schemas
 * Each provider defines its own token storage structure
 */

// Intercom token - simple access token (no refresh, valid until revoked)
export const IntercomTokenSchema = z.object({
  accessToken: z.string(),
});
export type IntercomToken = z.infer<typeof IntercomTokenSchema>;

/**
 * Intercom region enum
 * Regional API endpoints: US (api.intercom.io), EU (api.eu.intercom.io), AU (api.au.intercom.io)
 */
export const INTERCOM_REGIONS = ['US', 'EU', 'AU'] as const;
export const IntercomRegionSchema = z.enum(INTERCOM_REGIONS);
export type IntercomRegion = z.infer<typeof IntercomRegionSchema>;

// Zendesk token - access token for Zendesk API calls
// Note: apiToken is deprecated (kept optional for existing DB records).
// Session auth now uses ZAF JWT → short-lived session JWT flow.
export const ZendeskTokenSchema = z.object({
  accessToken: z.string(),
  /** @deprecated No longer used for auth — session JWT flow replaces this */
  apiToken: z.string().optional(),
  refreshToken: z.string().optional(),
  tokenExpiresAt: z.string().datetime().optional(),
  refreshTokenExpiresAt: z.string().datetime().optional(),
});
export type ZendeskToken = z.infer<typeof ZendeskTokenSchema>;

/**
 * Provider-specific metadata schemas
 */

// Intercom provider metadata
export const IntercomProviderMetaSchema = z.object({
  region: IntercomRegionSchema,
});
export type IntercomProviderMeta = z.infer<typeof IntercomProviderMetaSchema>;

// Zendesk provider metadata
export const ZendeskProviderMetaSchema = z.object({
  subdomain: z.string(),
});
export type ZendeskProviderMeta = z.infer<typeof ZendeskProviderMetaSchema>;

// Slack token - bot token for Slack API calls (xoxb-...)
export const SlackTokenSchema = z.object({
  accessToken: z.string(),
  botUserId: z.string(),
  appId: z.string(),
  authedUserId: z.string(),
});
export type SlackToken = z.infer<typeof SlackTokenSchema>;

// Slack provider metadata
export const SlackProviderMetaSchema = z.object({
  teamId: z.string(),
  teamName: z.string(),
  enterpriseId: z.string().optional(),
  isEnterpriseInstall: z.boolean().optional(),
});
export type SlackProviderMeta = z.infer<typeof SlackProviderMetaSchema>;

/**
 * Complete provider configuration
 * Maps each provider to its token and metadata schemas
 */
export interface ProviderConfig {
  intercom: {
    token: IntercomToken;
    meta: IntercomProviderMeta;
  };
  zendesk: {
    token: ZendeskToken;
    meta: ZendeskProviderMeta;
  };
  slack: {
    token: SlackToken;
    meta: SlackProviderMeta;
  };
}

/**
 * Type helper to get token type for a specific provider
 */
export type ProviderTokenFor<P extends IntegrationProvider> = ProviderConfig[P]['token'];

/**
 * Type helper to get metadata type for a specific provider
 */
export type ProviderMetaFor<P extends IntegrationProvider> = ProviderConfig[P]['meta'];

/**
 * Helper to create provider metadata with type safety
 */
export function createProviderMeta<P extends IntegrationProvider>(
  provider: P,
  meta: ProviderMetaFor<P>
): ProviderMetaFor<P> {
  if (provider === 'intercom') {
    return IntercomProviderMetaSchema.parse(meta) as ProviderMetaFor<P>;
  }
  if (provider === 'zendesk') {
    return ZendeskProviderMetaSchema.parse(meta) as ProviderMetaFor<P>;
  }
  if (provider === 'slack') {
    return SlackProviderMetaSchema.parse(meta) as ProviderMetaFor<P>;
  }
  throw new Error(`Unknown provider: ${provider}`);
}

/**
 * Helper to parse provider metadata from JSONB
 */
export function parseProviderMeta<P extends IntegrationProvider>(
  provider: P,
  meta: unknown
): ProviderMetaFor<P> {
  if (provider === 'intercom') {
    return IntercomProviderMetaSchema.parse(meta) as ProviderMetaFor<P>;
  }
  if (provider === 'zendesk') {
    return ZendeskProviderMetaSchema.parse(meta) as ProviderMetaFor<P>;
  }
  if (provider === 'slack') {
    return SlackProviderMetaSchema.parse(meta) as ProviderMetaFor<P>;
  }
  throw new Error(`Unknown provider: ${provider}`);
}

/**
 * Helper to create provider token with type safety
 */
export function createProviderToken<P extends IntegrationProvider>(
  provider: P,
  token: ProviderTokenFor<P>
): ProviderTokenFor<P> {
  if (provider === 'intercom') {
    return IntercomTokenSchema.parse(token) as ProviderTokenFor<P>;
  }
  if (provider === 'zendesk') {
    return ZendeskTokenSchema.parse(token) as ProviderTokenFor<P>;
  }
  if (provider === 'slack') {
    return SlackTokenSchema.parse(token) as ProviderTokenFor<P>;
  }
  throw new Error(`Unknown provider: ${provider}`);
}

/**
 * Helper to parse provider token from JSONB
 */
export function parseProviderToken<P extends IntegrationProvider>(
  provider: P,
  token: unknown
): ProviderTokenFor<P> {
  if (provider === 'intercom') {
    return IntercomTokenSchema.parse(token) as ProviderTokenFor<P>;
  }
  if (provider === 'zendesk') {
    return ZendeskTokenSchema.parse(token) as ProviderTokenFor<P>;
  }
  if (provider === 'slack') {
    return SlackTokenSchema.parse(token) as ProviderTokenFor<P>;
  }
  throw new Error(`Unknown provider: ${provider}`);
}

/**
 * Helper to extract access token from provider token
 * Handles different token structures per provider
 */
export function extractAccessToken<P extends IntegrationProvider>(
  provider: P,
  token: ProviderTokenFor<P>
): string {
  if (provider === 'intercom') {
    return (token as IntercomToken).accessToken;
  }
  if (provider === 'zendesk') {
    return (token as ZendeskToken).accessToken;
  }
  if (provider === 'slack') {
    return (token as SlackToken).accessToken;
  }
  throw new Error(`Unknown provider: ${provider}`);
}
