import { flags, type Flags } from './index';

/**
 * Converts feature flags to a flat JSON object suitable for SDK metadata
 */
export function getFlagsMetadata(): Record<string, boolean> {
  const metadata: Record<string, boolean> = {};

  for (const [key, value] of Object.entries(flags)) {
    metadata[`flag_${key}`] = value.enabled;
  }

  return metadata;
}

/**
 * Converts user metadata to a flat JSON object suitable for SDK metadata
 */
export function getUserMetadata(): Record<string, string> {
  return {
    user_id: '3a7891b2-4c4a-4a5b-8c6d-9e0f1a2b3c4d',
    user_name: 'Brian Chesky',
    user_email: 'brian@airbnb.com',
    user_company: 'Airbnb',
  };
}

/**
 * Returns the full flags configuration including descriptions
 */
export function getFullFlagsMetadata(): Record<string, { enabled: boolean; description: string }> {
  return { ...flags };
}
