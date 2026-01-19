/**
 * Copy for Onboarding - Welcome Email Member
 */

export const copy = {
  preview: 'Welcome to the team',
  title: 'Welcome to the team',
  greeting: (userName: string) => `Hi ${userName},`,
  body: (workspaceName: string) =>
    `You are now a member of ${workspaceName}. You can start viewing recordings, managing projects, and collaborating with your team.`,
  body2: 'If you have any questions, feel free to reach out to your workspace administrator.',
  cta: 'Go to workspace',
} as const;
