/**
 * Copy for Onboarding - Welcome Email Pilot
 */

export const copy = {
  preview: 'Welcome to Userplane - Your pilot account is ready',
  title: 'Welcome to Userplane',
  greeting: (userName: string) => `Hi ${userName},`,
  body: {
    intro: (workspaceName: string) =>
      `Thanks for joining our pilot program. Your workspace "${workspaceName}" is ready and we are excited to have you on board.`,
    explore:
      'Start exploring by creating your first recording link. If you have any questions or feedback, we would love to hear from you.',
    call: 'Want to discuss your use case? Book a quick call with the team.',
  },
  cta: 'Go to dashboard',
  secondaryCta: 'Book a call',
} as const;
