import { z } from 'zod';

/**
 * Member identity provider types
 * Subset of integration providers that support user identity mapping
 */
export const MEMBER_IDENTITY_PROVIDERS = ['slack'] as const;
export const MemberIdentityProviderSchema = z.enum(MEMBER_IDENTITY_PROVIDERS);
export type MemberIdentityProvider = z.infer<typeof MemberIdentityProviderSchema>;

// =============================================================================
// Provider-specific metadata schemas
// =============================================================================

/**
 * Slack member identity metadata
 * Stores the resolved Slack user ID and the context used to resolve it
 */
export const SlackMemberIdentityMetaSchema = z.object({
  userId: z.string(), // Slack user ID (e.g., U0123ABC)
  teamId: z.string(), // Slack workspace/team ID (cross-ref with integration)
  email: z.string(), // Email used for resolution (audit trail)
});
export type SlackMemberIdentityMeta = z.infer<typeof SlackMemberIdentityMetaSchema>;

// =============================================================================
// Provider configuration map
// =============================================================================

/**
 * Maps each provider to its metadata schema type
 * Same pattern as ProviderConfig in integration.ts
 */
export interface MemberIdentityProviderConfig {
  slack: {
    meta: SlackMemberIdentityMeta;
  };
}

/**
 * Type helper to get metadata type for a specific provider
 */
export type MemberIdentityMetaFor<P extends MemberIdentityProvider> =
  MemberIdentityProviderConfig[P]['meta'];

// =============================================================================
// Parse / create helpers
// =============================================================================

const metaSchemas: Record<MemberIdentityProvider, z.ZodType> = {
  slack: SlackMemberIdentityMetaSchema,
};

/**
 * Parse provider metadata from JSONB with Zod validation
 */
export function parseMemberIdentityMeta<P extends MemberIdentityProvider>(
  provider: P,
  meta: unknown
): MemberIdentityMetaFor<P> {
  const schema = metaSchemas[provider];
  if (!schema) {
    throw new Error(`Unknown member identity provider: ${provider}`);
  }
  return schema.parse(meta) as MemberIdentityMetaFor<P>;
}

/**
 * Create provider metadata with type safety and validation
 */
export function createMemberIdentityMeta<P extends MemberIdentityProvider>(
  provider: P,
  meta: MemberIdentityMetaFor<P>
): MemberIdentityMetaFor<P> {
  return parseMemberIdentityMeta(provider, meta);
}

/**
 * Type guard to check if a provider string is a valid member identity provider
 */
export function isMemberIdentityProvider(provider: string): provider is MemberIdentityProvider {
  return MEMBER_IDENTITY_PROVIDERS.includes(provider as MemberIdentityProvider);
}

/**
 * Extract the external user ID from provider metadata
 * Each provider stores the user ID in its own field within providerMeta
 */
export function extractProviderUserId<P extends MemberIdentityProvider>(
  provider: P,
  meta: MemberIdentityMetaFor<P>
): string {
  if (provider === 'slack') {
    return (meta as SlackMemberIdentityMeta).userId;
  }
  throw new Error(`Unknown member identity provider: ${provider}`);
}
