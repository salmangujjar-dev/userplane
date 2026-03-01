/**
 * Workspace member-related types
 * Re-exports from @userplane/contract for type consistency
 */

// Re-export WorkspaceMember type from contract
export type { WorkspaceMember, WorkspaceTeamData } from '@userplane/contract';

// Alias for backward compatibility
export type { WorkspaceTeamData as MembersListResponse } from '@userplane/contract';
