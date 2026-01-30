/**
 * Workspace member-related types
 * Re-exports from @workspace/contract for type consistency
 */

// Re-export WorkspaceMember type from contract
export type { WorkspaceMember, WorkspaceTeamData } from '@workspace/contract';

// Alias for backward compatibility
export type { WorkspaceTeamData as MembersListResponse } from '@workspace/contract';
