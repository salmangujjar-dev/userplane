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
import { NotFoundError, ConflictError } from '@/api/lib/errors';
import type {
  SendInvitesParams,
  SendInvitesResult,
  AcceptInviteParams,
  AcceptInviteResult,
  InviteActionResult,
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
   * Get workspace invite URL
   * Generates JWT token containing workspace and inviter context
   */
  async getInviteUrl(workspaceId: string, userId: string): Promise<string> {
    const workspace = await this.deps.workspaceService.getById(workspaceId);
    const inviteToken = await this.deps.workspaceService.getInviteToken(workspaceId);
    const inviter = await this.deps.userService.getById(userId);

    const inviteUrl = this.deps.tokenService.generateInviteUrl({
      wi: workspace.id,
      wn: workspace.workspaceName,
      wt: inviteToken,
      in: inviter.name,
      ie: inviter.email,
    });

    return inviteUrl;
  }

  /**
   * Regenerate workspace invite URL
   * Rotates the workspace invite token and returns new invite URL
   */
  async regenerateInviteUrl(workspaceId: string, userId: string): Promise<string> {
    const inviter = await this.deps.userService.getById(userId);

    // Rotate the invite token in the workspace - this returns the full workspace record
    const updatedWorkspace = await this.deps.workspaceService.rotateInviteUrl(workspaceId);

    const inviteUrl = this.deps.tokenService.generateInviteUrl({
      wi: updatedWorkspace.id,
      wn: updatedWorkspace.workspaceName,
      wt: updatedWorkspace.workspaceInviteToken,
      in: inviter.name,
      ie: inviter.email,
    });

    return inviteUrl;
  }

  /**
   * Send workspace invitations to multiple emails
   * Returns list of sent and failed invitations
   */
  async sendInvites(params: SendInvitesParams): Promise<SendInvitesResult> {
    const { workspaceId, emails, invitedBy } = params;

    const workspace = await this.deps.workspaceService.getById(workspaceId);
    const inviteToken = await this.deps.workspaceService.getInviteToken(workspaceId);
    const inviter = await this.deps.userService.getById(invitedBy);

    const inviteUrl = this.deps.tokenService.generateInviteUrl({
      wi: workspace.id,
      wn: workspace.workspaceName,
      wt: inviteToken,
      in: inviter.name,
      ie: inviter.email,
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

    const sentEmails: string[] = [];
    const failedEmails: Array<{ email: string; reason: string }> = [];

    results.forEach((result, index) => {
      const email = emails[index];
      if (email) {
        if (result.status === 'fulfilled') {
          sentEmails.push(email);
        } else {
          failedEmails.push({ email, reason: result.reason.message });
        }
      }
    });

    return { sentEmails, failedEmails };
  }

  /**
   * Validate workspace invitation without accepting
   * Verifies token and returns workspace and inviter information
   */
  async validateInvite(inviteToken: string): Promise<InviteActionResult> {
    const inviteData = this.deps.tokenService.verifyInviteToken(inviteToken);

    if (!inviteData) {
      return {
        status: 'invalid',
        message: 'Invalid or expired invite token',
      };
    }

    try {
      const workspace = await this.deps.workspaceService.getById(inviteData.wi);
      const currentInviteToken = await this.deps.workspaceService.getInviteToken(inviteData.wi);

      if (currentInviteToken !== inviteData.wt) {
        return {
          status: 'expired',
          message: 'Invite token has been invalidated',
        };
      }

      return {
        status: 'valid',
        workspaceId: workspace.id,
        workspaceName: inviteData.wn,
        inviterName: inviteData.in,
        inviterEmail: inviteData.ie,
      };
    } catch (error) {
      return {
        status: 'invalid',
        message: 'Workspace not found or has been deleted',
      };
    }
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

    const workspace = await this.deps.workspaceService.getById(inviteData.wi);
    const currentInviteToken = await this.deps.workspaceService.getInviteToken(inviteData.wi);

    if (currentInviteToken !== inviteData.wt) {
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
        workspaceName: workspace.workspaceName,
        workspaceId: workspace.id,
      },
    };
  }

  /**
   * Unified invite action handler
   * Validates or accepts invite based on userId
   */
  async handleInviteAction(inviteToken: string, userId?: string): Promise<InviteActionResult> {
    const inviteData = this.deps.tokenService.verifyInviteToken(inviteToken);

    if (!inviteData) {
      return {
        status: 'invalid',
        message: 'Invalid or expired invite token',
      };
    }

    try {
      const workspace = await this.deps.workspaceService.getById(inviteData.wi);
      const currentInviteToken = await this.deps.workspaceService.getInviteToken(inviteData.wi);

      if (currentInviteToken !== inviteData.wt) {
        return {
          status: 'expired',
          message: 'Invite token has been invalidated',
        };
      }

      // If userId provided, accept the invite
      if (userId) {
        try {
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
            status: 'accepted',
            workspaceId: workspace.id,
            workspaceName: inviteData.wn,
            inviterName: inviteData.in,
            inviterEmail: inviteData.ie,
          };
        } catch (error) {
          if (error instanceof ConflictError) {
            return {
              status: 'already_member',
              workspaceId: workspace.id,
              workspaceName: inviteData.wn,
              inviterName: inviteData.in,
              inviterEmail: inviteData.ie,
              message: 'You are already a member of this workspace',
            };
          }
          // Re-throw to be caught by outer catch
          throw error;
        }
      }

      // Otherwise just validate
      return {
        status: 'valid',
        workspaceId: workspace.id,
        workspaceName: inviteData.wn,
        inviterName: inviteData.in,
        inviterEmail: inviteData.ie,
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        return {
          status: 'invalid',
          message: 'Workspace not found or has been deleted',
        };
      }

      // For any other unexpected error, return generic invalid status
      return {
        status: 'invalid',
        message: 'An error occurred while processing the invite',
      };
    }
  }
}
