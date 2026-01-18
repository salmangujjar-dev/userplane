/**
 * Copy for Project - Deletion Confirmation Email
 */

export const copy = {
  preview: (projectName: string) => `${projectName} has been deleted`,
  title: 'Project deleted',
  subtitle: (projectName: string) => `${projectName} has been permanently deleted`,
  body: [
    'Your project and all associated data have been permanently deleted. This includes recordings, recording links, and project settings.',
    'This action cannot be undone.',
  ],
} as const;
