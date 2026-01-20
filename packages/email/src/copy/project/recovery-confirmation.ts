/**
 * Copy for Project - Recovery Confirmation Email
 */

export const copy = {
  preview: (projectName: string) => `${projectName} has been recovered`,
  title: 'Project recovered',
  subtitle: (projectName: string) => `${projectName} is now active`,
  body: [
    'Your project has been fully restored and is ready to go.',
    'All associated recordings, links, and project settings should now be available.',
  ],
  cta: 'Go to project',
} as const;
