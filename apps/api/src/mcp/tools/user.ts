import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { userplaneGetProfile } from '@userplane/contract';

import { textResult } from '../helpers';
import { toMcpProfile } from '../responses';
import type { McpDeps } from '../types';

export function registerUserTools(server: McpServer, deps: McpDeps, userId: string) {
  const { name, ...config } = userplaneGetProfile;
  server.registerTool(name, config, async () => {
    const [userData, workspaceCount, recordingCount, linkCount] = await Promise.all([
      deps.userService.getById(userId),
      deps.workspaceRepo.countByUserId(userId),
      deps.recordingRepo.countByUserId(userId),
      deps.linkRepo.countByUserId(userId),
    ]);

    return textResult(
      toMcpProfile(userData, {
        workspaces: workspaceCount,
        recordings: recordingCount,
        links: linkCount,
      })
    );
  });
}
