import { RECORDING_METADATA_LIMITS } from '@userplane/contract';

/**
 * Sanitize recording notes: trim whitespace and truncate to max length.
 * Returns null if the result is empty.
 */
export function sanitizeNotes(notes: string | undefined | null): string | null {
  if (notes == null) return null;
  const trimmed = notes.trim();
  if (trimmed.length === 0) return null;
  return trimmed.slice(0, RECORDING_METADATA_LIMITS.MAX_NOTES_LENGTH);
}

/**
 * Sanitize a metadata object by capping key count, truncating key names,
 * and truncating string values. Non-string values are kept as-is.
 */
export function sanitizeMetadataObject(
  obj: Record<string, unknown> | undefined | null,
  type: 'custom' | 'system'
): Record<string, unknown> | undefined {
  if (obj == null) return undefined;

  const maxKeys =
    type === 'custom'
      ? RECORDING_METADATA_LIMITS.MAX_CUSTOM_METADATA_KEYS
      : RECORDING_METADATA_LIMITS.MAX_SYSTEM_METADATA_KEYS;
  const maxKeyLength =
    type === 'custom'
      ? RECORDING_METADATA_LIMITS.MAX_CUSTOM_METADATA_KEY_LENGTH
      : RECORDING_METADATA_LIMITS.MAX_SYSTEM_METADATA_KEY_LENGTH;
  const maxValueLength =
    type === 'custom'
      ? RECORDING_METADATA_LIMITS.MAX_CUSTOM_METADATA_VALUE_LENGTH
      : RECORDING_METADATA_LIMITS.MAX_SYSTEM_METADATA_VALUE_LENGTH;

  const keys = Object.keys(obj).slice(0, maxKeys);
  const result: Record<string, unknown> = {};

  for (const key of keys) {
    const sanitizedKey = key.slice(0, maxKeyLength);
    const value = obj[key];

    if (typeof value === 'string') {
      result[sanitizedKey] = value.slice(0, maxValueLength);
    } else {
      result[sanitizedKey] = value;
    }
  }

  return result;
}
