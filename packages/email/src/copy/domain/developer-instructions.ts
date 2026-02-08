/**
 * Copy for Domain - Developer Instructions Email
 * Instructions for integrating Userplane SDK into a domain
 */

export const copy = {
  preview: 'Install Userplane on your app',
  title: 'Install Userplane on your app',
  greeting: (userName: string | undefined, domainUrl: string | undefined) => {
    const who = userName || 'We';
    const domain = domainUrl ? ` (${domainUrl})` : '';
    return {
      prefix: `${who} need${userName ? 's' : ''} your help to install Userplane on your `,
      linkText: 'app',
      suffix: `${domain}.`,
    };
  },
  body: 'Just click the link below to get direct access to the code snippet and simple installation instructions.',
  cta: 'Get Started',
  fallbackText: 'Or copy this link',
  footer:
    'After adding the script, you can redact sensitive customer data and debug issues using console logs, and network activity capture.',
} as const;
