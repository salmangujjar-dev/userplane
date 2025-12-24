/**
 * Userplane API Contracts
 *
 * Individual contracts per domain for modular imports.
 * Each contract can be implemented independently.
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
 * Status contract
 * Public endpoints for API information and health checks
 */
export const statusContract = {
  apiInfo: status.apiInfo,
  health: status.health,
};

/**
 * Account contract
 * User account management operations
 */
export const accountContract = {
  get: account.getAccount,
  update: account.updateAccount,
};

/**
 * Provisioner contract
 * Workspace creation and setup
 */
export const provisionerContract = {
  createWorkspace: provisioner.createWorkspace,
};

/**
 * Workspace contract
 * Workspace management, members, domains, and settings
 */
export const workspaceContract = {
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
    get: workspace.getNotificationPreferences,
    update: workspace.updateNotificationPreferences,
  },

  invite: {
    getUrl: workspace.getInviteUrl,
    rotate: workspace.rotateInviteToken,
    send: workspace.sendWorkspaceInvites,
    accept: workspace.acceptInvite,
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
};

/**
 * Invite contract
 * Public invitation validation
 * Note: Sending invites is part of workspace contract
 */
export const inviteContract = {
  validate: invite.validateInvite,
};

/**
 * Domain contract
 * Public domain verification
 */
export const domainContract = {
  verify: domain.verifyDomain,
};

/**
 * Project contract
 * Project management operations
 */
export const projectContract = {
  list: project.getProjects,
  create: project.createProject,
  getById: project.getProjectById,
  update: project.updateProject,
  replace: project.replaceProject,
  delete: project.deleteProject,
};

/**
 * Link contract
 * Recording link management
 */
export const linkContract = {
  list: link.getLinks,
  create: link.createLink,
  getById: link.getLinkById,
  update: link.updateLink,
  delete: link.deleteLink,
};

/**
 * Recording contract
 * Recording management and resource access
 */
export const recordingContract = {
  list: recording.getRecordings,
  getById: recording.getRecordingById,
  delete: recording.deleteRecording,
  resources: {
    video: recording.getRecordingVideo,
    thumbnail: recording.getRecordingThumbnail,
    consoleLog: recording.getRecordingConsoleLog,
    networkLog: recording.getRecordingNetworkLog,
    action: recording.getRecordingAction,
  },
};

/**
 * Session contract
 * Recording session and upload management
 */
export const sessionContract = {
  init: session.getSession,
  upload: {
    init: session.initUpload,
    complete: session.completeUpload,
  },
};

/**
 * Complete API contract
 * Combines all domain contracts for full API implementation
 */
export const contract = {
  status: statusContract,
  account: accountContract,
  provisioner: provisionerContract,
  workspace: workspaceContract,
  invite: inviteContract,
  domain: domainContract,
  project: projectContract,
  link: linkContract,
  recording: recordingContract,
  session: sessionContract,
};

/**
 * Contract types
 */
export type StatusContract = typeof statusContract;
export type AccountContract = typeof accountContract;
export type ProvisionerContract = typeof provisionerContract;
export type WorkspaceContract = typeof workspaceContract;
export type InviteContract = typeof inviteContract;
export type DomainContract = typeof domainContract;
export type ProjectContract = typeof projectContract;
export type LinkContract = typeof linkContract;
export type RecordingContract = typeof recordingContract;
export type SessionContract = typeof sessionContract;
export type Contract = typeof contract;
