/**
 * Copy for Billing - Subscription Reverse Trial Email
 */

export const copy = {
  preview: (planName: string, trialDays: number) =>
    `Your ${planName} plan is active with a ${trialDays}-day refund guarantee`,
  title: (planName: string) => `Welcome to ${planName}`,
  subtitle: (trialDays: number) => `${trialDays}-day money-back guarantee`,
  body: [
    (planName: string, trialDays: number) =>
      `Your ${planName} subscription is active. If Userplane does not help you resolve customer issues faster within ${trialDays} days, we will refund your payment in full.`,
    'No questions asked.',
  ],
  cta: 'Go to dashboard',
  ps: (trialDays: number) =>
    `Full refund available within ${trialDays} days. Reply to request one.`,
} as const;
