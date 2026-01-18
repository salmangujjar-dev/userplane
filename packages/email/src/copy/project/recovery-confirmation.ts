/**
 * Copy for Project - Recovery Confirmation Email
 */

export const copy = {
  preview: (projectName: string) => `${projectName} has been recovered`,
  title: 'Project recovered',
  subtitle: (projectName: string) => `${projectName} is now active`,
  body: [
    'Your project has been successfully recovered. All data including recordings, recording links, and project settings have been restored.',
  ],
  cta: 'Go to project',
} as const;
