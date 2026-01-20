/**
 * Copy for Billing - Billing Email Updated
 */

export const copy = {
  preview: 'Billing email address updated',
  title: 'Billing email updated',
  subtitle: 'Billing email updated for your workspace',
  body: (previousEmail: string, newEmail: string) => [
    `Your workspace billing email has been successfully updated from ${previousEmail} to ${newEmail}.`,
    'All future invoices and billing notifications will be sent to the new address.',
  ],
  cta: 'View billing details',
} as const;
