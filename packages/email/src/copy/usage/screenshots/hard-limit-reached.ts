/**
 * Copy for Usage Screenshots - Hard Limit Reached Email
 */

export const copy = {
  preview: (workspaceName: string) => `${workspaceName} has reached its screenshot limit`,
  title: 'Screenshot limit reached',
  subtitle: (totalScreenshots: number) =>
    `All ${totalScreenshots} screenshots have been used this month`,
  body: [
    'Your workspace has reached its monthly screenshot limit. New screenshots are blocked until your limit resets or you add more.',
  ],
  cta: 'Add more screenshots',
} as const;
