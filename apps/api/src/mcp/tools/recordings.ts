import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { userplaneDeleteRecording, userplaneListRecordings } from '@userplane/contract';

import { requireWorkspaceMember, textResult } from '../helpers';
import type { McpDeps } from '../types';

export function registerRecordingTools(server: McpServer, deps: McpDeps, userId: string) {
  {
    const { name, ...config } = userplaneListRecordings;
    server.registerTool(
      name,
      config,
      async ({ workspaceId, page, per_page, project_id, link_id, created_by }) => {
        await requireWorkspaceMember(deps, userId, workspaceId);
        const p = page ?? 1;
        const pp = per_page ?? 10;
        const { recordings, total } = await deps.recordingService.getByWorkspaceIdPaginated(
          workspaceId,
          p,
          pp,
          {
            projectId: project_id ? [project_id] : undefined,
            linkId: link_id ? [link_id] : undefined,
            createdBy: created_by ? [created_by] : undefined,
          },
          { field: 'created_at', direction: 'desc' }
        );
        return textResult({ workspaceId, recordings, total, page: p, per_page: pp });
      }
    );
  }

  {
    const { name, ...config } = userplaneDeleteRecording;
    server.registerTool(name, config, async ({ workspaceId, recordingId }) => {
      const { member } = await requireWorkspaceMember(deps, userId, workspaceId);
      const recording = await deps.recordingService.getById(recordingId, workspaceId);
      const isAdminOrOwner = member.workspaceRole === 'admin' || member.workspaceRole === 'owner';
      const isCreator = recording.meta.creator.workspaceMemberId === member.workspaceMemberId;
      if (!isAdminOrOwner && !isCreator) {
        throw new Error('You do not have permission to delete this recording.');
      }
      await deps.recordingService.delete(recordingId, workspaceId);
      return textResult({ deleted: true, workspaceId, recordingId });
    });
  }
}
