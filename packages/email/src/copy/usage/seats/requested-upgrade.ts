/**
 * Copy for Usage Seats - Requested Upgrade Email
 */

export const copy = {
  preview: (requesterName: string, workspaceName: string) =>
    `${requesterName} requested more seats for ${workspaceName}`,
  title: 'Seat upgrade requested',
  subtitle: (requesterName: string) => `${requesterName} requested additional seats`,
  body: [
    (workspaceName: string) =>
      `A member of ${workspaceName} has requested more seats for the workspace. Review and add seats if needed.`,
  ],
  cta: 'Review billing',
} as const;
