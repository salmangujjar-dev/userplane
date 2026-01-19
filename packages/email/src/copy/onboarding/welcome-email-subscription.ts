/**
 * Copy for Onboarding - Welcome Email Subscription
 */

export const copy = {
  preview: 'Welcome to Userplane',
  title: 'Welcome to Userplane',
  greeting: (userName: string) => `Hi ${userName},`,
  body: [
    'Thanks for signing up. Userplane helps you capture customer issues with screen recordings and console logs, so you can fix bugs faster.',
    'Your workspace is ready. Start by creating your first recording link and share it with your customers.',
    'If you need any help getting started, check out our documentation or reach out to our support team.',
  ],
  cta: 'Go to dashboard',
} as const;
