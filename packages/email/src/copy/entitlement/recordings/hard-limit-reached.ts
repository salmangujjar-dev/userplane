/**
 * Copy for Entitlement Recordings - Hard Limit Reached Email
 */

export const copy = {
  preview: (workspaceName: string) => `${workspaceName} has reached its recording limit`,
  title: 'Recording limit reached',
  subtitle: (totalMinutes: number) =>
    `All ${totalMinutes} recording minutes have been used this month`,
  body: [
    'Your workspace has reached its monthly recording limit. New recordings are blocked until your limit resets or you add more minutes.',
  ],
  cta: 'Add more minutes',
} as const;
