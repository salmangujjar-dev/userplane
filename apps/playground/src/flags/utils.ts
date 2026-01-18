import { type Flags, flags } from './index';

// Page-specific flag keys
export const DIRECTORY_FLAGS: (keyof Flags)[] = [
  'search',
  'pagination',
  'sidebar',
  'isHiringFilter',
  'batchFilter',
  'companyLogo',
  'companyLocation',
  'industryTags',
  'batchTag',
  'resultsCount',
];

export const ABOUT_PAGE_FLAGS: (keyof Flags)[] = [
  'aboutPage',
  'aboutSidebar',
  'aboutProgram',
  'aboutAdvice',
  'aboutCommunity',
  'aboutBrand',
  'aboutHiring',
];

export const SAFE_PAGE_FLAGS: (keyof Flags)[] = [
  'safePage',
  'safeSidebar',
  'safeDownloads',
  'safeAboutSection',
];

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
 * Get flags metadata for a specific subset of flags
 */
export function getPageFlagsMetadata(flagKeys: (keyof Flags)[]): Record<string, boolean> {
  const metadata: Record<string, boolean> = {};

  for (const key of flagKeys) {
    if (flags[key]) {
      metadata[`flag_${key}`] = flags[key].enabled;
    }
  }

  return metadata;
}

/**
 * Get flags metadata for the About page
 */
export function getAboutPageFlagsMetadata(): Record<string, boolean> {
  return getPageFlagsMetadata(ABOUT_PAGE_FLAGS);
}

/**
 * Get flags metadata for the Safe page
 */
export function getSafePageFlagsMetadata(): Record<string, boolean> {
  return getPageFlagsMetadata(SAFE_PAGE_FLAGS);
}

/**
 * Get flags metadata for the Directory page
 */
export function getDirectoryFlagsMetadata(): Record<string, boolean> {
  return getPageFlagsMetadata(DIRECTORY_FLAGS);
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
