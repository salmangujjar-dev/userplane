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
    'This will permanently delete all project data, including recordings, recording links and project settings.',
    'You can cancel this deletion before the scheduled date.',
  ],
  cta: 'Cancel deletion',
} as const;
