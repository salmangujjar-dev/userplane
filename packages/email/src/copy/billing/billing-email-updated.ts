/**
 * Copy for Billing - Billing Email Updated
 */

export const copy = {
  preview: 'Billing email address updated',
  title: 'Billing email updated',
  subtitle: (previousEmail: string, newEmail: string) =>
    `Changed from ${previousEmail} to ${newEmail}`,
  body: [
    'Your workspace billing email address has been successfully updated. All future invoices and billing notifications will be sent to the new email address.',
    'If you did not make this change, please contact your workspace administrator immediately.',
  ],
  cta: 'View billing details',
} as const;
