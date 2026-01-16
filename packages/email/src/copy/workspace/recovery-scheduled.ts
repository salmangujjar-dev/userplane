/**
 * Copy for Workspace - Recovery Scheduled Email
 */

export const copy = {
  preview: (workspaceName: string) => `${workspaceName} deletion cancelled - recovery in progress`,
  title: 'Deletion cancelled',
  subtitle: (workspaceName: string) => `${workspaceName} is being restored`,
  body: [
    (workspaceName: string) =>
      `The scheduled deletion for ${workspaceName} has been cancelled. Your workspace, recordings, and settings are being restored.`,
    'Recovery typically completes within a few minutes.',
  ],
  cta: 'Go to dashboard',
} as const;
