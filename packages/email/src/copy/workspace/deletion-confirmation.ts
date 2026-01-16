/**
 * Copy for Workspace - Deletion Confirmation Email
 */

export const copy = {
  preview: (workspaceName: string) => `${workspaceName} has been deleted`,
  title: 'Workspace deleted',
  body: [
    (workspaceName: string) =>
      `${workspaceName} and all associated data have been permanently deleted. This includes recordings, recording links, and member data.`,
    'This action cannot be undone.',
  ],
  helpText: 'let us know',
} as const;
