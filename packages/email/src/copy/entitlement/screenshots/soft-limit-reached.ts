/**
 * Copy for Entitlement Screenshots - Soft Limit Reached Email
 */

export const copy = {
  preview: (workspaceName: string) => `${workspaceName} is approaching its screenshot limit`,
  title: 'Approaching screenshot limit',
  subtitle: (usedScreenshots: number, totalScreenshots: number) =>
    `${usedScreenshots} of ${totalScreenshots} screenshots used this month`,
  body: [
    'Your workspace is nearing its monthly screenshot limit. Add more screenshots or upgrade your plan to continue receiving screenshots.',
  ],
  cta: 'Add screenshots',
} as const;
