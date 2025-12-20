import { apiClient } from '@/client';

/**
 * Workspace API utilities
 *
 * Uses the real API client for all workspace operations
 */

export interface Project {
  id: string;
  name: string;
  workspaceId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InviteToken {
  inviteUrl: string;
  workspaceId: string;
}

/**
 * Fetch all projects for a given workspace
 * @param workspaceId - The workspace ID
 * @returns Promise resolving to an array of projects
 */
export async function fetchWorkspaceProjects(workspaceId: string): Promise<Project[]> {
  // TODO: Implement actual API call when projects endpoint is ready
  // Example: return apiClient.workspace.projects.list({ params: { workspaceId } });

  console.log('Fetching projects for workspace:', workspaceId);

  // Mock data for now
  return Promise.resolve([
    { id: '1', name: 'Project 1', workspaceId },
    { id: '2', name: 'Project 2', workspaceId },
    { id: '3', name: 'Project 3', workspaceId },
  ]);
}

/**
 * Generate or fetch an invite URL for a workspace
 * Uses the actual API to get the invite link
 * @param workspaceId - The workspace ID
 * @returns Promise resolving to an invite token object containing the invite URL
 */
export async function generateWorkspaceInviteToken(workspaceId: string): Promise<InviteToken> {
  const response = await apiClient.workspace.invite.getUrl({
    params: { workspaceId },
  });

  return {
    inviteUrl: response.data.inviteUrl,
    workspaceId: response.data.workspaceId,
  };
}

/**
 * Send email invitations to join a workspace
 * Uses the actual API to send invite emails
 * @param workspaceId - The workspace ID
 * @param emails - Array of email addresses to invite
 * @returns Promise resolving when invites are sent
 */
export async function sendWorkspaceInvites(workspaceId: string, emails: string[]): Promise<void> {
  await apiClient.workspace.invite.send({
    params: { workspaceId },
    body: { emails },
  });
}

/**
 * Create a recording link for a workspace
 * @param workspaceId - The workspace ID
 * @param params - Link creation parameters
 * @returns Promise resolving to the created link URL
 */
export async function createRecordingLink(
  workspaceId: string,
  params: {
    reference?: string;
    projectId?: string;
    domainId?: string;
    isReusable?: boolean;
  }
): Promise<string> {
  // TODO: Implement actual API call when link creation endpoint is ready
  // Example: return apiClient.workspace.links.create({ params: { workspaceId }, body: params });

  console.log('Creating recording link for workspace:', { workspaceId, ...params });

  // Mock implementation
  const linkId = Math.random().toString(36).substring(7);
  return Promise.resolve(`https://userplane.com/r/${linkId}`);
}
