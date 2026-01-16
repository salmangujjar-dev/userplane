/**
 * Copy for Workspace - Recovery Confirmation Email
 */

export const copy = {
  preview: (workspaceName: string) => `${workspaceName} has been restored`,
  title: 'Workspace restored',
  subtitle: (workspaceName: string) => `${workspaceName} is ready to use`,
  body: [
    'Your workspace has been fully restored. All recordings, recording links, and workspace settings are back to normal.',
  ],
  cta: 'Go to dashboard',
} as const;
