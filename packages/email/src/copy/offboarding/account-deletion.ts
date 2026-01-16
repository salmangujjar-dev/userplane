/**
 * Copy for Offboarding - Account Deletion Email
 */

export const copy = {
  preview: 'Your Userplane account has been deleted',
  title: 'Account deleted',
  greeting: (userName: string) => `Hi ${userName},`,
  body: [
    'Your Userplane account and all associated data have been permanently deleted. This includes recordings, recording links, and workspace settings.',
    'If you have feedback about your experience, we would appreciate hearing from you.',
  ],
  cta: 'Share feedback',
} as const;
