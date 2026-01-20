/**
 * Copy for Workspace - Recovery Partially Email
 * Sent when a workspace has been partially restored
 */

export const copy = {
  preview: (workspaceName: string) => `${workspaceName} was partially restored`,
  title: 'Workspace partially restored',
  subtitle: (workspaceName: string) => `${workspaceName} has been partially restored`,
  body: [
    'Your workspace has been partially restored with limited archival access.',
    'Recording requests and recording links should now be available.',
  ],
  cta: 'Go to dashboard',
} as const;
