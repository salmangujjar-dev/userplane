/**
 * ZendeskAppService - Business logic for Zendesk iframe app endpoints
 * Handles link creation, project/domain lists
 */

import { createLinkProviderData } from '@userplane/contract';

import { createLogger } from '@/api/lib/logger';
import type { DomainRepository } from '@/api/repositories/domains.repository';
import type { ProjectRepository } from '@/api/repositories/projects.repository';
import type { UserRepository } from '@/api/repositories/users.repository';
import type { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import type { LinkService } from '@/api/services/link.service';

const logger = createLogger('zendesk-app-service');

export interface ZendeskAppServiceDeps {
  projectRepo: ProjectRepository;
  domainRepo: DomainRepository;
  linkService: LinkService;
  userRepo: UserRepository;
  workspaceMemberRepo: WorkspaceMemberRepository;
}

export class ZendeskAppService {
  constructor(private deps: ZendeskAppServiceDeps) {}

  /**
   * Resolve a Zendesk agent's email to a workspace member ID.
   * Mirrors the Intercom verifyTeammateAccess pattern.
   */
  private async resolveAgentToMember(agentEmail: string, workspaceId: string): Promise<string> {
    const user = await this.deps.userRepo.findByEmail(agentEmail);
    if (!user) {
      logger.warn({ agentEmail, workspaceId }, 'Agent email not found');
      throw new Error('Agent not found as a Userplane user');
    }

    const member = await this.deps.workspaceMemberRepo.findByUserAndWorkspace(user.id, workspaceId);
    if (!member) {
      logger.warn({ agentEmail, workspaceId }, 'Agent is not a workspace member');
      throw new Error('Agent is not a member of this workspace');
    }

    return member.workspaceMemberId;
  }

  /**
   * Create a recording link with Zendesk provider context
   */
  async createLink(params: {
    workspaceId: string;
    projectId: string;
    domainId: string;
    agentEmail: string;
    ticketId?: string;
    subdomain?: string;
  }) {
    const { ticketId, subdomain, agentEmail } = params;

    const workspaceMemberId = await this.resolveAgentToMember(agentEmail, params.workspaceId);

    const link = await this.deps.linkService.createWithProvider({
      workspaceId: params.workspaceId,
      projectId: params.projectId,
      domainId: params.domainId,
      createdBy: workspaceMemberId,
      linkProviderType: 'zendesk',
      linkTitle: ticketId ? `Zendesk #${ticketId}` : undefined,
      linkProviderId: ticketId ?? null,
      linkProviderRef:
        ticketId && subdomain ? `https://${subdomain}.zendesk.com/agent/tickets/${ticketId}` : null,
      linkProviderData: createLinkProviderData('zendesk', {
        ticketId: ticketId ?? undefined,
      }),
    });

    const linkUrl = this.deps.linkService.generateLinkURL(
      link.linkId,
      link.workspaceId,
      link.domainUrl,
      link.domainStatus,
      link.recordingHideSensitive,
      link.recordingCaptureClientLog,
      false,
      link.recordingCaptureServerLog,
      link.recordingCaptureNetworkLog
    );

    return { linkId: link.linkId, linkUrl };
  }

  /**
   * List projects for a workspace
   */
  async getProjects(workspaceId: string) {
    const projects = await this.deps.projectRepo.findByWorkspace(workspaceId);
    return projects.map((p) => ({
      id: p.projectId,
      name: p.projectTitle,
    }));
  }

  /**
   * List domains for a workspace
   */
  async getDomains(workspaceId: string) {
    const domains = await this.deps.domainRepo.findByWorkspaceId(workspaceId);
    return domains.map((d) => ({
      id: d.domainId,
      url: d.domainUrl,
      verified: d.domainStatus === 'verified',
    }));
  }
}
