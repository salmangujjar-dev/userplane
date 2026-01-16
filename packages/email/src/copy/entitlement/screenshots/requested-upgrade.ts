/**
 * Copy for Entitlement Screenshots - Requested Upgrade Email
 */

export const copy = {
  preview: (requesterName: string) => `${requesterName} requested more screenshots`,
  title: 'Screenshot upgrade requested',
  subtitle: (requesterName: string) => `${requesterName} requested additional screenshots`,
  body: [
    (workspaceName: string) =>
      `A member of ${workspaceName} has requested more screenshots. Review and add screenshots if needed.`,
  ],
  cta: 'Review billing',
} as const;
