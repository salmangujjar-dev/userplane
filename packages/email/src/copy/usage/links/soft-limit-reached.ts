/**
 * Copy for Usage Links - Soft Limit Reached Email
 */

export const copy = {
  preview: (workspaceName: string) => `${workspaceName} is approaching its links limit`,
  title: 'Approaching links limit',
  subtitle: (usedLinks: number, totalLinks: number) =>
    `${usedLinks} of ${totalLinks} links used this month`,
  body: [
    'Your workspace is nearing its monthly links limit. Add more links or upgrade your plan to continue creating links.',
  ],
  cta: 'Add links',
} as const;
