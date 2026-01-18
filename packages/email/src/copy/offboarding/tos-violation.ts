/**
 * Copy for Offboarding - TOS Violation Email
 */

const formatGreeting = (userName: string) => {
  const trimmedName = userName?.trim();
  return trimmedName ? `Hi ${trimmedName},` : 'Hi there,';
};

export const copy = {
  preview: 'Your Userplane account has been suspended',
  title: 'Account suspended',
  greeting: (userName: string) => formatGreeting(userName),
  body: [
    'Your Userplane account has been suspended due to a violation of our terms of service. Access to your workspace and recordings is temporarily disabled.',
    'If you believe this is an error, you can submit an appeal.',
  ],
  cta: 'Submit appeal',
  helpText: 'terms of service',
} as const;
