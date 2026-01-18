/**
 * Copy for Project - Deletion Scheduled Email
 */

export const copy = {
  preview: (projectName: string, deletionDate: string) =>
    `${projectName} scheduled for deletion on ${deletionDate}`,
  title: 'Project deletion scheduled',
  subtitle: (projectName: string, deletionDate: string) =>
    `${projectName} will be deleted on ${deletionDate}`,
  body: [
    (deletionDate: string) =>
      `Your project and all associated data will be permanently deleted on ${deletionDate}. This includes recordings, recording links, and project settings.`,
    'You can cancel this deletion before the scheduled date.',
  ],
  cta: 'Cancel deletion',
} as const;
