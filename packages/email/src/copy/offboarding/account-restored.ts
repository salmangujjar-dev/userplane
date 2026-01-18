/**
 * Copy for Offboarding - Account Restored Email
 */

const formatGreeting = (userName: string) => {
  const trimmedName = userName?.trim();
  return trimmedName ? `Hi ${trimmedName},` : 'Hi there,';
};

export const copy = {
  preview: 'Your Userplane account has been restored',
  title: 'Account restored',
  greeting: (userName: string) => formatGreeting(userName),
  body: [
    'Your Userplane account has been restored and you now have full access again.',
    'You can log in and access all your recordings, recording links, and workspace settings.',
  ],
  cta: 'Log in to Userplane',
} as const;
