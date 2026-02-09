import { z } from 'zod';

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

// -- Provider-specific data schemas ------------------------------------------

/**
 * Intercom link provider data
 * Stores the Intercom admin (teammate) who initiated the link from a conversation.
 * Used to post admin notes back to the conversation when a recording is received.
 */
export const IntercomLinkProviderDataSchema = z.object({
  adminId: z.string(),
});
export type IntercomLinkProviderData = z.infer<typeof IntercomLinkProviderDataSchema>;

/**
 * General link provider data
 * Fallback for providers that don't require additional context (web, API, etc.).
 * Stores no fields; exists so every provider resolves to a concrete type.
 */
export const GeneralLinkProviderDataSchema = z.object({});
export type GeneralLinkProviderData = z.infer<typeof GeneralLinkProviderDataSchema>;

// -- Config map & type helpers -----------------------------------------------

/**
 * Maps link provider types that have specific data schemas.
 * Providers not listed here fall back to GeneralLinkProviderData.
 */
export interface LinkProviderDataConfig {
  intercom: IntercomLinkProviderData;
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
  if (providerType === 'intercom') {
    return IntercomLinkProviderDataSchema.parse(data) as LinkProviderDataFor<P>;
  }
  // All other providers: no required fields
  return GeneralLinkProviderDataSchema.parse(data) as LinkProviderDataFor<P>;
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
  return GeneralLinkProviderDataSchema.parse(data) as LinkProviderDataFor<P>;
}
