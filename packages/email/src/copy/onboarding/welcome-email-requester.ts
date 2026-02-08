/**
 * Copy for Onboarding - Welcome Email Requester
 */

export const copy = {
  preview: 'Access request approved',
  title: 'Access request approved',
  body: [
    (workspaceName: string) =>
      `Your request to join ${workspaceName} has been approved. You can now access recordings, projects, and collaborate with rest of your team on Userplane.`,
    'Userplane helps you capture customer issues with screen recordings and console logs, so you can see exactly what went wrong and resolve issues faster—without the back-and-forth.',
  ],
  cta: 'Go to workspace',
  footer: "Need help getting started or have questions or feedback? We'd love to hear from you.",
} as const;
