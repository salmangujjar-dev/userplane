/**
 * Link metadata constraints
 * Single source of truth for metadata field limits shared across API, dash, and any future consumers.
 */
export const LINK_META = {
  /** Maximum number of key-value entries per link */
  MAX_ENTRIES: 7,
  /** Maximum length of a metadata key */
  MAX_KEY_LENGTH: 256,
  /** Maximum length of a metadata value */
  MAX_VALUE_LENGTH: 1024,
} as const;
