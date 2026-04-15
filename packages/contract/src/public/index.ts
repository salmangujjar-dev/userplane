/**
 * Public API module exports
 * Contains contracts, schemas, and errors for the public API and API key management.
 */

export * from './errors';
export * from './schemas';

// Contract exports (named to avoid collisions)
import * as apiKey from './api-key.contract';
import * as publicApi from './contract';

/**
 * Public API contract
 * API-key authenticated endpoints
 */
export const publicApiContract = {
  me: publicApi.getMe,
  workspaces: {
    list: publicApi.listWorkspaces,
  },
  links: {
    list: publicApi.listLinks,
    create: publicApi.createLink,
    getById: publicApi.getLinkById,
    update: publicApi.updateLink,
    delete: publicApi.deleteLink,
  },
  recordings: {
    list: publicApi.listRecordings,
    getById: publicApi.getRecordingById,
    delete: publicApi.deleteRecording,
    resources: {
      video: publicApi.getRecordingVideo,
      thumbnail: publicApi.getRecordingThumbnail,
      consoleLog: publicApi.getRecordingConsoleLog,
      networkLog: publicApi.getRecordingNetworkLog,
      action: publicApi.getRecordingAction,
    },
  },
  workspace: {
    get: publicApi.getWorkspace,
    inviteUrl: publicApi.getInviteUrl,
  },
  domains: {
    list: publicApi.listDomains,
  },
  projects: {
    list: publicApi.listProjects,
    getById: publicApi.getProjectById,
  },
  members: {
    list: publicApi.listMembers,
  },
  search: publicApi.searchWorkspace,
};

/**
 * API key management contract
 * Session-authenticated endpoints
 */
export const apiKeyContract = {
  create: apiKey.createApiKey,
  list: apiKey.listApiKeys,
  delete: apiKey.deleteApiKey,
  rotate: apiKey.rotateApiKey,
};

export type PublicApiContract = typeof publicApiContract;
export type ApiKeyContract = typeof apiKeyContract;
