/**
 * Copy for Offboarding - Account Deletion Email
 */

const formatGreeting = (userName: string) => {
  const trimmedName = userName?.trim();
  return trimmedName ? `Hi ${trimmedName},` : 'Hi there,';
};

export const copy = {
  preview: 'Your Userplane account has been deleted',
  title: 'Account deleted',
  greeting: (userName: string) => formatGreeting(userName),
  body: [
    'Your Userplane account and all associated data have been permanently deleted. This includes recordings, recording links, and workspace settings.',
    'If you have feedback about your experience, we would appreciate hearing from you.',
  ],
  cta: 'Share feedback',
} as const;
