/**
 * Copy for Billing - Subscription Inactive Email
 */

export const copy = {
  preview: 'Your Userplane subscription is now inactive',
  title: 'Subscription inactive',
  subtitle: (planName: string) => `Your ${planName} plan has been paused`,
  body: [
    'Your subscription is no longer active. You can still access existing recordings, but new recordings and some features are disabled.',
    'Reactivate to continue using Userplane.',
  ],
  cta: 'Reactivate subscription',
} as const;
