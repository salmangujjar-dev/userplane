/**
 * Copy for Entitlement Recordings - Soft Limit Reached Email
 */

export const copy = {
  preview: (workspaceName: string) => `${workspaceName} is approaching its recording limit`,
  title: 'Approaching recording limit',
  subtitle: (usedMinutes: number, totalMinutes: number) =>
    `${usedMinutes} of ${totalMinutes} minutes used this month`,
  body: [
    'Your workspace is nearing its monthly recording limit. Add more recording minutes or upgrade your plan to continue receiving recordings.',
  ],
  cta: 'Add recordings',
} as const;
