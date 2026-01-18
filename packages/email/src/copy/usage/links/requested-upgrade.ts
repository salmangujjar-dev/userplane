/**
 * Copy for Usage Links - Requested Upgrade Email
 */

export const copy = {
  preview: (requesterName: string) => `${requesterName} requested more links`,
  title: 'Links upgrade requested',
  subtitle: (requesterName: string) => `${requesterName} requested additional links`,
  body: [
    (workspaceName: string) =>
      `A member of ${workspaceName} has requested more links. Review and add links if needed.`,
  ],
  cta: 'Review billing',
} as const;
