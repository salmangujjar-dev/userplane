/**
 * Copy for Billing - Subscription Plan Change Email
 */

export const copy = {
  preview: (previousPlan: string, newPlan: string) =>
    `Plan changed from ${previousPlan} to ${newPlan}`,
  title: 'Plan updated',
  subtitle: (previousPlan: string, newPlan: string) => `Changed from ${previousPlan} to ${newPlan}`,
  body: [
    (newPlan: string, effectiveDate: string) =>
      `Your subscription has been updated to ${newPlan}. The change takes effect on ${effectiveDate}.`,
    'Your new plan limits and features are now active.',
  ],
  cta: 'View billing details',
} as const;
