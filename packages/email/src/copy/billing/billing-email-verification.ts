/**
 * Copy for Billing - Billing Email Verification
 */

export const copy = {
  preview: 'Verify your billing email address',
  title: 'Verify billing email address',
  subtitle: 'Confirm your new billing email address',
  body: (previousEmail: string, newEmail: string) => [
    `We received a request to update your billing email from ${previousEmail} to ${newEmail}.`,
    'Confirm your new billing email and we are all set.',
  ],
  cta: 'Verify billing email',
} as const;
