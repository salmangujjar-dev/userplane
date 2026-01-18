/**
 * Copy for Project - Recovery Partially Email
 * Sent when a project has been partially restored
 */

export const copy = {
  preview: (projectName: string) => `${projectName} was partially restored`,
  title: 'Project partially restored',
  subtitle: (projectName: string) => `${projectName} has been partially restored`,
  body: [
    'Your project has been partially restored. You can now request recordings and create new recording links.',
    'Some features may still be limited. Contact support if you need full restoration.',
  ],
  cta: 'Go to dashboard',
} as const;
