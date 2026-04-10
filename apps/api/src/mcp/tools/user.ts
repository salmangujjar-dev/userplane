import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { userplaneGetProfile } from '@userplane/contract';

import { textResult } from '../helpers';
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

    return textResult({
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        emailVerified: userData.emailVerified,
        image: userData.image ?? null,
        createdAt: userData.createdAt,
      },
      stats: {
        workspaces: workspaceCount,
        recordings: recordingCount,
        links: linkCount,
      },
    });
  });
}
