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
    'This will permanently delete all workspace data, including active recordings, projects, domains and recording links.',
    'You can cancel this deletion before the scheduled date.',
  ],
  cta: 'Cancel deletion',
} as const;
