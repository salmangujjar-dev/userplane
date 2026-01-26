/**
 * Copy for Billing - Plan Change Request Email
 * Sent to workspace owners when a team member requests a plan upgrade/downgrade
 */

export const copy = {
  preview: (requesterName: string, planName: string) =>
    `${requesterName} is requesting to upgrade to ${planName}`,
  title: 'Plan upgrade request',
  body: [
    (requesterName: string, workspaceName: string, planName: string) =>
      `${requesterName} has requested to upgrade ${workspaceName} to the ${planName} plan.`,
    (customMessage?: string) =>
      customMessage ? `They added the following message: "${customMessage}"` : null,
  ],
  cta: 'Review billing settings',
  footer:
    'Only workspace owners and admins can change the subscription plan. You can review your billing settings using the button above.',
} as const;
