/**
 * Copy for Activation - Domain Verification Required Email
 */

export const copy = {
  preview: 'Verify your domain to start receiving recordings',
  title: 'Verify your domain',
  subtitle: (domainName: string) => `Required to receive recordings from ${domainName}`,
  body: [
    (domainName: string) =>
      `Before customers can submit recordings from ${domainName}, you need to verify domain ownership. This takes about 5 minutes.`,
    'Add a DNS TXT record to your domain settings, then click verify in your Userplane dashboard.',
  ],
  cta: 'Verify domain',
} as const;
