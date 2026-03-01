/**
 * Project-related types
 * Re-exports from @userplane/contract for type consistency
 *
 * Note: Contract uses z.coerce.date() so JSON string dates are
 * automatically coerced to Date objects during parsing.
 */

export type { ProjectItem, ProjectsListData, RetentionDays } from '@userplane/contract';

// Aliases for backward compatibility
export type { ProjectItem as Project } from '@userplane/contract';
export type { ProjectsListData as ProjectsData } from '@userplane/contract';
