/**
 * Copy for Trial Reverse Trial Offer Email
 */

export const copy = {
  preview: "Upgrade with confidence - full refund if it doesn't work",
  title: (remainingDays: number) => `Your trial ends in ${remainingDays} days`,
  subtitle: (trialDays: number) => `Upgrade risk-free with our ${trialDays}-day refund guarantee`,
  body: [
    'If Userplane has not helped you resolve customer issues faster, we will refund your payment. No forms. No approvals.',
    'Keep your recordings, recording links, and workspace settings by upgrading before your trial ends.',
  ],
  cta: (planName: string) => `Upgrade to ${planName}`,
  ps: 'Full refund within 30 days. Reply to this email to request one.',
} as const;
