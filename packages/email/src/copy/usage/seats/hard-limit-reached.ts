/**
 * Copy for Usage Seats - Hard Limit Reached Email
 */

export const copy = {
  preview: (workspaceName: string) => `${workspaceName} has reached its seat limit`,
  title: 'Seat limit reached',
  subtitle: (totalSeats: number, workspaceName: string) =>
    `All ${totalSeats} seats in ${workspaceName} are in use`,
  body: [
    'Your workspace has reached its seat limit. New invitations are blocked until you add more seats or remove existing members.',
  ],
  cta: 'Add more seats',
} as const;
