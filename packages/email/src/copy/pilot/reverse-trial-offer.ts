/**
 * Copy for Pilot Reverse Trial Offer Email
 */

export const copy = {
  preview: 'Try Userplane risk-free with a full refund guarantee',
  title: 'Try Userplane risk-free',
  subtitle: (trialDays: number, planName: string) =>
    `${trialDays}-day money-back guarantee on ${planName}`,
  body: [
    (planName: string, trialDays: number) =>
      `Start with ${planName} today. If Userplane does not reduce your back-and-forth with customers within ${trialDays} days, we will refund your payment in full.`,
    'No hoops. No partial credits. Just a straightforward refund.',
  ],
  cta: (planName: string) => `Start ${planName}`,
  ps: 'Full refund within 30 days, no questions asked.',
} as const;
