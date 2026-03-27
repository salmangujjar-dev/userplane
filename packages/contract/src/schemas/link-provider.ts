import { z } from 'zod';

import { LINK_META } from '../constants';
import { type LinkProviderType } from './common';

/**
 * Link provider data schemas
 *
 * Each link provider can store provider-specific data in the link_provider_data JSONB column.
 * These schemas validate and type that data per provider, following the same pattern
 * as integration provider schemas (packages/contract/src/schemas/integration.ts).
 *
 * To add a new provider's data schema:
 * 1. Define a Zod schema and inferred type
 * 2. Add an entry to LinkProviderDataConfig
 * 3. Add a case in parseLinkProviderData / createLinkProviderData
 */

// -- Meta schema (universal across all providers) ----------------------------

const META_KEY_PATTERN = /^[a-zA-Z0-9_-]+$/;

/**
 * User-provided key-value metadata for links.
 * Stored inside linkProviderData under the `meta` key so it doesn't
 * conflict with provider-specific fields.
 */
export const LinkMetaSchema = z
  .record(
    z
      .string()
      .max(LINK_META.MAX_KEY_LENGTH)
      .regex(META_KEY_PATTERN, 'Meta keys must be alphanumeric, hyphens, or underscores'),
    z.string().max(LINK_META.MAX_VALUE_LENGTH)
  )
  .refine((obj) => Object.keys(obj).length <= LINK_META.MAX_ENTRIES, {
    message: `Meta may contain at most ${LINK_META.MAX_ENTRIES} entries`,
  })
  .optional();

export type LinkMeta = z.infer<typeof LinkMetaSchema>;

// -- Provider-specific data schemas ------------------------------------------

/**
 * Intercom link provider data
 * Stores the Intercom admin (teammate) who initiated the link from a conversation.
 * Used to post admin notes back to the conversation when a recording is received.
 */
export const IntercomLinkProviderDataSchema = z.object({
  adminId: z.string(),
  meta: LinkMetaSchema,
});
export type IntercomLinkProviderData = z.infer<typeof IntercomLinkProviderDataSchema>;

/**
 * Zendesk link provider data
 * Stores the ticket ID from the Zendesk sidebar where the link was created.
 */
export const ZendeskLinkProviderDataSchema = z.object({
  ticketId: z.string().optional(),
  ticketSubject: z.string().optional(),
  ticketPriority: z.string().optional(),
  ticketType: z.string().optional(),
  ticketTags: z.array(z.string()).optional(),
  requesterName: z.string().optional(),
  requesterEmail: z.string().optional(),
  agentName: z.string().optional(),
  agentEmail: z.string().optional(),
  meta: LinkMetaSchema,
});
export type ZendeskLinkProviderData = z.infer<typeof ZendeskLinkProviderDataSchema>;

/**
 * Slack link provider data
 * Stores the Slack channel and user context where the link was created.
 * Used to post recording notifications back to the originating channel.
 */
export const SlackLinkProviderDataSchema = z.object({
  channelId: z.string().optional(),
  channelName: z.string().optional(),
  userId: z.string().optional(),
  responseUrl: z.string().optional(),
  meta: LinkMetaSchema,
});
export type SlackLinkProviderData = z.infer<typeof SlackLinkProviderDataSchema>;

/**
 * General link provider data
 * Fallback for providers that don't require additional context (web, API, etc.).
 * Stores no fields; exists so every provider resolves to a concrete type.
 */
export const GeneralLinkProviderDataSchema = z.object({
  meta: LinkMetaSchema,
});
export type GeneralLinkProviderData = z.infer<typeof GeneralLinkProviderDataSchema>;

// -- Config map & type helpers -----------------------------------------------

/**
 * Maps link provider types that have specific data schemas.
 * Providers not listed here fall back to GeneralLinkProviderData.
 */
export interface LinkProviderDataConfig {
  intercom: IntercomLinkProviderData;
  zendesk: ZendeskLinkProviderData;
  slack: SlackLinkProviderData;
}

/**
 * Providers that have a dedicated data schema
 */
type SpecificLinkProvider = keyof LinkProviderDataConfig;

/**
 * Resolve the data type for a given link provider type.
 * Returns the specific schema type if the provider has one, otherwise GeneralLinkProviderData.
 */
export type LinkProviderDataFor<P extends LinkProviderType> = P extends SpecificLinkProvider
  ? LinkProviderDataConfig[P]
  : GeneralLinkProviderData;

/**
 * Union of all possible link provider data types
 */
export type LinkProviderData =
  | LinkProviderDataConfig[SpecificLinkProvider]
  | GeneralLinkProviderData;

// -- Runtime helpers ---------------------------------------------------------

/**
 * Parse link provider data from JSONB based on provider type.
 * Returns null when data is null/undefined (common for providers with no data).
 */
export function parseLinkProviderData<P extends LinkProviderType>(
  providerType: P,
  data: unknown
): LinkProviderDataFor<P> | null {
  if (data === null || data === undefined) {
    return null;
  }
  // Use safeParse so that a schema mismatch (e.g. API-created link with
  // an Intercom URL but no adminId) returns null instead of throwing.
  let result;
  if (providerType === 'intercom') {
    result = IntercomLinkProviderDataSchema.safeParse(data);
  } else if (providerType === 'zendesk') {
    result = ZendeskLinkProviderDataSchema.safeParse(data);
  } else if (providerType === 'slack') {
    result = SlackLinkProviderDataSchema.safeParse(data);
  } else {
    result = GeneralLinkProviderDataSchema.safeParse(data);
  }
  return result.success ? (result.data as LinkProviderDataFor<P>) : null;
}

/**
 * Create link provider data with compile-time and runtime validation.
 * Use this when writing provider data to ensure the shape is correct.
 */
export function createLinkProviderData<P extends LinkProviderType>(
  providerType: P,
  data: LinkProviderDataFor<P>
): LinkProviderDataFor<P> {
  if (providerType === 'intercom') {
    return IntercomLinkProviderDataSchema.parse(data) as LinkProviderDataFor<P>;
  }
  if (providerType === 'zendesk') {
    return ZendeskLinkProviderDataSchema.parse(data) as LinkProviderDataFor<P>;
  }
  if (providerType === 'slack') {
    return SlackLinkProviderDataSchema.parse(data) as LinkProviderDataFor<P>;
  }
  return GeneralLinkProviderDataSchema.parse(data) as LinkProviderDataFor<P>;
}
