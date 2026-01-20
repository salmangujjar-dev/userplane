/**
 * Copy for Workspace - Recovery Confirmation Email
 */

export const copy = {
  preview: (workspaceName: string) => `${workspaceName} has been restored`,
  title: 'Workspace restored',
  subtitle: (workspaceName: string) => `${workspaceName} is ready to use`,
  body: [
    'Your workspace has been fully restored and is ready to go.',
    'All associated recordings, links, projects, and domains should now be available.',
  ],
  cta: 'Go to dashboard',
} as const;
