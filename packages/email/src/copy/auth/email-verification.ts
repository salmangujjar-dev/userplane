/**
 * Copy for Auth - Email Verification Email
 */

export const copy = {
  preview: 'Verify your email to get started with Userplane',
  title: 'Verify your email',
  greeting: (userName: string) => `Hi ${userName},`,
  body: ['Click the button below to verify your email address and complete your registration.'],
  cta: 'Verify email',
  fallbackText: 'Or copy this link',
  footer: 'If you did not create an account, you can safely ignore this email.',
} as const;
