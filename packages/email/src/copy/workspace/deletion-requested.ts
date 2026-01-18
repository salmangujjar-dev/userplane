/**
 * Copy for Workspace - Deletion Requested Email
 * Sent to admins when a member requests workspace deletion
 */

export const copy = {
  preview: (requesterName: string, workspaceName: string) =>
    `${requesterName} requested to delete ${workspaceName}`,
  title: 'Workspace deletion requested',
  subtitle: (requesterName: string, requesterEmail: string, workspaceName: string) =>
    `${requesterName} (${requesterEmail}) requested to delete ${workspaceName}`,
  body: [
    (deletionDate: string) =>
      `Your workspace and all associated data will be permanently deleted on ${deletionDate}. This includes recordings, recording links, and member data.`,
    'You can cancel this deletion before the scheduled date.',
  ],
  cta: 'Cancel deletion',
} as const;
