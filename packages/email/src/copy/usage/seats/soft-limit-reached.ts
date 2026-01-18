/**
 * Copy for Usage Seats - Soft Limit Reached Email
 */

export const copy = {
  preview: (workspaceName: string) => `${workspaceName} is approaching its seat limit`,
  title: 'Approaching seat limit',
  subtitle: (usedSeats: number, totalSeats: number, workspaceName: string) =>
    `${usedSeats} of ${totalSeats} seats used in ${workspaceName}`,
  body: [
    'Your workspace is nearing its seat limit. Add more seats to continue inviting teammates.',
  ],
  cta: 'Add seats',
} as const;
