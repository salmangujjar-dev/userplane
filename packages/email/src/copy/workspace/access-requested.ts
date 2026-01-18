/**
 * Copy for Workspace - Access Requested Email
 */

export const copy = {
  preview: (requesterName: string, workspaceName: string) =>
    `${requesterName} requested access to ${workspaceName}`,
  title: 'Access request',
  subtitle: (requesterName: string, workspaceName: string) =>
    `${requesterName} wants to join ${workspaceName}`,
  body: [
    (requesterName: string, requesterEmail: string) =>
      `${requesterName} (${requesterEmail}) has requested to join your workspace. Review their request and approve or decline.`,
  ],
  cta: 'Review request',
} as const;
