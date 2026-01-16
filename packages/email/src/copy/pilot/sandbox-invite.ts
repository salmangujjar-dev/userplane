/**
 * Copy for Pilot Sandbox Invite Email
 */

export const copy = {
  preview: 'Your Userplane sandbox is ready',
  title: 'Your sandbox is ready',
  subtitle: 'Try Userplane with your own recordings',
  body: [
    'You now have access to a private Userplane sandbox. Request screen recordings from customers, replay issues with full context, and see how the Intercom integration works.',
    (expiresInDays: number) => `Your sandbox is active for ${expiresInDays} days.`,
  ],
  cta: 'Open sandbox',
  ps: 'Your sandbox includes 30 minutes of recordings. No credit card required.',
} as const;
