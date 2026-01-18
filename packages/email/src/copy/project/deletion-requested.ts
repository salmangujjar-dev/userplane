/**
 * Copy for Project - Deletion Requested Email
 * Sent to admins when a member requests project deletion
 */

export const copy = {
  preview: (requesterName: string, projectName: string) =>
    `${requesterName} requested to delete ${projectName}`,
  title: 'Project deletion requested',
  subtitle: (requesterName: string, requesterEmail: string, projectName: string) =>
    `${requesterName} (${requesterEmail}) requested to delete ${projectName}`,
  body: [
    (deletionDate: string) =>
      `Your project and all associated data will be permanently deleted on ${deletionDate}. This includes recordings and recording links.`,
    'You can cancel this deletion before the scheduled date.',
  ],
  cta: 'Cancel deletion',
} as const;
