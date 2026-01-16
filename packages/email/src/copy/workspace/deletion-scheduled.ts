/**
 * Copy for Workspace - Deletion Scheduled Email
 */

export const copy = {
  preview: (workspaceName: string, deletionDate: string) =>
    `${workspaceName} scheduled for deletion on ${deletionDate}`,
  title: 'Workspace deletion scheduled',
  subtitle: (workspaceName: string, deletionDate: string) =>
    `${workspaceName} will be deleted on ${deletionDate}`,
  body: [
    (deletionDate: string) =>
      `Your workspace and all associated data will be permanently deleted on ${deletionDate}. This includes recordings, recording links, and member data.`,
    'You can cancel this deletion before the scheduled date.',
  ],
  cta: 'Cancel deletion',
} as const;
