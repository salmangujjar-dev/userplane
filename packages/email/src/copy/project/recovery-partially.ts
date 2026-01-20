/**
 * Copy for Project - Recovery Partially Email
 * Sent when a project has been partially restored
 */

export const copy = {
  preview: (projectName: string) => `${projectName} was partially restored`,
  title: 'Project partially restored',
  subtitle: (projectName: string) => `${projectName} has been partially restored`,
  body: [
    'Your project has been partially restored with limited archival access.',
    'Recording requests and recording links should now be available.',
  ],
  cta: 'Go to dashboard',
} as const;
