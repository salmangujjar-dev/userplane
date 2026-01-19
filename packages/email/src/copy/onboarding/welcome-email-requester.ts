/**
 * Copy for Onboarding - Welcome Email Requester
 */

export const copy = {
  preview: 'Access request approved',
  title: 'Access request approved',
  greeting: (userName: string) => `Hi ${userName},`,
  body: (workspaceName: string) =>
    `Your request to join ${workspaceName} has been approved. You can now access recordings, projects, and collaborate with the team.`,
  body2: 'If you have any questions, reach out to your workspace administrator.',
  cta: 'Go to workspace',
} as const;
