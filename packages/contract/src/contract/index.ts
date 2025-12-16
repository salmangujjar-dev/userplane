/**
 * Userplane API Contract
 * Complete contract definition for all API endpoints
 */

import * as account from './account';
import * as domain from './domain';
import * as invite from './invite';
import * as link from './link';
import * as project from './project';
import * as provisioner from './provisioner';
import * as recording from './recording';
import * as session from './session';
import * as status from './status';
import * as workspace from './workspace';

/**
 * Complete API contract tree
 * Organized by domain for easy navigation and type-safe access
 */
export const contract = {
  /**
   * Status endpoints
   * Public endpoints for API information and health checks
   */
  status: {
    apiInfo: status.apiInfo,
    health: status.health,
  },

  /**
   * Account endpoints
   * User account management operations
   */
  account: {
    get: account.getAccount,
    update: account.updateAccount,
  },

  /**
   * Provisioner endpoints
   * Workspace creation and setup
   */
  provisioner: {
    createWorkspace: provisioner.createWorkspace,
  },

  /**
   * Workspace endpoints
   * Workspace management, members, domains, and settings
   */
  workspace: {
    list: workspace.getAllWorkspaces,
    count: workspace.countWorkspaces,
    getById: workspace.getWorkspaceById,
    updateName: workspace.updateWorkspaceName,
    delete: workspace.deleteWorkspace,
    search: workspace.workspaceSearch,

    preferences: {
      get: workspace.getWorkspacePreferences,
      update: workspace.updateWorkspacePreferences,
    },

    members: {
      list: workspace.getWorkspaceMembers,
      updateRole: workspace.updateMemberRole,
      remove: workspace.removeMember,
      leave: workspace.leaveWorkspace,
    },

    notifications: {
      update: workspace.updateNotificationPreferences,
    },

    invite: {
      getUrl: workspace.getInviteUrl,
      rotate: workspace.rotateInviteToken,
      send: workspace.sendWorkspaceInvites,
    },

    domains: {
      list: workspace.getWorkspaceDomains,
      getById: workspace.getDomainById,
      add: workspace.addDomain,
      update: workspace.updateDomain,
      delete: workspace.deleteDomain,
      getVerificationUrl: workspace.getDomainVerificationUrl,
      preferences: {
        get: workspace.getDomainRecordingPreferences,
        update: workspace.updateDomainRecordingPreferences,
        replace: workspace.replaceDomainRecordingPreferences,
      },
    },

    linkSettings: {
      update: workspace.updateLinkSettings,
    },
  },

  /**
   * Domain endpoints
   * Public domain verification endpoint
   */
  domain: {
    verify: domain.verifyDomain,
  },

  /**
   * Invite endpoints
   * Workspace invitation management
   */
  invite: {
    send: invite.sendInvites,
    action: invite.inviteAction,
  },

  /**
   * Project endpoints
   * Project management within workspaces
   */
  project: {
    list: project.getProjects,
    create: project.createProject,
    update: project.updateProject,
    replace: project.replaceProject,
    delete: project.deleteProject,
  },

  /**
   * Link endpoints
   * Recording link management
   */
  link: {
    list: link.getLinks,
    create: link.createLink,
    getById: link.getLinkById,
    update: link.updateLink,
    delete: link.deleteLink,
  },

  /**
   * Recording endpoints
   * Recording management and resource access
   */
  recording: {
    list: recording.getRecordings,
    getById: recording.getRecordingById,
    delete: recording.deleteRecording,
    resources: {
      video: recording.getRecordingVideo,
      thumbnail: recording.getRecordingThumbnail,
      consoleLog: recording.getRecordingConsoleLog,
      networkLog: recording.getRecordingNetworkLog,
    },
  },

  /**
   * Session endpoints
   * Recording session and upload management
   */
  session: {
    init: session.getSession,
    upload: {
      init: session.initUpload,
      complete: session.completeUpload,
    },
  },
};

/**
 * Export contract type for client generation
 */
export type Contract = typeof contract;
