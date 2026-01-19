/**
 * Copy for Billing - Billing Email Verification
 */

export const copy = {
  preview: 'Verify your billing email address',
  title: 'Verify billing email address',
  subtitle: (workspaceName: string) =>
    `Someone requested to change the billing email for ${workspaceName}`,
  body: [
    'Please verify this email address to complete the billing email update. Click the button below to confirm this change.',
    'This link will expire in 10 minutes. If you did not request this change, you can safely ignore this email.',
  ],
  cta: 'Verify billing email',
} as const;
