import type { McpDeps } from './types';

/** Validate that a user is an active workspace member. Returns membership info. */
export async function requireWorkspaceMember(deps: McpDeps, userId: string, workspaceId: string) {
  const workspace = await deps.workspaceService.getById(workspaceId);
  const member = await deps.workspaceMemberService.getMembershipForAuth(
    userId,
    workspace.workspaceId
  );
  if (!member) {
    throw new Error('You are not a member of this workspace.');
  }
  return { workspace, member };
}

/** Wrap a value as MCP text content */
export function textResult(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
}
