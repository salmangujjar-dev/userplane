import type { LinkRepository } from '@/api/repositories/links.repository';
import type { RecordingRepository } from '@/api/repositories/recordings.repository';
import type { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import type { LinkService } from '@/api/services/link.service';
import type { ProjectService } from '@/api/services/project.service';
import type { RecordingService } from '@/api/services/recording.service';
import type { UserService } from '@/api/services/user.service';
import type { WorkspaceService } from '@/api/services/workspace.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';

export interface McpDeps {
  linkService: LinkService;
  recordingService: RecordingService;
  workspaceService: WorkspaceService;
  workspaceMemberService: WorkspaceMemberService;
  projectService: ProjectService;
  userService: UserService;
  workspaceRepo: WorkspaceRepository;
  recordingRepo: RecordingRepository;
  linkRepo: LinkRepository;
}

/** Per-request context injected by the MCP handler after JWT verification */
export interface McpRequestContext {
  userId: string;
}
