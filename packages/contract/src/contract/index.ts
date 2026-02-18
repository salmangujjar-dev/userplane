/**
 * Userplane API Contracts
 *
 * Individual contracts per domain for modular imports.
 * Each contract can be implemented independently.
 */

import * as account from './account';
import * as admin from './admin';
import * as billing from './billing';
import * as diagnostics from './diagnostics';
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
 * Admin contract
 * Admin user and workspace management operations
 */
export const adminContract = {
  users: {
    search: admin.searchUsers,
    get: admin.getUser,
    ban: admin.banUser,
    unban: admin.unbanUser,
    sessions: {
      list: admin.listUserSessions,
      revokeAll: admin.revokeAllSessions,
    },
    workspaces: {
      list: admin.listUserWorkspaces,
    },
  },
  sessions: {
    revoke: admin.revokeSession,
  },
  workspaces: {
    search: admin.searchWorkspaces,
    get: admin.getWorkspace,
    members: {
      list: admin.listWorkspaceMembers,
    },
    projects: {
      list: admin.listWorkspaceProjects,
    },
    deactivate: admin.deactivateWorkspace,
    restore: admin.restoreWorkspace,
    resetInviteToken: admin.resetInviteToken,
    recordingStats: admin.getWorkspaceRecordingStats,
    memberRecordingStats: admin.getWorkspaceMemberRecordingStats,
    entitlements: {
      get: admin.getWorkspaceEntitlements,
      update: admin.updateWorkspaceEntitlements,
    },
  },
  projects: {
    deactivate: admin.deactivateProject,
    restore: admin.restoreProject,
  },
  workspace: {
    createInvite: admin.createWorkspaceInvite,
  },
  plans: {
    list: admin.listPlans,
    get: admin.getPlan,
    create: admin.createPlan,
    update: admin.updatePlan,
  },
};

/**
 * Provisioner contract
 * Workspace creation and setup
 */
export const provisionerContract = {
  createWorkspace: provisioner.createWorkspace,
  intercom: {
    authorize: provisioner.intercomAuthorize,
    callback: provisioner.intercomCallback,
  },
};

/**
 * Workspace contract
 * Workspace management, members, domains, and settings
 */
export const workspaceContract = {
  list: workspace.getAllWorkspaces,
  count: workspace.countWorkspaces,
  getById: workspace.getWorkspaceById,
  getResourcesCount: workspace.getWorkspaceResourcesCount,
  status: workspace.getWorkspaceStatus,
  updateName: workspace.updateWorkspaceName,
  delete: workspace.deleteWorkspace,
  getRestoreInfo: workspace.getWorkspaceRestoreInfo,
  restore: workspace.restoreWorkspace,
  search: workspace.workspaceSearch,
  suggest: workspace.suggestWorkspaces,
  join: workspace.joinWorkspace,

  preferences: {
    get: workspace.getWorkspacePreferences,
    update: workspace.updateWorkspacePreferences,
  },

  logo: {
    upload: workspace.uploadWorkspaceLogo,
  },

  members: {
    list: workspace.getWorkspaceMembers,
    getMembership: workspace.getWorkspaceMembership,
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

  invitePolicy: {
    get: workspace.getInvitePolicy,
    update: workspace.updateInvitePolicy,
  },

  accessRequest: {
    validate: workspace.validateAccessRequest,
    approve: workspace.approveAccessRequest,
    decline: workspace.declineAccessRequest,
  },

  domains: {
    list: workspace.getWorkspaceDomains,
    getById: workspace.getDomainById,
    add: workspace.addDomain,
    update: workspace.updateDomain,
    delete: workspace.deleteDomain,
    getVerificationUrl: workspace.getDomainVerificationUrl,
    sendInstructions: workspace.sendDomainInstructions,
    preferences: {
      get: workspace.getDomainRecordingPreferences,
      update: workspace.updateDomainRecordingPreferences,
      replace: workspace.replaceDomainRecordingPreferences,
    },
  },

  linkSettings: {
    update: workspace.updateLinkSettings,
  },

  integrations: {
    intercom: {
      get: workspace.getIntercomIntegration,
      authorize: workspace.intercomIntegrationAuthorize,
      callback: workspace.intercomIntegrationCallback,
      delete: workspace.deleteIntercomIntegration,
      admins: workspace.getIntercomAdmins,
      suggestions: workspace.getIntercomSuggestions,
    },
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
  getRestoreInfo: project.getProjectRestoreInfo,
  restore: project.restoreProject,
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
  update: recording.updateRecording,
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
 * Billing contract
 * Subscription management and billing operations
 */
export const billingContract = billing.billingContract;

/**
 * Diagnostics contract
 * Workspace diagnostics and maintenance operations
 */
export const diagnosticsContract = {
  runDiagnostics: diagnostics.runDiagnostics,
};

/**
 * Complete API contract
 * Combines all domain contracts for full API implementation
 */
export const contract = {
  status: statusContract,
  account: accountContract,
  admin: adminContract,
  billing: billingContract,
  diagnostics: diagnosticsContract,
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
export type AdminContract = typeof adminContract;
export type BillingContract = typeof billingContract;
export type DiagnosticsContract = typeof diagnosticsContract;
export type ProvisionerContract = typeof provisionerContract;
export type WorkspaceContract = typeof workspaceContract;
export type InviteContract = typeof inviteContract;
export type DomainContract = typeof domainContract;
export type ProjectContract = typeof projectContract;
export type LinkContract = typeof linkContract;
export type RecordingContract = typeof recordingContract;
export type SessionContract = typeof sessionContract;
export type Contract = typeof contract;
