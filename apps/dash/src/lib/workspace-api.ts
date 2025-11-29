/**
 * Workspace API utilities
 *
 * These are placeholder functions that should be implemented with actual API calls
 * when the backend is ready.
 */

export interface Project {
  id: string;
  name: string;
  workspaceId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InviteToken {
  token: string;
  workspaceId: string;
  expiresAt: string;
  createdBy: string;
}

/**
 * Fetch all projects for a given workspace
 * @param workspaceId - The workspace ID
 * @returns Promise resolving to an array of projects
 */
export async function fetchWorkspaceProjects(workspaceId: string): Promise<Project[]> {
  // TODO: Implement actual API call
  // Example: return apiClient.get(`/workspaces/${workspaceId}/projects`);

  console.log('Fetching projects for workspace:', workspaceId);

  // Mock data for now
  return Promise.resolve([
    { id: '1', name: 'Project 1', workspaceId },
    { id: '2', name: 'Project 2', workspaceId },
    { id: '3', name: 'Project 3', workspaceId },
  ]);
}

/**
 * Generate or fetch an invite token for a workspace
 * @param workspaceId - The workspace ID
 * @returns Promise resolving to an invite token object
 */
export async function generateWorkspaceInviteToken(workspaceId: string): Promise<InviteToken> {
  // TODO: Implement actual API call
  // Example: return apiClient.post(`/workspaces/${workspaceId}/invite-token`);

  console.log('Generating invite token for workspace:', workspaceId);

  // Mock data for now
  return Promise.resolve({
    token: `invite-${workspaceId}-${Date.now()}`,
    workspaceId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    createdBy: 'current-user-id',
  });
}

/**
 * Send email invitations to join a workspace
 * @param workspaceId - The workspace ID
 * @param emails - Array of email addresses to invite
 * @returns Promise resolving when invites are sent
 */
export async function sendWorkspaceInvites(workspaceId: string, emails: string[]): Promise<void> {
  // TODO: Implement actual API call
  // Example: return apiClient.post(`/workspaces/${workspaceId}/invites`, { emails });

  console.log('Sending workspace invites:', { workspaceId, emails });

  // Mock implementation
  return Promise.resolve();
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
  // TODO: Implement actual API call
  // Example: return apiClient.post(`/workspaces/${workspaceId}/links`, params);

  console.log('Creating recording link for workspace:', { workspaceId, ...params });

  // Mock implementation
  const linkId = Math.random().toString(36).substring(7);
  return Promise.resolve(`https://userplane.com/r/${linkId}`);
}
