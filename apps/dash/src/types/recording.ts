/**
 * Recording-related types
 * Re-exports from @workspace/contract for type consistency
 *
 * Note: Contract uses z.coerce.date() so JSON string dates are
 * automatically coerced to Date objects during parsing.
 */

export type { RecordingCreator, RecordingItem, RecordingsListData } from '@workspace/contract';

// Aliases for backward compatibility
export type { RecordingItem as Recording } from '@workspace/contract';
export type { RecordingsListData as RecordingsData } from '@workspace/contract';
