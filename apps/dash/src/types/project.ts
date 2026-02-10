/**
 * Project-related types
 * Re-exports from @workspace/contract for type consistency
 *
 * Note: Contract uses z.coerce.date() so JSON string dates are
 * automatically coerced to Date objects during parsing.
 */

export type { ProjectItem, ProjectsListData, RetentionDays } from '@workspace/contract';

// Aliases for backward compatibility
export type { ProjectItem as Project } from '@workspace/contract';
export type { ProjectsListData as ProjectsData } from '@workspace/contract';
