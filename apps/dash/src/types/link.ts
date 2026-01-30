/**
 * Link-related types
 * Re-exports from @workspace/contract for type consistency
 *
 * Note: Contract uses z.coerce.date() so JSON string dates are
 * automatically coerced to Date objects during parsing.
 */

export type {
  // Data types
  LinkDomain,
  // Error types
  LinkErrors,
  LinkItem,
  LinkProject,
  // Enums
  LinkProviderType,
  LinksListData,
  LinkType,
} from '@workspace/contract';

// Aliases for backward compatibility
export type { LinkItem as Link } from '@workspace/contract';
export type { LinksListData as LinksData } from '@workspace/contract';
