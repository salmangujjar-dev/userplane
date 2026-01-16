/**
 * Copy for Workspace - Access Granted Email
 */

export const copy = {
  preview: (workspaceName: string) => `You now have access to ${workspaceName}`,
  title: 'Access granted',
  subtitle: (workspaceName: string) => `You can now access ${workspaceName}`,
  body: [
    (workspaceName: string) =>
      `Your request to join ${workspaceName} has been approved. You can now view recordings, create recording links, and collaborate with your team.`,
  ],
  cta: 'Go to workspace',
} as const;
