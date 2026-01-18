/**
 * InviteService - Facade service for workspace invitations
 * Orchestrates sending and accepting workspace invitations
 */

import { domainError, inviteError, workspaceError } from '@workspace/contract';
import type { DbClient } from '@workspace/db';

import { EmailService } from '@/api/services/email.service';
import { TokenService } from '@/api/services/token.service';
import { UserService } from '@/api/services/user.service';
import { WorkspaceService } from '@/api/services/workspace.service';
import { WorkspaceMemberService } from '@/api/services/workspace-member.service';

/**
 * Internal invite action result type for service orchestration
 * Used to handle different invite validation/acceptance states
 */
export interface InviteActionResult {
  status: 'valid' | 'accepted' | 'invalid' | 'expired' | 'already_member';
  workspaceId?: string;
  workspaceName?: string;
  inviterName?: string;
  inviterEmail?: string;
  message?: string;
}

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
      wi: workspace.workspaceId,
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
      wi: updatedWorkspace.workspaceId,
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
  async sendInvites(params: {
    workspaceId: string;
    emails: string[];
    invitedBy: string;
  }): Promise<{ sentEmails: string[]; failedEmails: Array<{ email: string; reason: string }> }> {
    const { workspaceId, emails, invitedBy } = params;

    const workspace = await this.deps.workspaceService.getById(workspaceId);
    const inviteToken = await this.deps.workspaceService.getInviteToken(workspaceId);
    const inviter = await this.deps.userService.getById(invitedBy);

    const inviteUrl = this.deps.tokenService.generateInviteUrl({
      wi: workspace.workspaceId,
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
   * Throws INVITE_TOKEN_INVALID if token is invalid or expired
   * Throws INVITE_TOKEN_INVALIDATED if token has been invalidated
   */
  async validateInvite(inviteToken: string): Promise<{
    workspaceId: string;
    workspaceName: string;
    inviterName: string;
    inviterEmail: string;
  }> {
    const inviteData = this.deps.tokenService.verifyInviteToken(inviteToken);

    if (!inviteData) {
      throw inviteError.INVITE_TOKEN_INVALID();
    }

    const workspace = await this.deps.workspaceService.getById(inviteData.wi);
    const currentInviteToken = await this.deps.workspaceService.getInviteToken(inviteData.wi);

    if (currentInviteToken !== inviteData.wt) {
      throw inviteError.INVITE_TOKEN_INVALIDATED();
    }

    return {
      workspaceId: workspace.workspaceId,
      workspaceName: inviteData.wn,
      inviterName: inviteData.in,
      inviterEmail: inviteData.ie,
    };
  }

  /**
   * Accept workspace invitation
   * Verifies token and adds user as member
   * Idempotent operation - returns success if user is already a member
   * Throws INVITE_TOKEN_INVALID if token is invalid or expired
   * Throws INVITE_TOKEN_INVALIDATED if token has been invalidated
   */
  async acceptInvite(params: { inviteToken: string; userId: string }): Promise<{
    workspace: { workspaceName: string; workspaceId: string };
    alreadyMember: boolean;
  }> {
    const { inviteToken, userId } = params;

    const inviteData = this.deps.tokenService.verifyInviteToken(inviteToken);

    if (!inviteData) {
      throw inviteError.INVITE_TOKEN_INVALID();
    }

    const workspace = await this.deps.workspaceService.getById(inviteData.wi);
    const currentInviteToken = await this.deps.workspaceService.getInviteToken(inviteData.wi);

    if (currentInviteToken !== inviteData.wt) {
      throw inviteError.INVITE_TOKEN_INVALIDATED();
    }

    let alreadyMember = false;

    try {
      await this.deps.db.transaction(async (tx) => {
        await this.deps.workspaceMemberService.addMember(
          {
            userId,
            workspaceId: workspace.workspaceId,
            role: 'member',
          },
          { tx }
        );
      });
    } catch (error) {
      // Check if the error is WORKSPACE_MEMBER_ALREADY_EXISTS
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'WORKSPACE_MEMBER_ALREADY_EXISTS'
      ) {
        alreadyMember = true;
      } else {
        // Re-throw any other errors
        throw error;
      }
    }

    return {
      workspace: {
        workspaceName: workspace.workspaceName,
        workspaceId: workspace.workspaceId,
      },
      alreadyMember,
    };
  }

  /**
   * Unified invite action handler
   * Validates or accepts invite based on userId
   * Throws INVITE_TOKEN_INVALID if token is invalid or expired
   * Throws INVITE_TOKEN_INVALIDATED if token has been invalidated
   */
  async handleInviteAction(
    inviteToken: string,
    userId?: string
  ): Promise<{
    status: 'valid' | 'accepted';
    workspaceId: string;
    workspaceName: string;
    inviterName: string;
    inviterEmail: string;
  }> {
    const inviteData = this.deps.tokenService.verifyInviteToken(inviteToken);

    if (!inviteData) {
      throw inviteError.INVITE_TOKEN_INVALID();
    }

    const workspace = await this.deps.workspaceService.getById(inviteData.wi);
    const currentInviteToken = await this.deps.workspaceService.getInviteToken(inviteData.wi);

    if (currentInviteToken !== inviteData.wt) {
      throw inviteError.INVITE_TOKEN_INVALIDATED();
    }

    // If userId provided, accept the invite
    if (userId) {
      await this.deps.db.transaction(async (tx) => {
        await this.deps.workspaceMemberService.addMember(
          {
            userId,
            workspaceId: workspace.workspaceId,
            role: 'member',
          },
          { tx }
        );
      });

      return {
        status: 'accepted',
        workspaceId: workspace.workspaceId,
        workspaceName: inviteData.wn,
        inviterName: inviteData.in,
        inviterEmail: inviteData.ie,
      };
    }

    // Otherwise just validate
    return {
      status: 'valid',
      workspaceId: workspace.workspaceId,
      workspaceName: inviteData.wn,
      inviterName: inviteData.in,
      inviterEmail: inviteData.ie,
    };
  }

  /**
   * Join or request access to a workspace based on invite policy
   * - For private workspaces: throws error
   * - For whitelisted workspaces: adds user as member if domain matches
   * - For protected workspaces: sends access request to workspace owner
   * Idempotent operation - returns success if user is already a member
   * Throws WORKSPACE_INVITE_POLICY_PRIVATE if workspace is private
   * Throws WORKSPACE_INVITE_POLICY_DOMAIN_MISMATCH if domain doesn't match
   */
  async joinWorkspace(params: {
    workspaceId: string;
    userId: string;
    userEmail: string;
    userName: string;
  }): Promise<{
    workspaceId: string;
    workspaceName: string;
    status: 'joined' | 'requested';
    alreadyMember: boolean;
  }> {
    const { workspaceId, userId, userEmail, userName } = params;

    // Get workspace with invite policy
    const workspace = await this.deps.workspaceService.getWithInvitePolicy(workspaceId);

    // Check if user is already a member
    const existingMember = await this.deps.workspaceMemberService.getMember(userId, workspaceId);
    if (existingMember) {
      return {
        workspaceId: workspace.workspaceId,
        workspaceName: workspace.workspaceName,
        status: 'joined',
        alreadyMember: true,
      };
    }

    // Private workspaces cannot be joined directly
    if (workspace.workspaceInvitePolicy === 'private') {
      throw workspaceError.WORKSPACE_INVITE_POLICY_PRIVATE();
    }

    // Extract user's email domain
    const userDomain = userEmail.split('@')[1]?.toLowerCase();
    if (!userDomain) {
      throw workspaceError.WORKSPACE_INVITE_POLICY_DOMAIN_MISMATCH();
    }

    // Check if user's domain matches workspace invite domains
    const allowedDomains = workspace.workspaceInviteDomains || [];
    const domainMatches = allowedDomains.some(
      (domain: string) => domain.toLowerCase() === userDomain
    );

    if (!domainMatches) {
      throw workspaceError.WORKSPACE_INVITE_POLICY_DOMAIN_MISMATCH();
    }

    // For whitelisted workspaces, add user as member directly
    if (workspace.workspaceInvitePolicy === 'whitelisted') {
      await this.deps.db.transaction(async (tx) => {
        await this.deps.workspaceMemberService.addMember(
          {
            userId,
            workspaceId,
            role: 'member',
          },
          { tx }
        );
      });

      return {
        workspaceId,
        workspaceName: workspace.workspaceName,
        status: 'joined',
        alreadyMember: false,
      };
    }

    // For protected workspaces, send access request to owner
    if (workspace.workspaceInvitePolicy === 'protected') {
      // Get workspace owner(s)
      const owners = await this.deps.workspaceMemberService.getOwners(workspaceId);
      if (owners.length === 0) {
        throw domainError.INTERNAL_SERVER_ERROR();
      }

      // Send access request email to each owner with owner-specific tokens
      // Each owner gets a unique token that only they can use
      await Promise.all(
        owners.map((owner) => {
          const reviewUrl = this.deps.tokenService.generateAccessRequestUrl(
            workspaceId,
            owner.userId,
            userId,
            userEmail
          );

          return this.deps.emailService.sendAccessRequest({
            to: owner.email,
            workspaceName: workspace.workspaceName,
            requesterName: userName,
            requesterEmail: userEmail,
            reviewUrl,
          });
        })
      );

      return {
        workspaceId,
        workspaceName: workspace.workspaceName,
        status: 'requested',
        alreadyMember: false,
      };
    }

    // Fallback (should not reach here)
    throw domainError.INTERNAL_SERVER_ERROR();
  }

  /**
   * Validate an access request token and return request details
   * Used by dashboard to display access request review page
   * Throws WORKSPACE_ACCESS_REQUEST_INVALID if token is invalid/expired
   * Throws WORKSPACE_ACCESS_REQUEST_NOT_OWNER if viewer is not the designated owner
   */
  async validateAccessRequest(params: { token: string; viewerId: string }): Promise<{
    workspaceId: string;
    workspaceName: string;
    requesterUserId: string;
    requesterEmail: string;
    requesterName: string | null;
  }> {
    const { token, viewerId } = params;

    // Verify and decode access request token
    const tokenData = this.deps.tokenService.verifyAccessRequestToken(token);
    if (!tokenData) {
      throw workspaceError.WORKSPACE_ACCESS_REQUEST_INVALID();
    }

    const workspaceId = tokenData.wi;
    const ownerId = tokenData.oi;
    const userId = tokenData.ui;
    const userEmail = tokenData.ue;

    // Verify the viewer is the specific owner this token was generated for
    if (viewerId !== ownerId) {
      throw workspaceError.WORKSPACE_ACCESS_REQUEST_NOT_OWNER();
    }

    // Verify viewer is still an owner of the workspace (role may have changed)
    const viewerMember = await this.deps.workspaceMemberService.getMember(viewerId, workspaceId);
    if (!viewerMember || viewerMember.workspaceRole !== 'owner') {
      throw workspaceError.WORKSPACE_ACCESS_REQUEST_NOT_OWNER();
    }

    // Get workspace name
    const workspace = await this.deps.workspaceService.getById(workspaceId);

    // Get requester's name if available
    const requester = await this.deps.userService.getById(userId);

    return {
      workspaceId,
      workspaceName: workspace.workspaceName,
      requesterUserId: userId,
      requesterEmail: userEmail,
      requesterName: requester?.name || null,
    };
  }

  /**
   * Approve a workspace access request
   * Adds the requesting user as a member
   * Throws WORKSPACE_ACCESS_REQUEST_INVALID if token is invalid/expired
   * Throws WORKSPACE_ACCESS_REQUEST_NOT_OWNER if approver is not the designated owner
   */
  async approveAccessRequest(params: { token: string; approverId: string }): Promise<{
    workspaceId: string;
    workspaceName: string;
    userId: string;
    userEmail: string;
    status: 'approved';
  }> {
    const { token, approverId } = params;

    // Verify and decode access request token
    const tokenData = this.deps.tokenService.verifyAccessRequestToken(token);
    if (!tokenData) {
      throw workspaceError.WORKSPACE_ACCESS_REQUEST_INVALID();
    }

    const workspaceId = tokenData.wi;
    const ownerId = tokenData.oi;
    const userId = tokenData.ui;
    const userEmail = tokenData.ue;

    // Verify the approver is the specific owner this token was generated for
    if (approverId !== ownerId) {
      throw workspaceError.WORKSPACE_ACCESS_REQUEST_NOT_OWNER();
    }

    // Verify approver is still an owner of the workspace (role may have changed)
    const approverMember = await this.deps.workspaceMemberService.getMember(
      approverId,
      workspaceId
    );
    if (!approverMember || approverMember.workspaceRole !== 'owner') {
      throw workspaceError.WORKSPACE_ACCESS_REQUEST_NOT_OWNER();
    }

    // Get workspace name
    const workspace = await this.deps.workspaceService.getById(workspaceId);

    // Check if user is already a member (might have been added by another owner)
    const existingMember = await this.deps.workspaceMemberService.getMember(userId, workspaceId);
    if (existingMember) {
      return {
        workspaceId,
        workspaceName: workspace.workspaceName,
        userId,
        userEmail,
        status: 'approved',
      };
    }

    // Add user as member
    await this.deps.db.transaction(async (tx) => {
      await this.deps.workspaceMemberService.addMember(
        {
          userId,
          workspaceId,
          role: 'member',
        },
        { tx }
      );
    });

    return {
      workspaceId,
      workspaceName: workspace.workspaceName,
      userId,
      userEmail,
      status: 'approved',
    };
  }

  /**
   * Decline a workspace access request
   * Does not add the user as a member
   * Throws WORKSPACE_ACCESS_REQUEST_INVALID if token is invalid/expired
   * Throws WORKSPACE_ACCESS_REQUEST_NOT_OWNER if decliner is not the designated owner
   */
  async declineAccessRequest(params: { token: string; declinerId: string }): Promise<{
    workspaceId: string;
    workspaceName: string;
    userId: string;
    userEmail: string;
    status: 'declined';
  }> {
    const { token, declinerId } = params;

    // Verify and decode access request token
    const tokenData = this.deps.tokenService.verifyAccessRequestToken(token);
    if (!tokenData) {
      throw workspaceError.WORKSPACE_ACCESS_REQUEST_INVALID();
    }

    const workspaceId = tokenData.wi;
    const ownerId = tokenData.oi;
    const userId = tokenData.ui;
    const userEmail = tokenData.ue;

    // Verify the decliner is the specific owner this token was generated for
    if (declinerId !== ownerId) {
      throw workspaceError.WORKSPACE_ACCESS_REQUEST_NOT_OWNER();
    }

    // Verify decliner is still an owner of the workspace (role may have changed)
    const declinerMember = await this.deps.workspaceMemberService.getMember(
      declinerId,
      workspaceId
    );
    if (!declinerMember || declinerMember.workspaceRole !== 'owner') {
      throw workspaceError.WORKSPACE_ACCESS_REQUEST_NOT_OWNER();
    }

    // Get workspace name
    const workspace = await this.deps.workspaceService.getById(workspaceId);

    return {
      workspaceId,
      workspaceName: workspace.workspaceName,
      userId,
      userEmail,
      status: 'declined',
    };
  }
}
