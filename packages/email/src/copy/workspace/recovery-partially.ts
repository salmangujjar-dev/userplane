/**
 * Copy for Workspace - Recovery Partially Email
 * Sent when a workspace has been partially restored
 */

export const copy = {
  preview: (workspaceName: string) => `${workspaceName} was partially restored`,
  title: 'Workspace partially restored',
  subtitle: (workspaceName: string) => `${workspaceName} has been partially restored`,
  body: [
    'Your workspace has been partially restored. You can now request recordings and create new recording links.',
    'Some features may still be limited. Contact support if you need full restoration.',
  ],
  cta: 'Go to dashboard',
} as const;
