/**
 * Copy for Trial Welcome - Meet the Founder Email
 */

export const copy = {
  preview: 'Welcome to Userplane - a quick note from the founder',
  title: 'Welcome to Userplane',
  greeting: (userName: string) => `Hi ${userName},`,
  body: [
    'Thanks for trying Userplane. I built this because I spent too many hours asking customers to describe bugs they could not reproduce. Screen recordings with console logs changed that.',
    'If you have 15 minutes, I would love to hear what brought you here and what you are hoping to solve.',
  ],
  cta: 'Book a quick call',
  secondaryText: 'Or reply to this email directly. I read every response.',
} as const;
