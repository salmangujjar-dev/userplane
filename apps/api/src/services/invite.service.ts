/**
 * InviteService - Facade service for workspace invitations
 * Orchestrates sending and accepting workspace invitations
 */

import type { DbClient } from '@workspace/db';
import { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import { WorkspaceService } from '@/api/services/workspace.service';
import { UserService } from '@/api/services/user.service';
import { EmailService } from '@/api/services/email.service';
import { TokenService } from '@/api/services/token.service';
import { NotFoundError } from '@/api/lib/errors';
import type {
  SendInvitesParams,
  SendInvitesResult,
  AcceptInviteParams,
  AcceptInviteResult,
} from '@/api/types';

export interface InviteServiceDeps {
  workspaceMemberService: WorkspaceMemberService;
  workspaceService: WorkspaceService;
  userService: UserService;
  emailService: EmailService;
  tokenService: TokenService;
  db: DbClient;
}

export class InviteService {
  constructor(private deps: InviteServiceDeps) {}

  /**
   * Send workspace invitations to multiple emails
   * Returns list of sent and failed invitations
   */
  async sendInvites(params: SendInvitesParams): Promise<SendInvitesResult> {
    const { workspaceId, emails, invitedBy } = params;

    const workspace = await this.deps.workspaceService.getById(workspaceId);
    const inviter = await this.deps.userService.getById(invitedBy);

    const inviteUrl = this.deps.tokenService.generateInviteUrl({
      workspaceId: workspace.id,
      workspaceName: workspace.workspaceName,
      workspaceInviteToken: workspace.workspaceInviteToken || '',
      inviterName: inviter.name,
      inviterEmail: inviter.email,
    });

    const results = await Promise.allSettled(
      emails.map((email) =>
        this.deps.emailService.sendWorkspaceInvite({
          to: email,
          workspaceName: workspace.workspaceName,
          inviteUrl,
          inviterName: inviter.name,
          inviterEmail: inviter.email,
        })
      )
    );

    const sent: string[] = [];
    const failed: Array<{ email: string; reason: string }> = [];

    results.forEach((result, index) => {
      const email = emails[index];
      if (email) {
        if (result.status === 'fulfilled') {
          sent.push(email);
        } else {
          failed.push({ email, reason: result.reason.message });
        }
      }
    });

    return { sent, failed };
  }

  /**
   * Accept workspace invitation
   * Verifies token and adds user as member
   */
  async acceptInvite(params: AcceptInviteParams): Promise<AcceptInviteResult> {
    const { inviteToken, userId } = params;

    const inviteData = this.deps.tokenService.verifyInviteToken(inviteToken);

    if (!inviteData) {
      throw new NotFoundError('Invalid or expired invite token');
    }

    const workspace = await this.deps.workspaceService.getById(inviteData.workspaceId);

    if (workspace.workspaceInviteToken !== inviteData.workspaceInviteToken) {
      throw new NotFoundError('Invite token has been invalidated');
    }

    await this.deps.db.transaction(async (tx) => {
      await this.deps.workspaceMemberService.addMember(
        {
          userId,
          workspaceId: workspace.id,
          role: 'member',
        },
        { tx }
      );
    });

    return {
      workspace: {
        workspaceSlug: workspace.workspaceSlug,
        workspaceName: workspace.workspaceName,
        workspaceInviteToken: workspace.workspaceInviteToken || '',
        workspaceLogoUrl: workspace.workspaceLogoUrl || '',
      },
    };
  }
}
