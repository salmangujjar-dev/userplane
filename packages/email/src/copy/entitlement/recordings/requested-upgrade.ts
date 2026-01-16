/**
 * Copy for Entitlement Recordings - Requested Upgrade Email
 */

export const copy = {
  preview: (requesterName: string) => `${requesterName} requested more recording minutes`,
  title: 'Recording upgrade requested',
  subtitle: (requesterName: string) => `${requesterName} requested additional recording minutes`,
  body: [
    (workspaceName: string) =>
      `A member of ${workspaceName} has requested more recording minutes. Review and add minutes if needed.`,
  ],
  cta: 'Review billing',
} as const;
