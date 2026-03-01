/**
 * Recording-related types
 * Re-exports from @userplane/contract for type consistency
 *
 * Note: Contract uses z.coerce.date() so JSON string dates are
 * automatically coerced to Date objects during parsing.
 */

export type {
  LinkRef,
  RecordingCreator,
  RecordingDetail,
  RecordingDetailMeta,
  RecordingItem,
  RecordingsListData,
} from '@userplane/contract';

// Aliases for backward compatibility
export type { RecordingItem as Recording } from '@userplane/contract';
export type { RecordingsListData as RecordingsData } from '@userplane/contract';
