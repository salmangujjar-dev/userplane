/**
 * Copy for Billing - Subscription Expired Email
 */

export const copy = {
  preview: 'Your Userplane subscription has expired',
  title: 'Subscription expired',
  subtitle: (planName: string) => `Your ${planName} plan has ended`,
  body: [
    'Your subscription has expired. New recordings are disabled and access to some features is restricted.',
    'Renew to restore full access.',
  ],
  cta: 'Renew subscription',
} as const;
