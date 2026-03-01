/**
 * Link-related types
 * Re-exports from @userplane/contract for type consistency
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
} from '@userplane/contract';

// Aliases for backward compatibility
export type { LinkItem as Link } from '@userplane/contract';
export type { LinksListData as LinksData } from '@userplane/contract';
