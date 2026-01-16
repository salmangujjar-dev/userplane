/**
 * Copy for Domain - Developer Instructions Email
 * Instructions for integrating Userplane SDK into a domain
 */

export const copy = {
  preview: (domainName: string) => `Setup Userplane for ${domainName}`,
  title: 'Verify domain',
  subtitle: (domainName: string) => `Add the Userplane script to ${domainName}`,
  body: [
    (domainName: string) =>
      `To start capturing user sessions on ${domainName}, add the Userplane script to your website.`,
    'After adding the script, you can configure recording preferences and start debugging user issues with session replays, console logs, and network activity.',
  ],
  cta: 'Go to Settings',
  helpText: 'View detailed integration guide',
} as const;
