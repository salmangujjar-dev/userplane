/**
 * Copy for Billing - Subscription Active Email
 */

export const copy = {
  preview: (planName: string) => `Your ${planName} subscription is now active`,
  title: 'Subscription active',
  subtitle: (planName: string) => `Your ${planName} plan is now live`,
  body: [
    (planName: string) =>
      `Your ${planName} subscription is active. You now have access to all features included in your plan.`,
  ],
  cta: 'Go to dashboard',
  helpText: 'Manage billing',
} as const;
